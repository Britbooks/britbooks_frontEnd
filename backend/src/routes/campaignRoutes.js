import express from 'express';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  duplicateCampaign,
  getCampaignAnalytics,
  exportCampaigns,
  generateCode,
  validateCode,
  claimReward,
  clearanceSuggestions,
  createClearance,
  getCampaignListings,
  endClearanceCampaign,
} from '../app/controllers/campaignController.js';
import verifyTokenMiddleware from '../app/middleware/verifyTokenMiddleware.js';
import authMiddleware from '../app/middleware/authMiddleware.js';
import { authorizeAdmin } from '../app/middleware/adminMiddleware.js';

const router = express.Router();

// Public (checkout flow + game rewards)
router.post('/validate', validateCode);
router.post('/redeem', validateCode);
router.post('/claim-reward', claimReward);

// Admin — fixed routes before /:id
router.get('/export', verifyTokenMiddleware, authMiddleware, authorizeAdmin, exportCampaigns);
router.post('/generate-code', verifyTokenMiddleware, authMiddleware, authorizeAdmin, generateCode);
router.get('/clearance/suggestions', verifyTokenMiddleware, authMiddleware, authorizeAdmin, clearanceSuggestions);
router.post('/clearance', verifyTokenMiddleware, authMiddleware, authorizeAdmin, createClearance);

// Admin — CRUD
router.get('/', verifyTokenMiddleware, authMiddleware, authorizeAdmin, getCampaigns);
router.post('/', verifyTokenMiddleware, authMiddleware, authorizeAdmin, createCampaign);
router.get('/:id', verifyTokenMiddleware, authMiddleware, authorizeAdmin, getCampaignById);
router.put('/:id', verifyTokenMiddleware, authMiddleware, authorizeAdmin, updateCampaign);
router.delete('/:id', verifyTokenMiddleware, authMiddleware, authorizeAdmin, deleteCampaign);
router.post('/:id/duplicate', verifyTokenMiddleware, authMiddleware, authorizeAdmin, duplicateCampaign);
router.get('/:id/analytics', verifyTokenMiddleware, authMiddleware, authorizeAdmin, getCampaignAnalytics);
router.get('/:id/listings', verifyTokenMiddleware, authMiddleware, authorizeAdmin, getCampaignListings);
router.delete('/:id/clearance', verifyTokenMiddleware, authMiddleware, authorizeAdmin, endClearanceCampaign);

export default router;
