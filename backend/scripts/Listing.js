import dotenv from "dotenv";
import mongoose from "mongoose";
import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MarketplaceListing } from "../src/app/models/MarketPlace.js";

dotenv.config();

/* ───────────────── ENV CHECK ───────────────── */
if (!process.env.MONGODB_URI || !process.env.GEMINI_API_KEY) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

/* ───────────────── CONFIG ───────────────── */
const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null
});

await mongoose.connect(process.env.MONGODB_URI);
console.log("✅ MongoDB connected");

/* ───────────────── GEMINI SETUP ───────────────── */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const ALLOWED_CATEGORIES = [
  "Children's Books", "Non-Fiction", "Fiction", "Philosophy", "Education", "History",
  "Biography & Memoir", "Science", "Fantasy", "Mystery & Thriller", "Romance", "Horror",
  "Business & Finance", "Religion & Spirituality", "Travel", "Health & Wellness", "General"
];

/* ───────────────── QUEUE SETTINGS ───────────────── */
const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: true,
};

const aiQueue = new Queue("aiQueue", { connection: redis, defaultJobOptions });

/* ───────────────── GEMINI CALL ───────────────── */
async function callGemini(prompt) {
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    return result.response.text();
  } catch (err) {
    const status = err.status || (err.response && err.response.status);
    if (status === 429 || status === 503) {
      throw new Error("RATE_LIMIT");
    }
    throw err;
  }
}

/* ───────────────── AI WORKER ───────────────── */
const aiWorker = new Worker("aiQueue", async job => {
  const listing = await MarketplaceListing.findById(job.data.id);
  if (!listing || listing.aiMetadataFilled) return;

  const prompt = `
    Categorize this book. 
    Title: ${listing.title} 
    Author: ${listing.author} 
    Description: ${listing.notes}

    Choose category ONLY from: ${ALLOWED_CATEGORIES.join(", ")}
    Return JSON: { "category": "", "subcategory": "", "tags": [], "confidence": 0.9 }
  `;

  const text = await callGemini(prompt);
  const ai = JSON.parse(text.replace(/```json|```/g, "").trim());

  if (ALLOWED_CATEGORIES.includes(ai.category)) {
    listing.category = ai.category;
  }

  listing.subcategory = ai.subcategory;
  listing.autoCategorizedTags = ai.tags || [];
  listing.aiConfidenceScore = ai.confidence || null;
  listing.aiMetadataFilled = true;

  await listing.save();
  console.log("🧠 AI enriched:", listing.title);

}, {
  connection: redis,
  concurrency: 2,
  limiter: {
    max: 15,
    duration: 60000
  }
});

/* ───────────────── PRODUCER ───────────────── */
async function run() {
  console.log("🚀 Scanning database for AI jobs...");

  const cursor = MarketplaceListing.find({
    isPublished: true,
    isArchived: { $ne: true },
    aiMetadataFilled: { $ne: true }
  }).cursor();

  let count = 0;
  for await (const listing of cursor) {
    await aiQueue.add("aiJob", { id: listing._id });

    count++;
    if (count % 100 === 0) console.log(`📦 Queued ${count} items...`);
  }

  console.log("🎉 All AI jobs pushed to Redis.");
}

/* ───────────────── ERROR HANDLING ───────────────── */
aiWorker.on('failed', (job, err) => {
  if (err.message === 'RATE_LIMIT') {
    console.warn(`⏳ Rate limit hit for job ${job.id}. Retrying automatically.`);
  } else {
    console.error(`❌ Job ${job.id} failed:`, err.message);
  }
});

run().catch(console.error);
