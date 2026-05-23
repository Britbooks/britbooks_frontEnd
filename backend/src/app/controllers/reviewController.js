import { sendSupportReviewRequest } from "../services/nexcessService.js";
import {
  createReview,
  getReviewsByListing,
  getReviewsByUser,
  deleteReview,
  approveReview,
  getReviewSummary,
} from '../services/reviewService.js';

// Existing — do not remove
export const reviewTriggerFromOutlook = async (req, res) => {
  try {
    const forwardedEmail = req.body;

    const customerEmail =
      forwardedEmail.from ||
      forwardedEmail.reply_to ||
      forwardedEmail.original_sender;

    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email not found" });
    }

    await sendSupportReviewRequest(customerEmail);
    return res.json({ success: true });
  } catch (err) {
    console.error("Review trigger error:", err);
    res.status(500).json({ error: "Failed to send review email" });
  }
};

// POST /api/reviews
export const submitReview = async (req, res) => {
  try {
    const { listingId, rating, title, body, orderId } = req.body;
    const userId = req.user.userId;

    if (!listingId || !rating) {
      return res.status(400).json({ success: false, error: 'listingId and rating are required' });
    }

    const { review, moderation } = await createReview({ userId, listingId, rating, title, body, orderId });
    res.status(201).json({
      success: true,
      data: review,
      moderation: {
        status: moderation.decision,
        message: moderation.decision === 'approved'
          ? 'Your review is live.'
          : 'Your review did not pass our content policy and was not published.',
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'You have already reviewed this item' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/reviews/listing/:listingId
export const getListingReviews = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const data = await getReviewsByListing(req.params.listingId, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/reviews/listing/:listingId/summary
export const getListingReviewSummary = async (req, res) => {
  try {
    const summary = await getReviewSummary(req.params.listingId);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/reviews/user/:userId
export const getUserReviews = async (req, res) => {
  try {
    const reviews = await getReviewsByUser(req.params.userId);
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/reviews/:id
export const removeReview = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    await deleteReview(req.params.id, req.user.userId, isAdmin);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    const status = err.message.includes('authorised') ? 403 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

// PATCH /api/reviews/:id/approve  (admin only)
export const approveReviewController = async (req, res) => {
  try {
    const review = await approveReview(req.params.id);
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
