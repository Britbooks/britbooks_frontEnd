import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import { faker } from "@faker-js/faker";
import { MarketplaceListing } from "../src/app/models/MarketPlace.js";
import { enrichmentQueue } from "../src/lib/config/enrichmentWorker.js";

dotenv.config();

/* -------------------- DB -------------------- */
await mongoose.connect(process.env.MONGODB_URI);
console.log("✅ MongoDB connected");

/* -------------------- CONFIG -------------------- */
const TOTAL = 2_000_000;
const BATCH_SIZE = 5_000;
const PROGRESS_FILE = "./seed_progress.json";

const CONDITIONS = ["new", "like new", "very good", "good", "acceptable"];
const CATEGORIES = [
  "Fiction","Non-Fiction","Science","Technology","History",
  "Biography","Philosophy","Business","Self-Help","Religion",
  "Children","Education"
];
const FORMATS = ["Paperback", "Hardcover"];
const PUBLISHERS = [
  "Penguin Random House",
  "HarperCollins",
  "Oxford Press",
  "Cambridge Press",
  "Macmillan"
];

const now = new Date();
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const price = () => Number((Math.random() * 40 + 5).toFixed(2));
const chance = (p) => Math.random() < p;

/* -------------------- RESUME -------------------- */
let inserted = 0;
if (fs.existsSync(PROGRESS_FILE)) {
  inserted = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8")).lastInserted || 0;
  console.log(`🔄 Resuming from ${inserted}`);
}

/* -------------------- SEED -------------------- */
while (inserted < TOTAL) {
  const batch = [];

  for (let i = 0; i < BATCH_SIZE && inserted + i < TOTAL; i++) {
    const id = inserted + i;
    const sku = `BOOK-${id}`;
    const baseTitle = faker.book.title();
    const author = faker.person.fullName();
    const hasDiscount = chance(0.08);

    batch.push({
      sku,
      isbn: `978-${faker.number.int({ min: 100000000, max: 999999999 })}`,
      title: `${baseTitle} (${id})`,
      author,
      edition: `${faker.number.int({ min: 1, max: 5 })}th Edition`,
      language: "English",
      condition: random(CONDITIONS),

      price: price(),
      currency: "GBP",

      stock: faker.number.int({ min: 1, max: 20 }),
      coverImageUrl: "https://placehold.co/400x600?text=Book+Cover",
      notes: faker.lorem.sentence(),
      format: random(FORMATS),
      publisher: random(PUBLISHERS),
      publicationDate: faker.date.past({ years: 30 }).getFullYear().toString(),
      pages: faker.number.int({ min: 120, max: 900 }),

      dimsHeight: "23cm",
      dimsWidth: "15cm",
      dimsLength: "3cm",
      dimsWeight: "0.6kg",

      category: random(CATEGORIES),
      subcategory: faker.book.genre(),
      tags: faker.helpers.arrayElements(
        ["classic","bestseller","academic","novel","reference"],
        faker.number.int({ min: 1, max: 3 })
      ),

      inventory: {
        inventorySyncId: sku,
        syncSource: "manual",
        importedAt: now,
      },

      discount: hasDiscount ? {
        discountType: "percentage",
        value: faker.number.int({ min: 10, max: 50 }),
        validFrom: now,
        validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      } : undefined,

      aiMetadataFilled: false,
      aiConfidenceScore: null,
      autoCategorizedTags: [],
      isPublished: true,
      isArchived: false,
      views: faker.number.int({ min: 0, max: 200 }),
      purchases: faker.number.int({ min: 0, max: 20 }),
      listedAt: now,
    });
  }

  const insertedDocs = await MarketplaceListing.insertMany(batch, {
    ordered: false,
  });

  inserted += insertedDocs.length;

  for (const doc of insertedDocs) {
    await enrichmentQueue.createJob({ listingId: doc._id }).save();
  }

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastInserted: inserted }));
  console.log(`📚 Inserted ${inserted.toLocaleString()} / ${TOTAL.toLocaleString()}`);
}

/* -------------------- CLEANUP -------------------- */
await mongoose.disconnect();
if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);

console.log("🏁 DONE — 2,000,000 books seeded + enrichment queued");
process.exit(0);
