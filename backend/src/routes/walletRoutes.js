import express from 'express';
import * as WalletController from '../app/controllers/walletController.js';

import { getAllTransactions, getAllWallets } from '../app/controllers/walletController.js';
import verifyTokenMiddleware from '../app/middleware/verifyTokenMiddleware.js';
import authMiddleware from '../app/middleware/authMiddleware.js';

const router = express.Router();

const auth = [verifyTokenMiddleware, authMiddleware];

router.post('/create', WalletController.createWallet);

router.post('/credit', ...auth, WalletController.creditWallet);
router.post('/pay', ...auth, WalletController.makePayment);
router.post('/transfer', ...auth, WalletController.transferFundsWalletToWallet);
router.post('/request-refund', ...auth, WalletController.requestRefund);
router.get('/pending-refunds', ...auth, WalletController.getPendingRefundsController);
router.post('/process-refund', ...auth, WalletController.processRefundController);

router.get('/refunds', WalletController.getRefundsController);

router.get('/balances', ...auth, WalletController.getAllWalletBalances);
router.get('/balances/:walletId', WalletController.getWalletBalanceById);
router.get('/refund/:refundId', WalletController.getRefundById);

router.get('/me', ...auth, WalletController.getWalletDetails);
router.get('/', getAllWallets);
router.get('/transactions', ...auth, getAllTransactions);
router.get('/transaction/:transactionId', WalletController.getTransactionById);
router.get('/transactions/user/:userId', ...auth, WalletController.getWalletTransactionsByUserId);

router.get('/:id', WalletController.getWalletById);

export default router;

