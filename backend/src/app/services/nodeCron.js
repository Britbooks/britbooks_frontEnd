import cron from "node-cron";
import redis from "../../lib/config/redisClient.js";
import { generateListingsFile } from "../services/listingExportService.js";
import { uploadToSftp } from "../../lib/config/sftp/sftpClient.js";
import { getAllListingsForAdmin } from "../services/marketPlaceService.js";
import { MarketplaceListing } from "../models/MarketPlace.js";
import Campaign from "../models/Campaign.js";
import mongoose from "mongoose";
import pLimit from "p-limit";
import axios from "axios";
import { Resend } from "resend";


const limit = pLimit(5); 

//
// ────────────────────────────────────────────────────────────






export const warmCategoriesCache = async () => {
  console.log("🔥 Categories cache warm STARTED", new Date().toISOString());

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ DB connected for categories");

    const categories = await MarketplaceListing.aggregate([
      // 1️⃣ Only active listings
      {
        $match: { isPublished: true, isArchived: { $ne: true } }
      },

      // 2️⃣ Normalize text
      {
        $addFields: {
          catLower: { $toLower: { $trim: { input: { $ifNull: ["$category", ""] } } } },
          subLower: { $toLower: { $trim: { input: { $ifNull: ["$subcategory", ""] } } } },
          tagsLower: {
            $cond: [
              { $isArray: "$autoCategorizedTags" },
              { $map: { input: "$autoCategorizedTags", as: "t", in: { $toLower: "$$t" } } },
              []
            ]
          }
        }
      },

      // 3️⃣ TOP CATEGORY CLASSIFIER
      {
        $addFields: {
          topCategory: {
            $cond: {
              // 🧒 CHILDREN FIRST (most specific)
              if: {
                $or: [
                  { $regexMatch: { input: "$catLower", regex: /(child|children|kids|teen|toddler|nursery|picture book)/i } },
                  { $regexMatch: { input: "$subLower", regex: /(child|children|kids|teen|toddler|nursery|picture book)/i } },
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: "$tagsLower",
                            as: "tag",
                            cond: { $regexMatch: { input: "$$tag", regex: /(child|children|kids|teen|toddler|nursery|picture book)/i } }
                          }
                        }
                      },
                      0
                    ]
                  }
                ]
              },
              then: "Children's Books",

              else: {
                $cond: {
                  // 📚 NON-FICTION BEFORE FICTION (critical fix)
                  if: {
                    $or: [
                      { $regexMatch: { input: "$catLower", regex: /non[\s-]?fiction/i } },
                      { $regexMatch: { input: "$subLower", regex: /non[\s-]?fiction/i } },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: "$tagsLower",
                                as: "tag",
                                cond: { $regexMatch: { input: "$$tag", regex: /non[\s-]?fiction/i } }
                              }
                            }
                          },
                          0
                        ]
                      }
                    ]
                  },
                  then: "Non-Fiction",

                  else: {
                    $cond: {
                      // 📖 FICTION AFTER
                      if: {
                        $or: [
                          { $regexMatch: { input: "$catLower", regex: /(^|\b)fiction(\b|$)/i } },
                          { $regexMatch: { input: "$subLower", regex: /(^|\b)fiction(\b|$)/i } },
                          {
                            $gt: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$tagsLower",
                                    as: "tag",
                                    cond: { $regexMatch: { input: "$$tag", regex: /(^|\b)fiction(\b|$)/i } }
                                  }
                                }
                              },
                              0
                            ]
                          }
                        ]
                      },
                      then: "Fiction",

                      else: {
                        // 🧠 Other categories
                        $switch: {
                          branches: [
                            { case: { $regexMatch: { input: "$catLower", regex: /philosophy/i } }, then: "Philosophy" },
                            { case: { $regexMatch: { input: "$catLower", regex: /education|learning/i } }, then: "Education" },
                            { case: { $regexMatch: { input: "$catLower", regex: /history/i } }, then: "History" },
                            { case: { $regexMatch: { input: "$catLower", regex: /biography|memoir/i } }, then: "Biography & Memoir" },
                            { case: { $regexMatch: { input: "$catLower", regex: /science/i } }, then: "Science" },
                            { case: { $regexMatch: { input: "$catLower", regex: /fantasy/i } }, then: "Fantasy" },
                            { case: { $regexMatch: { input: "$catLower", regex: /mystery|thriller|crime/i } }, then: "Mystery & Thriller" },
                            { case: { $regexMatch: { input: "$catLower", regex: /romance/i } }, then: "Romance" },
                            { case: { $regexMatch: { input: "$catLower", regex: /horror/i } }, then: "Horror" },
                            { case: { $regexMatch: { input: "$catLower", regex: /business|finance/i } }, then: "Business & Finance" },
                            { case: { $regexMatch: { input: "$catLower", regex: /religion|spiritual/i } }, then: "Religion & Spirituality" },
                            { case: { $regexMatch: { input: "$catLower", regex: /travel/i } }, then: "Travel" },
                            { case: { $regexMatch: { input: "$catLower", regex: /health|fitness/i } }, then: "Health & Wellness" }
                          ],
                          default: "General"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // 4️⃣ Subcategory fallback
      {
        $addFields: {
          finalSubcategory: {
            $cond: [
              { $or: [{ $eq: ["$subLower", ""] }, { $eq: ["$subLower", null] }, { $eq: ["$subLower", "n/a"] }] },
              { $arrayElemAt: ["$tagsLower", 0] },
              "$subcategory"
            ]
          }
        }
      },

      // 5️⃣ Group
      {
        $group: {
          _id: { category: "$topCategory", subcategory: "$finalSubcategory" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.category",
          count: { $sum: "$count" },
          subcategories: { $push: { name: "$_id.subcategory", count: "$count" } }
        }
      },

      // 6️⃣ Format
      {
        $project: {
          _id: 0,
          name: "$_id",
          slug: { $toLower: { $replaceAll: { input: "$_id", find: " ", replacement: "-" } } },
          count: 1,
          subcategories: {
            $map: {
              input: {
                $filter: {
                  input: "$subcategories",
                  as: "sub",
                  cond: { $and: [{ $ne: ["$$sub.name", null] }, { $ne: ["$$sub.name", ""] }] }
                }
              },
              as: "sub",
              in: {
                name: "$$sub.name",
                slug: { $toLower: { $replaceAll: { input: "$$sub.name", find: " ", replacement: "-" } } },
                count: "$$sub.count"
              }
            }
          }
        }
      },

      { $match: { count: { $gt: 0 } } },
      { $sort: { name: 1 } }
    ]).allowDiskUse(true);

    categories.forEach(cat => cat.subcategories.sort((a, b) => b.count - a.count));

    await redis.set("categories_cache", JSON.stringify(categories), "EX", 3600);

   
  } catch (err) {
    console.error("❌ Categories cache warm FAILED:", err);
  }
};







export const warmListingsCache = async () => {
  console.log("🔥 Listings cache warm STARTED", new Date().toISOString());

  try {
    const categories = [null, "Fiction", "Non-Fiction", "Children's Books"];
    const pagesToWarm = 5;

    const tasks = [];

    for (const category of categories) {
      for (let page = 1; page <= pagesToWarm; page++) {
        tasks.push(
          limit(async () => {
            try {
              // Calling getAllListingsForAdmin writes to the correct Redis key internally
              await getAllListingsForAdmin({
                page,
                limit: 20,
                shelf: null,
                category,
                subcategory: null,
                includeArchived: false,
                sort: "listedAt",
                order: "desc",
                skipCount: true,
              });
            } catch (err) {
              console.error(`❌ Failed warming category=${category} page=${page}:`, err.message);
            }
          })
        );
      }
    }

    await Promise.all(tasks);
    console.log("✅ Listings cache warm COMPLETED", new Date().toISOString());
  } catch (err) {
    console.error("❌ Listings cache warm FAILED:", err.stack || err);
  }
};

// ────────────────────────────────────────────────────────────
// 📚 SHELF CACHE WARMER — runs every hour
// Warms all shelf pages so requests are served from Redis.
// getAllListingsForAdmin handles writing to the correct cache
// key internally (admin:listings:...) so no manual redis.set
// is needed here.
// ────────────────────────────────────────────────────────────
const SHELVES = [
  "newArrivals",
  "popularBooks",
  "bestSellers",
  "childrensBooks",
  "clearanceItems",
];
const SHELF_PAGES_TO_WARM = 5;

export const warmShelvesCache = async () => {
  console.log("📚 Shelves cache warm STARTED", new Date().toISOString());

  const tasks = [];

  for (const shelf of SHELVES) {
    for (let page = 1; page <= SHELF_PAGES_TO_WARM; page++) {
      tasks.push(
        limit(async () => {
          try {
            await getAllListingsForAdmin({
              page,
              limit: 20,
              shelf,
              category: null,
              subcategory: null,
              includeArchived: false,
              sort: "listedAt",
              order: "desc",
              skipCount: false,
            });
            console.log(`  ✅ shelf=${shelf} page=${page}`);
          } catch (err) {
            console.error(`  ❌ shelf=${shelf} page=${page}: ${err.message}`);
          }
        })
      );
    }
  }

  await Promise.all(tasks);
  console.log("📚 Shelves cache warm COMPLETED", new Date().toISOString());
};

// Cron: warm shelves every hour
cron.schedule("0 * * * *", warmShelvesCache);

cron.schedule("*/10 * * * *", warmCategoriesCache);

//
// ────────────────────────────────────────────────────────────
// 📦 WEEKLY SFTP LISTINGS EXPORT
// ────────────────────────────────────────────────────────────
//
const WEEKLY_SCHEDULE = "0 18 * * 1"; // Monday 18:00 UK

console.log("🧠 Registering Weekly Listings Cron Job...");
console.log("⏰ Schedule: Every Monday at 18:00 UK time");

const runWeeklyExport = async () => {
  console.log("🗓 Weekly listings job STARTED at", new Date().toISOString());

  try {
    const filePath = await generateListingsFile();
    console.log("📄 Listings file generated:", filePath);

    await uploadToSftp(filePath, "/uploads/listings");
    console.log("📤 Uploaded to SFTP successfully");

    console.log("✅ Weekly listings job COMPLETED\n");
  } catch (err) {
    console.error("❌ Weekly listings job FAILED:", err.message, "\n");
  }
};

cron.schedule(WEEKLY_SCHEDULE, runWeeklyExport, {
  timezone: "Europe/London",
});

//
// ────────────────────────────────────────────────────────────
// 📢 CAMPAIGN AUTO-EXPIRE (runs every hour)
// ────────────────────────────────────────────────────────────
//
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();

    // Find active campaigns that have passed their endDate
    const expiring = await Campaign.find({ status: 'active', endDate: { $lt: now } });

    for (const campaign of expiring) {
      // Remove discounts from clearance listings before expiring
      if (campaign.type === 'clearance' && campaign.listingIds?.length) {
        await MarketplaceListing.updateMany(
          { _id: { $in: campaign.listingIds } },
          { $set: { 'discount.isActive': false, 'discount.value': 0 } }
        );
        console.log(`🏷️  Removed clearance discounts for campaign: ${campaign.title}`);
      }
      campaign.status = 'expired';
      await campaign.save();
    }

    if (expiring.length > 0) {
      console.log(`⏰ Auto-expired ${expiring.length} campaign(s)`);
    }
  } catch (err) {
    console.error('❌ Campaign auto-expire error:', err.message);
  }
});

//
// ────────────────────────────────────────────────────────────
// 📢 CAMPAIGN AUTO-ACTIVATE (runs every hour)
// ────────────────────────────────────────────────────────────
//
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const result = await Campaign.updateMany(
      { status: 'draft', startDate: { $lte: now }, $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      { $set: { status: 'active' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ Auto-activated ${result.modifiedCount} campaign(s)`);
    }
  } catch (err) {
    console.error('❌ Campaign auto-activate error:', err.message);
  }
});

//
// ────────────────────────────────────────────────────────────
// 🔍 UPTIMEROBOT MONITOR CHECK (every 20 minutes)
// Sends email alert if any monitor is down or uptime < 95%
// ────────────────────────────────────────────────────────────
//
const STATUS_LABELS = { 0: 'paused', 1: 'not checked yet', 2: 'up', 8: 'seems down', 9: 'down' };

cron.schedule('0 */2 * * *', async () => {
  try {
    const res = await axios.post(
      'https://api.uptimerobot.com/v2/getMonitors',
      new URLSearchParams({
        api_key: process.env.UPTIMEROBOT_API_KEY,
        format: 'json',
        custom_uptime_ratios: '7',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (res.data.stat !== 'ok') {
      console.error('❌ UptimeRobot check failed:', res.data.error);
      return;
    }

    const alerts = res.data.monitors.filter(
      (m) => m.status === 9 || m.status === 8 || parseFloat(m.custom_uptime_ratio) < 95
    );

    if (alerts.length === 0) {
      console.log('✅ Monitor check OK:', new Date().toISOString());
      return;
    }

    // Build alert email
    const resend = new Resend(process.env.RESEND_API_KEY);
    const rows = alerts.map((m) => {
      const status = STATUS_LABELS[m.status] ?? `unknown (${m.status})`;
      const uptime = m.custom_uptime_ratio ?? 'N/A';
      return `<tr>
        <td style="padding:8px;border:1px solid #ddd">${m.friendly_name}</td>
        <td style="padding:8px;border:1px solid #ddd;color:red"><b>${status}</b></td>
        <td style="padding:8px;border:1px solid #ddd">${uptime}%</td>
      </tr>`;
    }).join('');

    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: process.env.ALERT_EMAIL,
      subject: `🚨 BritBook API Monitor Alert — ${alerts.length} issue(s) detected`,
      html: `
        <h2>BritBook API Monitor Alert</h2>
        <p>The following monitors need attention:</p>
        <table style="border-collapse:collapse;width:100%">
          <tr>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Monitor</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Status</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Uptime (7d)</th>
          </tr>
          ${rows}
        </table>
        <p style="color:#888;font-size:12px">Checked at ${new Date().toISOString()}</p>
      `,
    });

    console.warn(`🚨 Monitor alert sent for ${alerts.length} issue(s)`);
  } catch (err) {
    console.error('❌ Monitor cron error:', err.message);
  }
});

//
// ────────────────────────────────────────────────────────────
// 🚀 OPTIONAL: RUN CACHE WARMER ON SERVER START
// ────────────────────────────────────────────────────────────
//
warmShelvesCache();
warmListingsCache();
warmCategoriesCache();