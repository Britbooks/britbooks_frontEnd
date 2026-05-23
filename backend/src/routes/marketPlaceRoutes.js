import express from 'express';
import {
  handleCreateListing,
  handleUpdateListing,
  handleArchiveListing,
  handleGetAdminListings,
  handleGetPublishedListings,
  handleGetListingById,
  handleSearchListings,
  handleIncrementViews,
  handleMarkAsPurchased,
  handlePublishStatus,
  handleDeleteListing,
  handleBulkUpdate,
  handleModerationFlag,
  handleListingStats,
  handleCSVSync,
} from '../app/controllers/MarketPlaceController.js';
import { getCategories,getSubcategories } from '../app/controllers/categoryController.js';
import verifyTokenMiddleware from '../app/middleware/verifyTokenMiddleware.js';
import authMiddleware from '../app/middleware/authMiddleware.js';

const router = express.Router();

// --- Categories endpoints
router.get('/categories', getCategories);
router.get('/categories/:parentSlug/subcategories', getSubcategories);

// Public read endpoints
router.get('/published', handleGetPublishedListings);
router.get('/search', handleSearchListings);
router.get('/stats', handleListingStats);
router.get('/:id', handleGetListingById);
router.post('/:id/views', handleIncrementViews);
router.post('/:id/purchase', handleMarkAsPurchased);

// Auth required — write operations
router.post('/', verifyTokenMiddleware, authMiddleware, handleCreateListing);
router.put('/:id', verifyTokenMiddleware, authMiddleware, handleUpdateListing);
router.patch('/:id/archive', verifyTokenMiddleware, authMiddleware, handleArchiveListing);
router.post('/admin/listings',  handleGetAdminListings);
router.post('/csv-sync', verifyTokenMiddleware, authMiddleware, handleCSVSync);
router.post('/:id/publish', verifyTokenMiddleware, authMiddleware, handlePublishStatus);
router.delete('/:id', verifyTokenMiddleware, authMiddleware, handleDeleteListing);
router.post('/bulk-update', verifyTokenMiddleware, authMiddleware, handleBulkUpdate);
router.post('/:id/moderation-flag', verifyTokenMiddleware, authMiddleware, handleModerationFlag);




export default router;
