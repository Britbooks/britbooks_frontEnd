import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Review } from '../models/Review.js';
import { MarketplaceListing } from '../models/MarketPlace.js';
import { Order } from '../models/Order.js';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;
const gemini = genAI?.getGenerativeModel({ model: 'gemini-2.5-flash' }) ?? null;

async function recalculateRating(listingId) {
  const result = await Review.aggregate([
    { $match: { listing: listingId, isApproved: true } },
    {
      $group: {
        _id: '$listing',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const { averageRating = 0, reviewCount = 0 } = result[0] || {};

  await MarketplaceListing.findByIdAndUpdate(listingId, {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount,
  });
}

async function moderateWithGemini({ title, body, rating, bookTitle, bookAuthor }) {
  const prompt = `
You are a review moderation assistant for BritBooks, an online bookstore.

Assess the following customer review and decide if it should be approved or rejected.

Book: "${bookTitle}" by ${bookAuthor}
Rating: ${rating}/5
Review Title: "${title || '(no title)'}"
Review Body: "${body || '(no body)'}"

Reject the review if it contains ANY of:
- Hate speech, slurs, or personal attacks
- Spam, promotional content, or unrelated links
- Completely irrelevant content (not about the book or buying experience)
- Gibberish or meaningless content

Approve if it is a genuine customer opinion, even if negative or poorly written.

Respond with ONLY valid JSON in this exact format:
{ "decision": "approved" | "rejected", "reason": "brief reason" }
`.trim();

  if (!gemini) {
    console.warn('GEMINI_API_KEY not set — auto-approving review');
    return { decision: 'approved', reason: 'Moderation unavailable, auto-approved' };
  }

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout')), 8000)
  );

  try {
    const result = await Promise.race([
      gemini.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
      timeout,
    ]);

    const text = result.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);

    if (!['approved', 'rejected'].includes(parsed.decision)) {
      throw new Error('Unexpected Gemini response');
    }

    return parsed;
  } catch (err) {
    console.error('Gemini moderation error:', err.message);
    return { decision: 'approved', reason: 'Moderation unavailable, auto-approved' };
  }
}

export async function createReview({ userId, listingId, rating, title, body, orderId }) {
  const listing = await MarketplaceListing.findById(listingId);
  if (!listing) throw new Error('Listing not found');

  // Check verified purchase
  let isVerifiedPurchase = false;
  let resolvedOrderId = orderId || null;

  const paidOrder = await Order.findOne({
    user: userId,
    'payment.status': 'paid',
    'items.listing': listingId,
  });

  if (paidOrder) {
    isVerifiedPurchase = true;
    resolvedOrderId = resolvedOrderId || paidOrder._id;
  }

  // Run Gemini moderation
  const moderation = await moderateWithGemini({
    title,
    body,
    rating,
    bookTitle: listing.title,
    bookAuthor: listing.author,
  });

  const isApproved = moderation.decision === 'approved';

  const created = await Review.create({
    user: userId,
    listing: listingId,
    order: resolvedOrderId,
    rating,
    title,
    body,
    isVerifiedPurchase,
    isApproved,
    moderationResult: moderation.decision,
    moderationReason: moderation.reason,
  });

  if (isApproved) {
    await recalculateRating(listing._id);
  }

  const review = await created.populate('user', 'fullName email');

  return { review, moderation };
}

export async function getReviewsByListing(listingId, { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ listing: listingId, isApproved: true })
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ listing: listingId, isApproved: true }),
  ]);

  return { reviews, total, page, pages: Math.ceil(total / limit) };
}

export async function getReviewsByUser(userId) {
  return await Review.find({ user: userId })
    .populate('user', 'fullName email')
    .populate('listing', 'title author coverImageUrl slug')
    .sort({ createdAt: -1 })
    .lean();
}

export async function deleteReview(reviewId, userId, isAdmin = false) {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error('Review not found');
  if (!isAdmin && review.user.toString() !== userId) {
    throw new Error('Not authorised to delete this review');
  }

  const listingId = review.listing;
  await review.deleteOne();
  await recalculateRating(listingId);
}

export async function approveReview(reviewId) {
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { isApproved: true, moderationResult: 'approved', moderationReason: 'Manually approved by admin' },
    { new: true }
  );
  if (!review) throw new Error('Review not found');
  await recalculateRating(review.listing);
  return review;
}

export async function getReviewSummary(listingId) {
  const breakdown = await Review.aggregate([
    { $match: { listing: new mongoose.Types.ObjectId(listingId), isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  const listing = await MarketplaceListing.findById(listingId, 'averageRating reviewCount').lean();

  return {
    averageRating: listing?.averageRating || 0,
    reviewCount: listing?.reviewCount || 0,
    breakdown: breakdown.map((b) => ({ stars: b._id, count: b.count })),
  };
}
