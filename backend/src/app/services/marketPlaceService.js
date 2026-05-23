import { Order } from '../models/Order.js';
import { MarketplaceListing } from '../models/MarketPlace.js';
import mongoose, { Types } from 'mongoose';
import { genAI } from '../../lib/config/openAi.js';
import BeeQueue from 'bee-queue';
import dotenv from 'dotenv';
import redis from "../../lib/config/redisClient.js";







dotenv.config();
function buildCacheKey(params) {
  return `admin:listings:page=${params.page}:limit=${params.limit}:shelf=${params.shelf || "none"}:category=${params.category || "none"}:subcategory=${params.subcategory || "none"}:sort=${params.sort || "listedAt"}:order=${params.order || "desc"}:archived=${params.includeArchived ? "1" : "0"}:filters=${JSON.stringify(params.filters || {})}`;
}


// Redis setup
if (!process.env.REDIS_URL) {
  throw new Error('❌ REDIS_URL not set. Check your .env or Railway service variables.');
}

const redisQueue = new BeeQueue('enrichmentQueue', {
  redis: {
    url: process.env.REDIS_URL,
  },
});
function extractRetryDelay(err) {
  try {
    const raw = err.message.match(/\[(\{.*\})\]$/);
    if (raw) {
      const errorData = JSON.parse(raw[1]);
      const retryInfo = errorData.find(e => e['@type']?.includes('RetryInfo'));
      if (retryInfo?.retryDelay?.endsWith('s')) {
        return parseInt(retryInfo.retryDelay) * 1000;
      }
    }
  } catch { /* ignored */ }
  return null;
}

const BULK_SIZE = 1000;



export async function enrichListingWithAI(listing, retries = 3) {
  const prompt = `
Categorize and tag the following book:

Title: ${listing.title}
Author: ${listing.author}
Description: ${listing.notes || ''}
Condition: ${listing.condition}
Language: ${listing.language}

Respond in JSON format:
{
  "category": "...",
  "tags": ["...", "...", "..."],
  "confidence": 0.92
}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const responseText = result.response.text().trim();
      if (!responseText) throw new Error('Empty response from Gemini');

      let aiData;
      try {
        aiData = JSON.parse(responseText);
      } catch (err) {
        console.error('❌ Failed to parse Gemini response:', err.message);
        return listing;
      }

      return await MarketplaceListing.findByIdAndUpdate(
        listing._id,
        {
          category: aiData.category || listing.category,
          autoCategorizedTags: aiData.tags || [],
          aiConfidenceScore: aiData.confidence || null,
          aiMetadataFilled: true,
        },
        { new: true }
      );
    } catch (err) {
      if (err.message.includes('429')) {
        const delay = extractRetryDelay(err) || 60000;
        console.warn(`⚠️ Rate limited by Gemini. Waiting ${delay / 1000}s before retrying...`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      console.error('❌ Failed to enrich with Gemini AI:', err.message);
      return listing;
    }
  }

  console.error(`❌ Failed after ${retries} retries. Skipping listing ${listing._id}`);
  return listing;
}

export async function queueAIEnrichment(listingId) {
  try {
    await redisQueue
      .createJob({ listingId }) 
      .save();
  } catch (err) {
    console.error('❌ Failed to enqueue listing for enrichment:', err);
  }
}


function parseNumberSafe(val, fallback = 0, fieldName = '', sku = '') {
  if (val === null || val === undefined) return fallback;

  const cleaned = val
    .toString()
    .trim()
    .replace(/[\uFEFF\u00A0\u200B]/g, '') // remove invisible chars
    .replace(/,/g, '.')                   // support comma as decimal
    .replace(/[^\d.]/g, '');              // keep only digits and dot

  const n = parseFloat(cleaned);

  if (isNaN(n)) {
    console.warn(`⚠️ Invalid ${fieldName} "${val}" for SKU ${sku}, using fallback ${fallback}`);
    return fallback;
  }
  return n;
}

// -------------------------
// Upsert single listing
// -------------------------
export async function upsertListingFromInventory(data, syncBatchId) {
  // -------------------------
  // Extract fields
  // -------------------------
  const {
    sku,
    isbn,
    title,
    author,
    edition,
    language,
    condition,
    price,
    stock,
    coverImageUrl,
    notes,
    format,
    publisher,
    publicationDate,
    pages,
    dimsHeight,
    dimsWidth,
    dimsLength,
    dimsWeight,
    category,
    subcategory,
    samplePageUrls,
    syncSource,
  } = data;

  if (!sku || !title) {
    throw new Error(`Missing required fields sku/title for row: ${JSON.stringify(data)}`);
  }

  // -------------------------
  // Build payload
  // -------------------------
  const payload = {
    sku: sku.trim(),
    isbn: isbn?.trim() || '',
    title: title.trim(),
    author: author?.trim() || 'Unknown',
    edition: edition?.trim() || '',
    language: language?.trim() || 'English',
    condition: condition?.trim().toLowerCase() || 'good',
    price: parseNumberSafe(price, 0, 'price', sku),
    stock: parseNumberSafe(stock, 1, 'stock', sku),
    coverImageUrl: coverImageUrl?.trim() || '',
    notes: notes?.trim() || '',
    format: format?.trim() || '',
    publisher: publisher?.trim() || '',
    publicationDate: publicationDate?.trim() || '',
    pages: parseNumberSafe(pages, 0, 'pages', sku),
    dimsHeight: dimsHeight?.trim() || '',
    dimsWidth: dimsWidth?.trim() || '',
    dimsLength: dimsLength?.trim() || '',
    dimsWeight: dimsWeight?.trim() || '',
    category: category?.trim() || '',
    subcategory: subcategory?.trim() || '',
    samplePageUrls: samplePageUrls || [],
    inventory: {
      inventorySyncId: sku,
      rawTitle: title,
      rawAuthor: author,
      rawDataDump: data,
      syncSource: syncSource || 'csv',
      syncBatchId: syncBatchId ? new Types.ObjectId(syncBatchId) : undefined,
      importedAt: new Date(),
    },
    isPublished: true,
    currency: 'GBP',
    aiMetadataFilled: false, // ensure AI runs after DB insert
  };

  // -------------------------
  // Upsert in DB first
  // -------------------------
  let record = await MarketplaceListing.findOne({ sku }).lean();

  if (record) {
    if (!record.aiMetadataFilled) {
      record = await MarketplaceListing.findByIdAndUpdate(record._id, payload, { new: true, runValidators: true });

      // Queue AI enrichment asynchronously (non-blocking)
      queueAIEnrichment(record._id).catch(err => {
        console.error(`❌ Failed to enqueue AI job for ${record._id}:`, err.message);
      });
    } else {
      console.log(`⏭️ Already enriched. Skipping listing ${record._id}`);
    }
  } else {
    record = await MarketplaceListing.create(payload);

    // Queue AI enrichment asynchronously (non-blocking)
    queueAIEnrichment(record._id).catch(err => {
      console.error(`❌ Failed to enqueue AI job for ${record._id}:`, err.message);
    });
  }

  return record;
}



// -------------------------
// Bulk sync multiple rows
// -------------------------
export async function bulkSyncFromCSV(rows, syncBatchId) {
  console.log("DEBUG: Received rows array with length:", rows.length);
  if (!Array.isArray(rows) || rows.length === 0) return { count: 0 };

  const batchObjectId = syncBatchId ? new mongoose.Types.ObjectId(syncBatchId) : undefined;

  for (let i = 0; i < rows.length; i += BULK_SIZE) {
    const chunk = rows.slice(i, i + BULK_SIZE);

    const ops = chunk.map(row => {
      const sku = row.sku.trim();

      return {
        updateOne: {
          filter: { sku },
          update: {
            $set: {
              sku,
              isbn: row.isbn?.trim() || '',
              title: row.title?.trim() || '',
              author: row.author?.trim() || 'Unknown',
              notes: row.notes?.trim() || row.ItemDescription?.trim() || '',
              condition: row.condition?.trim().toLowerCase() || 'good',
              price: parseNumberSafe(row.price, 0, 'price', sku),
              stock: parseNumberSafe(row.stock, 1, 'stock', sku),
              currency: row.currency || 'GBP',
              isPublished: true,
              aiMetadataFilled: false,
              coverImageUrl: row.coverImageUrl?.trim() || '',
              category: row.category?.trim() || '',
              subcategory: row.subcategory?.trim() || '',
              inventory: {
                inventorySyncId: sku,
                syncSource: 'csv',
                syncBatchId: batchObjectId,
              },
            },
            $setOnInsert: {
              createdAt: new Date(), // optional
            },
          },
          upsert: true,
        },
      };
    });

    await MarketplaceListing.bulkWrite(ops, { ordered: false });
    console.log(`✅ Bulk written ${i + chunk.length}/${rows.length}`);
  }

  console.log(`🎯 ${rows.length} listings processed for DB storage`);
  return { count: rows.length };
}





export async function createListing(data) {
  const existing = await MarketplaceListing.findOne({ title: data.title.trim() });

  if (existing) {
    throw new Error('A listing with the same title already exists.');
  }

  const listing = await MarketplaceListing.create({ ...data, isPublished: true });
  await queueAIEnrichment(listing._id);
  return listing;
}


export async function updateListing(listingId, updates) {
  const listing = await MarketplaceListing.findByIdAndUpdate(listingId, updates, { new: true });
  await queueAIEnrichment(listing._id);
  return listing;
}

export async function archiveListing(listingId) {
  return await MarketplaceListing.findByIdAndUpdate(listingId, { isArchived: true }, { new: true });
}



// Aggregation stage: books with a real cover image are sorted first
// Treats missing, empty, or DiceBear placeholder URLs as "no cover"
const ADD_COVER_FLAG = {
  $addFields: {
    _hasCover: {
      $cond: [
        {
          $and: [
            { $gt: [{ $strLenCP: { $ifNull: ["$coverImageUrl", ""] } }, 0] },
            { $eq: [{ $indexOfCP: [{ $ifNull: ["$coverImageUrl", ""] }, "dicebear.com"] }, -1] },
          ]
        },
        1,
        0
      ]
    }
  }
};

// Run a find-style query but with cover-first ordering
async function coverFirstFind(match, sortStage, skip, limit) {
  return MarketplaceListing.aggregate([
    { $match: match },
    ADD_COVER_FLAG,
    { $sort: { _hasCover: -1, ...sortStage } },
    { $skip: skip },
    { $limit: limit },
    { $project: { _hasCover: 0 } },
  ]);
}

// Shelf TTLs (seconds): shelves change infrequently so cache them longer
const SHELF_CACHE_TTL = 300;   // 5 min for shelf pages
const QUERY_CACHE_TTL = 60;    // 1 min for filtered/sorted queries

export async function getAllListingsForAdmin(reqBody = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      includeArchived = false,
      sort = "listedAt",
      order = "desc",
      category = null,
      subcategory = null,
      condition = null,
      priceMin,
      priceMax,
      shelf = null,
      skipCount = false,
    } = reqBody;

    // ── REDIS CACHE CHECK ─────────────────────────────────
    const cacheKey = buildCacheKey({ page, limit, includeArchived, sort, order, category, subcategory, shelf, filters: { condition, priceMin, priceMax } });
    const cacheTTL = shelf ? SHELF_CACHE_TTL : QUERY_CACHE_TTL;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch { /* ignored */ }

    const skip = (page - 1) * limit;

    let listings = [];
    let total = 0;



    // ── BASE MATCH ────────────────────────────────────────
    const match = { isPublished: true };
    if (!includeArchived) match.isArchived = { $ne: true };
    if (condition) match.condition = condition;

    if (priceMin !== undefined || priceMax !== undefined) {
      match.price = {};
      if (priceMin !== undefined) match.price.$gte = Number(priceMin);
      if (priceMax !== undefined) match.price.$lte = Number(priceMax);
    }

    const escape = (str) =>
      str ? str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";

    // ── CATEGORY / SUBCATEGORY FILTERING ──────────────────
    if (category || subcategory) {
      match.$and = match.$and || [];

      const cat = category?.toLowerCase();

      const generalClause = {
        $or: [
          { category: { $exists: false } },
          { category: null },
          { category: "" },
          { category: { $regex: /^general$/i } },
        ],
      };

      if (category && subcategory) {
        if (cat === "general") {
          match.$and.push(generalClause);
        } else {
          match.$and.push({
            $or: [
              { category: new RegExp(`^${escape(category)}$`, "i") },
              { subcategory: new RegExp(`^${escape(category)}$`, "i") },
              { autoCategorizedTags: { $regex: escape(category), $options: "i" } },
            ],
          });

          match.$and.push({
            $or: [
              { subcategory: new RegExp(`^${escape(subcategory)}$`, "i") },
              { autoCategorizedTags: { $regex: escape(subcategory), $options: "i" } },
            ],
          });
        }
      } else if (category) {
        match.$and.push(
          cat === "general"
            ? generalClause
            : {
                $or: [
                  { category: new RegExp(escape(category), "i") },
                  { subcategory: new RegExp(escape(category), "i") },
                  { autoCategorizedTags: { $regex: escape(category), $options: "i" } },
                ],
              }
        );
      } else if (subcategory) {
        match.$and.push({
          $or: [
            { subcategory: new RegExp(escape(subcategory), "i") },
            { autoCategorizedTags: { $regex: escape(subcategory), $options: "i" } },
          ],
        });
      }
    }

    // ── SHELF PRESETS ─────────────────────────────────────
    let sortStage = { [sort]: order === "asc" ? 1 : -1 };

    switch (shelf) {
      case "newArrivals":
        match.stock = { $gt: 0 };
        sortStage = { listedAt: -1, _id: -1 };
        break;

      case "popularBooks":
        match.stock = { $gt: 0 };
        // Sort by popularity; use listedAt ascending (oldest first) as tiebreaker
        // so that when purchases/views are tied (e.g. both 0) this shelf returns
        // a different ordered set from newArrivals (which sorts newest first).
        sortStage = { purchases: -1, views: -1, listedAt: 1, _id: 1 };
        break;

        case "bestSellers": {
          const bsSkip = (page - 1) * limit;
          const [bsRows, bsCount] = await Promise.all([
            Order.aggregate([
              { $match: { "payment.status": "paid" } },
              { $unwind: "$items" },
              { $group: {
                  _id: "$items.listing",
                  totalSold: { $sum: "$items.quantity" },
                  revenue: { $sum: { $multiply: ["$items.quantity", "$items.priceAtPurchase"] } }
              }},
              { $sort: { totalSold: -1 } },
              { $skip: bsSkip },
              { $limit: limit },
              { $lookup: {
                  from: "marketplacelistings",
                  localField: "_id",
                  foreignField: "_id",
                  as: "listing"
              }},
              { $unwind: "$listing" },
              { $project: {
                  _id: "$listing._id",
                  title: "$listing.title",
                  author: "$listing.author",
                  price: "$listing.price",
                  coverImageUrl: "$listing.coverImageUrl",
                  stock: "$listing.stock",
                  totalSold: 1,
                  revenue: { $round: ["$revenue", 2] },
              }},
            ]),
            Order.aggregate([
              { $match: { "payment.status": "paid" } },
              { $unwind: "$items" },
              { $group: { _id: "$items.listing" } },
              { $count: "total" },
            ]).then(r => r[0]?.total ?? 0),
          ]);
          listings = bsRows;
          total = bsCount;
          break;
        }
        
        
        
        
        
        
        
        

      case "childrensBooks":
        match.$and = match.$and || [];
        match.$and.push({
          $or: [
            { category: /children/i },
            { autoCategorizedTags: /children/i },
          ],
        });
        sortStage = { listedAt: -1 };
        break;

      case "clearanceItems":
        match["discount.isActive"] = true;
        match["discount.value"] = { $gte: 10 };
        sortStage = { "discount.value": -1 };
        break;
    }

    // ── QUERY ─────────────────────────────────────────────
  

    if (shelf !== "bestSellers") {
      if (skipCount) {
        listings = await coverFirstFind(match, sortStage, skip, limit);
        total = null;
      } else {
        [listings, total] = await Promise.all([
          coverFirstFind(match, sortStage, skip, limit),
          MarketplaceListing.countDocuments(match),
        ]);
      }
    }

 
    

    const result = {
      success: true,
      listings,
      meta: {
        count: total ?? null,
        page,
        limit,
        pages: total ? Math.ceil(total / limit) : null,
        category,
        subcategory,
        sort,
        order,
      },
    };

    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', cacheTTL);
    } catch { /* ignored */ }

    return result;
  } catch (err) {
    console.error("getAllListingsForAdmin error:", err);
    return { success: false, error: "Database query failed" };
  }
}









export async function getPublishedListings({ page = 1, limit = 20, sort = 'listedAt', order = 'desc', filters = {} }) {
  const query = { isPublished: true, isArchived: { $ne: true }, ...filters };
  const sortOption = { [sort]: order === 'asc' ? 1 : -1 };
  return coverFirstFind(query, sortOption, (page - 1) * limit, limit);
}

export async function getListingById(id) {
  const isObjectId = /^[a-f\d]{24}$/i.test(id);
  const query = isObjectId
    ? { _id: id, isPublished: true, isArchived: false }
    : { slug: id, isPublished: true, isArchived: false };

  const listing = await MarketplaceListing.findOne(query).lean();
  if (!listing) return null;

  listing.structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: listing.title,
    author: { '@type': 'Person', name: listing.author },
    isbn: listing.isbn || undefined,
    publisher: listing.publisher || undefined,
    datePublished: listing.publicationDate || undefined,
    inLanguage: listing.language || 'en',
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: listing.currency || 'GBP',
      availability: listing.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      condition: `https://schema.org/${listing.condition === 'new' ? 'NewCondition' : 'UsedCondition'}`,
    },
    image: listing.coverImageUrl || undefined,
    description: listing.metaDescription || listing.notes || undefined,
    url: `https://www.britbooks.co.uk/books/${listing.slug || listing._id}`,
    ...(listing.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: listing.averageRating.toFixed(1),
        reviewCount: listing.reviewCount,
        bestRating: '5',
        worstRating: '1',
      },
    }),
  };

  return listing;
}

export async function searchListings({
  keyword,
  page = 1,
  limit = 20,
  filters = {},
  sort = 'views',
  order = 'desc',
}) {
  if (!keyword) {
    return [];
  }

  const skip = (page - 1) * limit;

  // Use MongoDB text index for fast full-text search
  const query = {
    isPublished: true,
    isArchived: { $ne: true },
    ...filters,
    $text: { $search: keyword },
  };

  try {
    return await MarketplaceListing.aggregate([
      { $match: query },
      { $addFields: { _score: { $meta: 'textScore' }, ...ADD_COVER_FLAG.$addFields } },
      { $sort: { _hasCover: -1, _score: { $meta: 'textScore' }, [sort]: order === 'asc' ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { _hasCover: 0, _score: 0 } },
    ]);
  } catch (err) {
    if (err.code === 27) return []; // text index not yet available
    throw err;
  }
}




export async function incrementViews(listingId) {
  await MarketplaceListing.findByIdAndUpdate(listingId, { $inc: { views: 1 } });
}

export async function markAsPurchased(listingId) {
  await MarketplaceListing.findByIdAndUpdate(listingId, { $inc: { purchases: 1 } });
}

export async function setPublishStatus(listingId, isPublished = true) {
  return await MarketplaceListing.findByIdAndUpdate(listingId, { isPublished }, { new: true });
}

export async function deleteListingPermanently(listingId) {
  return await MarketplaceListing.findByIdAndDelete(listingId);
}

export async function bulkUpdateListings(action, listingIds = []) {
  if (!Array.isArray(listingIds) || listingIds.length === 0) return { modifiedCount: 0 };

  const updateMap = {
    publish: { isPublished: true },
    unpublish: { isPublished: false },
    archive: { isArchived: true },
    unarchive: { isArchived: false },
  };

  const update = updateMap[action];
  if (!update) throw new Error('Invalid bulk action');

  const result = await MarketplaceListing.updateMany(
    { _id: { $in: listingIds.map(id => new Types.ObjectId(id)) } },
    update
  );

  return result;
}

export async function flagListingAsModerationNeeded(listingId, reason = 'incomplete or spam') {
  return await MarketplaceListing.findByIdAndUpdate(
    listingId,
    { moderationFlag: true, moderationReason: reason },
    { new: true }
  );
}

export async function getListingStats({ filters = {} } = {}) {
    const match = { ...filters };
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalPurchases: { $sum: '$purchases' },
          lowStock: {
            $sum: {
              $cond: [{ $lt: ['$stock', 3] }, 1, 0],
            },
          },
        },
      },
    ];
  
    const result = await MarketplaceListing.aggregate(pipeline);
    const stats = result[0] || {
      totalListings: 0,
      totalViews: 0,
      totalPurchases: 0,
      lowStock: 0,
    };
  
    // Remove _id from result
    const { _id, ...cleanStats } = stats;
  
    return cleanStats;
  }
  
  export async function updateInventoryFields({ sku, price, quantity }) {
    if (!sku || isNaN(price) || isNaN(quantity)) {
      throw new Error(`Invalid inventory update row: ${JSON.stringify({ sku, price, quantity })}`);
    }
  
    const listing = await MarketplaceListing.findOneAndUpdate(
      { 'inventory.inventorySyncId': sku },
      {
        $set: {
          price: parseFloat(price),
          stock: parseInt(quantity),
          isPublished: quantity > 0, // Optional: auto unpublish when out of stock
        },
      },
      { new: true }
    );
  
    if (!listing) {
      throw new Error(`Listing with SKU ${sku} not found.`);
    }
  
    return listing;
  }
  