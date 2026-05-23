import express from 'express';
import {
  submitReview,
  getListingReviews,
  getListingReviewSummary,
  getUserReviews,
  removeReview,
  approveReviewController,
} from '../app/controllers/reviewController.js';
import verifyTokenMiddleware from '../app/middleware/verifyTokenMiddleware.js';
import authMiddleware from '../app/middleware/authMiddleware.js';
import { authorizeAdmin } from '../app/middleware/adminMiddleware.js';

const router = express.Router();

// Public
router.get('/listing/:listingId', getListingReviews);
router.get('/listing/:listingId/summary', getListingReviewSummary);

// Authenticated
router.post('/', verifyTokenMiddleware, authMiddleware, submitReview);
router.get('/user/:userId', verifyTokenMiddleware, authMiddleware, getUserReviews);
router.delete('/:id', verifyTokenMiddleware, authMiddleware, removeReview);

// Admin only
router.patch('/:id/approve', verifyTokenMiddleware, authMiddleware, authorizeAdmin, approveReviewController);

export default router;
