import mongoose from "mongoose";
import dotenv from "dotenv";
import { MarketplaceListing } from "../src/app/models/MarketPlace.js";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

function normalize(str = "") {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "");
}

// ------------------------------
// STEP 1: BUILD DUPLICATE GROUPS
// ------------------------------
async function buildGroups() {
  const listings = await MarketplaceListing.find(
    {},
    {
      title: 1,
      author: 1,
      condition: 1,
      isbn: 1,
      sku: 1,
      stock: 1,
      tags: 1,
      samplePageUrls: 1
    }
  );

  const map = new Map();

  for (const item of listings) {
    const key =
      item.isbn ||
      item.sku ||
      `${normalize(item.title)}|${normalize(item.author)}|${item.condition}`;

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }

  return Array.from(map.values()).filter(g => g.length > 1);
}

// ------------------------------
// STEP 2: PICK BEST MASTER
// ------------------------------
function pickMaster(group) {
  return group.sort((a, b) => {
    // priority rules
    const score = (item) => {
      let s = 0;
      if (item.isbn) s += 50;
      if (item.sku) s += 40;
      if (item.samplePageUrls?.length) s += 10;
      if (item.tags?.length) s += 5;
      return s;
    };

    return score(b) - score(a);
  })[0];
}

// ------------------------------
// STEP 3: MERGE DATA
// ------------------------------
function mergeGroup(group, master) {
  let totalStock = master.stock || 0;

  const images = new Set(master.samplePageUrls || []);
  const tags = new Set(master.tags || []);

  for (const item of group) {
    if (item._id.toString() === master._id.toString()) continue;

    totalStock += item.stock || 0;

    (item.samplePageUrls || []).forEach(url => images.add(url));
    (item.tags || []).forEach(tag => tags.add(tag));
  }

  return {
    stock: totalStock,
    samplePageUrls: Array.from(images),
    tags: Array.from(tags)
  };
}

// ------------------------------
// STEP 4: EXECUTE DEDUPE
// ------------------------------
async function runDedupe() {
  console.log("🔍 Building duplicate groups...");
  const groups = await buildGroups();

  console.log(`⚠️ Found ${groups.length} duplicate groups\n`);

  for (const group of groups) {
    const master = pickMaster(group);
    const merged = mergeGroup(group, master);

    console.log(`🧹 Cleaning group: ${master.title}`);

    // update master listing
    await MarketplaceListing.updateOne(
      { _id: master._id },
      {
        $set: {
          stock: merged.stock,
          samplePageUrls: merged.samplePageUrls,
          tags: merged.tags
        }
      }
    );

    // archive duplicates
    const duplicateIds = group
      .filter(i => i._id.toString() !== master._id.toString())
      .map(i => i._id);

    await MarketplaceListing.updateMany(
      { _id: { $in: duplicateIds } },
      { $set: { isArchived: true, isPublished: false } }
    );
  }

  console.log("\n✅ DEDUPE COMPLETE");
  process.exit();
}

runDedupe().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});