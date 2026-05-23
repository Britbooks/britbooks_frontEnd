import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { MarketplaceListing } from "../src/app/models/MarketPlace.js";
import { Category } from "../src/app/models/Category.js";

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI is not defined");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log("✅ Connected to MongoDB");

console.log("⏳ Aggregating categories & subcategories...");

const cursor = MarketplaceListing.aggregate([
  {
    $match: {
      category: { $exists: true, $ne: "" },
    },
  },
  {
    $group: {
      _id: {
        category: { $toLower: "$category" },
        subcategory: { $toLower: "$subcategory" },
      },
      category: { $first: "$category" },
      subcategory: { $first: "$subcategory" },
      count: { $sum: 1 },
    },
  },
]).cursor({ batchSize: 100 }); // ✅ NO .exec()

for await (const doc of cursor) {
  const categorySlug = doc.category.toLowerCase().trim();

  // 1️⃣ Parent category
  const parent = await Category.findOneAndUpdate(
    { slug: categorySlug, parent: null },
    {
      $setOnInsert: {
        name: doc.category.trim(),
        slug: categorySlug,
        source: "sync",
      },
      $inc: { count: doc.count },
    },
    { upsert: true, new: true }
  );

  // 2️⃣ Subcategory (optional)
  if (doc.subcategory?.trim()) {
    const subSlug = doc.subcategory.toLowerCase().trim();

    await Category.updateOne(
      { slug: subSlug, parent: parent._id },
      {
        $setOnInsert: {
          name: doc.subcategory.trim(),
          slug: subSlug,
          parent: parent._id,
          source: "sync",
        },
        $inc: { count: doc.count },
      },
      { upsert: true }
    );
  }
}

console.log("✅ Category migration completed");
process.exit(0);
