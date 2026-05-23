// enrichCoverImages.js

import pLimit from "p-limit";
import fs from "fs";
import { MarketplaceListing } from "../models/MarketPlace.js";
import {
  fetchOpenLibraryBatch,
  fetchCoverImageUrl,
} from "../../lib/utils/fetchCoverImageUrl.js";

/* ── CONFIG ──────────────────────────────────────────────────────
   Phase 1  Open Library batch (ISBN books)
   Phase 2  Title+author fallback via fetchCoverImageUrl (OL then GB)
   Phase 3  bulkWrite to MongoDB in batches
────────────────────────────────────────────────────────────────── */
const OL_BATCH_SIZE      = 50;  // ISBNs per Open Library request
const OL_CONCURRENCY     = 30;  // parallel OL batch requests
const FALLBACK_CONCURRENCY = 10; // parallel title/author lookups
const DB_WRITE_BATCH     = 500;  // docs per MongoDB bulkWrite

/* ── HELPERS ─────────────────────────────────────────────────── */
function cleanIsbn(isbn) {
  if (!isbn) return null;
  const cleaned = isbn.replace(/[^0-9X]/gi, "");
  return cleaned.length >= 10 ? cleaned : null;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function bulkSaveCovers(updates) {
  if (!updates.length) return;
  await MarketplaceListing.bulkWrite(
    updates.map(({ id, url }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { coverImageUrl: url } },
      },
    })),
    { ordered: false }
  );
}

/* ── MAIN ────────────────────────────────────────────────────── */
export async function runCoverImageEnrichment() {
  console.log("🎯 Cover enrichment STARTED", new Date().toISOString());

  const stats = { success: 0, fail: 0, total: 0 };

  const query = {
    $or: [
      { coverImageUrl: { $exists: false } },
      { coverImageUrl: null },
      { coverImageUrl: "" },
      { coverImageUrl: { $regex: /^\s*$/ } },
      { coverImageUrl: { $regex: "api.dicebear.com/7.x/books", $options: "i" } },
    ],
  };

  // Project only needed fields — keeps memory low even for 200k docs
  const listings = await MarketplaceListing
    .find(query, { _id: 1, isbn: 1, title: 1, author: 1 })
    .lean();

  stats.total = listings.length;
  console.log(`📚 Books needing enrichment: ${stats.total}`);
  if (!stats.total) return stats;

  // ── PHASE 1: Open Library batch for ISBN books ────────────────
  const withIsbn    = listings.filter((l) => cleanIsbn(l.isbn));
  const withoutIsbn = listings.filter((l) => !cleanIsbn(l.isbn));

  console.log(
    `\n🔍 Phase 1 — Open Library batch: ${withIsbn.length} books with ISBN` +
    ` (${Math.ceil(withIsbn.length / OL_BATCH_SIZE)} requests)`
  );

  const olLimit  = pLimit(OL_CONCURRENCY);
  const coverMap = {}; // isbn → coverUrl

  await Promise.all(
    chunk(withIsbn, OL_BATCH_SIZE).map((batch) =>
      olLimit(async () => {
        const isbns = batch.map((l) => cleanIsbn(l.isbn));
        const results = await fetchOpenLibraryBatch(isbns);
        Object.assign(coverMap, results);
      })
    )
  );

  const olHits = Object.keys(coverMap).length;
  console.log(`  ✅ Open Library found ${olHits} / ${withIsbn.length} covers`);

  // ── PHASE 2: Fallback for OL misses + no-ISBN books ───────────
  const olMisses    = withIsbn.filter((l) => !coverMap[cleanIsbn(l.isbn)]);
  const needsFallback = [...olMisses, ...withoutIsbn];

  console.log(
    `\n🔍 Phase 2 — fallback (OL title search → Google Books): ${needsFallback.length} books`
  );

  const fbLimit     = pLimit(FALLBACK_CONCURRENCY);
  const fallbackMap = {}; // listingId → coverUrl

  await Promise.all(
    needsFallback.map((listing) =>
      fbLimit(async () => {
        const url = await fetchCoverImageUrl({
          title: listing.title,
          author: listing.author,
          isbn: cleanIsbn(listing.isbn),
        });
        if (url) fallbackMap[listing._id.toString()] = url;
      })
    )
  );

  console.log(
    `  ✅ Fallback found ${Object.keys(fallbackMap).length} / ${needsFallback.length} covers`
  );

  // ── PHASE 3: Bulk save to MongoDB ────────────────────────────
  console.log("\n💾 Phase 3 — saving to MongoDB...");

  const updates   = [];
  const missingLog = [];

  for (const listing of listings) {
    const isbn = cleanIsbn(listing.isbn);
    const url =
      (isbn && coverMap[isbn]) ||
      fallbackMap[listing._id.toString()];

    if (url) {
      updates.push({ id: listing._id, url });
      stats.success++;
    } else {
      stats.fail++;
      missingLog.push(
        `${listing._id} | ${listing.title} | ${listing.isbn || "NO_ISBN"}`
      );
    }
  }

  for (const writeBatch of chunk(updates, DB_WRITE_BATCH)) {
    await bulkSaveCovers(writeBatch);
    console.log(`  💾 Wrote ${writeBatch.length} covers`);
  }

  if (missingLog.length) {
    fs.appendFileSync("missing_covers.txt", `${missingLog.join("\n")  }\n`);
  }

  console.log("\n📊 FINAL RESULTS");
  console.log(`✅ Covers saved:  ${stats.success}`);
  console.log(`❌ Not found:     ${stats.fail}`);
  console.log(`📚 Total:         ${stats.total}`);
  console.log("🏁 Cover enrichment COMPLETED", new Date().toISOString());

  return stats;
}
