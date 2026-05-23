import express from 'express';
import {
  getAllInvoices,
  getInvoicesByUserId,
  downloadInvoicePdf,
} from '../app/controllers/invoiceController.js';
import verifyTokenMiddleware from '../app/middleware/verifyTokenMiddleware.js';
import authMiddleware from '../app/middleware/authMiddleware.js';

const router = express.Router();

// GET /api/invoices — all invoices (paid orders)
router.get('/', verifyTokenMiddleware, authMiddleware, getAllInvoices);

// GET /api/invoices/user/:userId — invoices for a specific user
router.get('/user/:userId', verifyTokenMiddleware, authMiddleware, getInvoicesByUserId);

// GET /api/invoices/:orderId/pdf — download invoice as PDF
router.get('/:orderId/pdf', verifyTokenMiddleware, authMiddleware, downloadInvoicePdf);

export default router;
