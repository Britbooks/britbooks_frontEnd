import mongoose from "mongoose";
import dotenv from "dotenv";
import { MarketplaceListing } from "../src/app/models/MarketPlace.js";

dotenv.config();

const BATCH_SIZE = 1000;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ DB connected\n");

  const cursor = MarketplaceListing.find({
    sku: { $regex: /^SKU/i }
  }).cursor(); // ← STREAM, not load all

  let bulkOps = [];
  let fixed = 0;
  let conflicts = 0;
  let scanned = 0;

  for await (const listing of cursor) {
    scanned++;

    const oldSku = listing.sku;
    let newSku = oldSku.replace(/^SKU/i, "").replace(/^0+/, "");

    if (!newSku) continue;

    // Check conflict cheaply
    const exists = await MarketplaceListing.exists({
      sku: newSku,
      _id: { $ne: listing._id }
    });

    if (exists) {
      conflicts++;
      continue;
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: listing._id },
        update: { $set: { sku: newSku } }
      }
    });

    fixed++;

    // Run batch
    if (bulkOps.length === BATCH_SIZE) {
      await MarketplaceListing.bulkWrite(bulkOps);
      console.log(`✔ Updated ${fixed} SKUs (scanned ${scanned})`);
      bulkOps = [];
    }
  }

  // Flush remainder
  if (bulkOps.length) {
    await MarketplaceListing.bulkWrite(bulkOps);
  }

  console.log("\n====== DONE ======");
  console.log("Scanned:", scanned);
  console.log("Fixed:", fixed);
  console.log("Conflicts:", conflicts);

  process.exit();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
