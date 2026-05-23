import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  deleteOrder,
  resendOrderDocuments,
  getOrdersByUserId,
  searchOrders
} from '../app/controllers/orderController.js';
import authMiddleware from '../app/middleware/authMiddleware.js';
import verifyTokenMiddleware from '../app/middleware/verifyTokenMiddleware.js';

const router = express.Router();

router.post('/', verifyTokenMiddleware, authMiddleware, createOrder);
router.get('/',  verifyTokenMiddleware,authMiddleware, getOrders);
router.get('/search', searchOrders);
router.get('/:id',  verifyTokenMiddleware,authMiddleware, getOrderDetails);
router.patch('/:id/status',  verifyTokenMiddleware,authMiddleware,  updateOrderStatus);
router.delete('/:id',  verifyTokenMiddleware,authMiddleware ,deleteOrder);
router.post('/:id/resend-docs',  verifyTokenMiddleware,authMiddleware,  resendOrderDocuments);
router.get('/user/:userId', verifyTokenMiddleware,authMiddleware , getOrdersByUserId);


export default router;
