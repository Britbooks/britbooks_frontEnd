import dotenv from 'dotenv';
import mongoose from 'mongoose';
import IORedis from 'ioredis';
import BeeQueue from 'bee-queue';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { MarketplaceListing } from '../../app/models/MarketPlace.js';
import { fetchCoverImageUrl } from '../utils/fetchCoverImageUrl.js';
import { Category } from '../../app/models/Category.js';

dotenv.config();

// ── Validate required environment variables ───────────────────────
if (!process.env.GEMINI_API_KEY || !process.env.MONGODB_URI || !process.env.REDIS_URL) {
  console.error('❌ Required environment variables missing');
  process.exit(1);
}

// ── Gemini AI setup ───────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ── MongoDB connection ────────────────────────────────────────────
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');
} catch (err) {
  console.error('❌ MongoDB connection failed:', err);
  process.exit(1);
}

// ── Redis connection ──────────────────────────────────────────────
const redis = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

// ── Helper: slugify ──────────────────────────────────────────────
function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Sync category/subcategory ────────────────────────────────────
async function syncListingCategory(category, subcategory = null, source = 'ai') {
  if (!category?.trim()) return;

  const parentSlug = slugify(category);
  const parent = await Category.findOneAndUpdate(
    { slug: parentSlug, parent: null },
    { $setOnInsert: { name: category, slug: parentSlug, source }, $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  if (subcategory?.trim()) {
    const subSlug = slugify(subcategory);
    await Category.updateOne(
      { slug: subSlug, parent: parent._id },
      { $setOnInsert: { name: subcategory, slug: subSlug, parent: parent._id, source }, $inc: { count: 1 } },
      { upsert: true }
    );
  }
}

// ── Main enrichment logic ────────────────────────────────────────
async function enrichListing(listing) {
  if (!listing.sku || !listing.title) {
    console.warn(`⚠️ Listing ${listing._id} missing required fields. Skipping.`);
    return;
  }

  const slug = slugify(listing.title);
  const basePreviewUrl = process.env.PREVIEW_IMAGE_BASE_URL || 'https://cdn.bookbank.com/previews';
  const expectedSampleUrls = [`${basePreviewUrl}/${slug}/page-1.jpg`, `${basePreviewUrl}/${slug}/page-2.jpg`];

  const prompt = `
You are a book metadata assistant.
Title: ${listing.title}
Author: ${listing.author || 'Unknown'}
Description: ${listing.notes || 'N/A'}
Condition: ${listing.condition}
Language: ${listing.language}

Tasks:
1. Fill missing author if unknown.
2. Categorize into one category.
3. Generate 3 relevant tags.
4. Provide confidence (0-1).
5. Return real cover URL from Google Books.
6. Return 2 sample page URLs if available.

Respond strictly in valid JSON inside triple backticks.
`;

  try {
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    let content = result.response.text().trim();

    if (!content) throw new Error('Empty Gemini response');

    // Strip code fences
    content = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();

    let aiData = {};
    try { aiData = JSON.parse(content); } 
    catch (err) { 
      console.error(`❌ JSON parse error: ${err.message}`); 
      aiData.samplePageUrls = []; 
    }

    const coverImageUrl = await fetchCoverImageUrl({
      title: listing.title,
      author: aiData.author || listing.author,
      isbn: listing.isbn,
    });

    const sampleUrls = Array.isArray(aiData.samplePageUrls) && aiData.samplePageUrls.length === 2
      ? aiData.samplePageUrls
      : expectedSampleUrls;

    const updatedListing = await MarketplaceListing.findById(listing._id);
    if (!updatedListing) throw new Error('Listing not found');

    const finalCategory = aiData.category || listing.category;
    if (finalCategory && finalCategory !== listing.category) {
      await syncListingCategory(finalCategory, listing.subcategory, 'ai');
    }

    updatedListing.set({
      sku: listing.sku,
      title: listing.title,
      author: listing.author === 'Unknown' && aiData.author ? aiData.author : listing.author,
      category: finalCategory,
      autoCategorizedTags: aiData.tags || [],
      aiConfidenceScore: aiData.confidence || null,
      samplePageUrls: sampleUrls,
      aiMetadataFilled: true,
      coverImageUrl,
    });

    await updatedListing.save({ validateBeforeSave: true });
    console.log(`✅ Enriched: "${updatedListing.title}" (${listing._id})`);
  } catch (err) {
    console.error(`❌ Enrichment failed for ${listing._id}:`, err.message);
  }
}

// ── BeeQueue worker setup ───────────────────────────────────────
const enrichmentQueue = new BeeQueue('enrichmentQueue', {
  isWorker: true,
  redis: { url: process.env.REDIS_URL },
});

// Process multiple jobs concurrently (10 at a time)
enrichmentQueue.process(10, async (job, done) => {
  const { listingId } = job.data;
  console.log(`🔄 Processing listing ${listingId}`);

  try {
    const listing = await MarketplaceListing.findById(listingId);
    if (!listing) { console.warn(`⚠️ Listing ${listingId} not found`); return done(); }
    if (listing.aiMetadataFilled) { console.log(`⏭️ Already enriched. Skipping ${listingId}`); return done(); }

    await enrichListing(listing);
    done();
  } catch (err) {
    console.error(`🔥 Job ${job.id} failed: ${err.message}`);
    done(err);
  }
});


enrichmentQueue.on('succeeded', (job) =>
  console.log(`🎉 Job ${job.id} completed`)
);

enrichmentQueue.on('failed', (job, err) =>
  console.error(`💥 Job ${job.id} failed: ${err.message}`)
);


enrichmentQueue.on('error', (err) => {
  console.error('🚨 Queue Redis error caught:', err);
});

// ── Export for reuse/testing ───────────────────────────────────
export { enrichmentQueue, enrichListing, redis };
