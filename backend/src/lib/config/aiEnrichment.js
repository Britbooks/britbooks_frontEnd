import dotenv from "dotenv";
import mongoose from "mongoose";
import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MarketplaceListing } from "../../app/models/MarketPlace.js";

dotenv.config();

let aiWorker;

export async function startAIEnrichment() {
  if (!process.env.MONGODB_URI || !process.env.GEMINI_API_KEY) {
    throw new Error("Missing environment variables");
  }

  const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null
  });

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ AI Worker MongoDB connected");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const ALLOWED_CATEGORIES = [
    "Children's Books", "Non-Fiction", "Fiction", "Philosophy", "Education", "History",
    "Biography & Memoir", "Science", "Fantasy", "Mystery & Thriller", "Romance", "Horror",
    "Business & Finance", "Religion & Spirituality", "Travel", "Health & Wellness", "General"
  ];

  new Queue("aiQueue", {
    connection: redis,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
    }
  });

  aiWorker = new Worker("aiQueue", async job => {
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

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = result.response.text();
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

  aiWorker.on("failed", (job, err) => {
    console.error("❌ AI job failed:", err.message);
  });

  console.log("🚀 AI Worker started");
}