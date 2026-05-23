import dotenv from "dotenv";
import mongoose from "mongoose";
import pLimit from "p-limit";
import fs from "fs";
import { MarketplaceListing } from "../src/app/models/MarketPlace.js";
import { fetchCoverImageUrl } from "../src/lib/utils/fetchCoverImageUrl.js";

dotenv.config();

/* ── ENV CHECK ── */
if (!process.env.MONGODB_URI || !process.env.GOOGLE_BOOKS_API_KEY) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

/* ── CONFIG ── */
const BATCH_SIZE = 100;
const CONCURRENCY = 10;

const limit = pLimit(CONCURRENCY);

let successCount = 0;
let failCount = 0;

/* ── CLEAN ISBN ── */
function cleanIsbn(isbn) {
  if (!isbn) return null;
  const cleaned = isbn.replace(/[^0-9X]/gi, "");
  return cleaned.length >= 10 ? cleaned : null;
}

/* ── ENRICH ONE BOOK ── */
async function enrichListing(listing) {
  try {
    const params = {
      title: listing.title,
      author: listing.author,
    };

    const isbn = cleanIsbn(listing.isbn);
    if (isbn) params.isbn = isbn;

    const coverImageUrl = await fetchCoverImageUrl(params);

    if (!coverImageUrl) {
      failCount++;

      fs.appendFileSync(
        "missing_covers.txt",
        `${listing._id} | ${listing.title} | ${listing.isbn}\n`
      );

      return;
    }

    await MarketplaceListing.updateOne(
      { _id: listing._id },
      { $set: { coverImageUrl } }
    );

    successCount++;

    console.log(`📚 Updated: ${listing.title}`);

  } catch (err) {
    failCount++;

    console.log(`⚠️ Failed: ${listing.title}`);

    fs.appendFileSync(
      "missing_covers.txt",
      `${listing._id} | ${listing.title} | ERROR\n`
    );
  }
}

/* ── MAIN SCRIPT ── */
async function run() {

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ DB connected");

  const query = {
    $or: [
      { coverImageUrl: { $exists: false } },
      { coverImageUrl: null },
      { coverImageUrl: "" },
      { coverImageUrl: { $regex: /^\s*$/ } },
  
      // Replace DiceBear placeholders
      { coverImageUrl: { $regex: "api.dicebear.com/7.x/books", $options: "i" } }
    ]
  };

  const total = await MarketplaceListing.countDocuments(query);

  console.log(`📚 Books missing covers: ${total}`);

  const cursor = MarketplaceListing
    .find(query)
    .lean()
    .cursor();

  let batch = [];

  for await (const listing of cursor) {

    batch.push(listing);

    if (batch.length >= BATCH_SIZE) {

      await Promise.all(
        batch.map(book => limit(() => enrichListing(book)))
      );

      batch = [];

      console.log(`Processed: ${successCount + failCount}`);
    }
  }

  if (batch.length) {
    await Promise.all(
      batch.map(book => limit(() => enrichListing(book)))
    );
  }

  console.log("\n📊 FINAL RESULTS");
  console.log(`✅ Covers added: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

/* ── SAFE EXIT ── */
process.on("SIGINT", async () => {
  console.log("🛑 Graceful shutdown");
  await mongoose.disconnect();
  process.exit(0);
});

run();