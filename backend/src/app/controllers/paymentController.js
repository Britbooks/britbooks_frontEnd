import stripe from '../../lib/config/stripe.js';
import {
    createPaymentIntentForOrder,
    updatePaymentStatus,
    getAllPayments,
    getPaymentById,
    getUserPayments,
    processRefund,
    processSuccessfulPayment,
    getOrCreateStripeAccount,
    createStripeOnboardingLink,
} from '../services/paymentService.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import { Order } from '../models/Order.js';
import { sendTransferSuccessfulEmail } from '../services/nexcessService.js';


export const createPayment = async (req, res) => {
    try {
      console.log('Create payment payload:', req.body); 
      const result = await createPaymentIntentForOrder(req.body);
      res.status(200).json(result);
    } catch (err) {
      console.error('Payment error:', err);
      res.status(500).json({ message: err.message });
    }
  };
  
  
  
  


export const handleWebhook = async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            await updatePaymentStatus(paymentIntent.id, 'succeeded', paymentIntent.charges.data[0]?.receipt_url);
        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            await updatePaymentStatus(paymentIntent.id, 'failed');
        }

        res.status(200).json({ success: true });
    } catch {
        res.status(400).json({ success: false, error: 'Webhook Error' });
    }
};

// ✅ New: Update Payment Status Manually
export const updatePayment = async (req, res) => {
    try {
        const { status, receiptUrl } = req.body;
        const updatedPayment = await updatePaymentStatus(req.params.id, status, receiptUrl);
        res.json({ success: true, data: updatedPayment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getAllPaymentsController = async (req, res) => {
    try {
        const payments = await getAllPayments();
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getPayment = async (req, res) => {
    try {
        const payment = await getPaymentById(req.params.id);
        if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
        res.json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getUserPaymentsController = async (req, res) => {
    try {
        const payments = await getUserPayments(req.params.userId);
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const refundPayment = async (req, res) => {
    try {
        const payment = await processRefund(req.params.id);
        res.json({ success: true, data: payment });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};


export const handlePaymentSuccess = async (req, res) => {
  try {
    const { reference } = req.body;

    const result = await processSuccessfulPayment(reference);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while confirming payment.",
      error: error.message,
    });
  }
};

  
  
  
  
  


export const withdrawToBank = async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount } = req.body;
  
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid or missing amount." });
      }
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found." });
  
      // Restrict admin withdrawals to only super_admins
      if (user.role === 'admin' && user.adminType !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: "Only super admins can perform withdrawals.",
        });
      }
  
      // Use central admin wallet if admin, else user's wallet
      const wallet = user.role === 'admin'
        ? await Wallet.findOne({ type: 'admin' })
        : await Wallet.findOne({ userId });
  
      if (!wallet || wallet.balance < amount) {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance." });
      }
  
      const stripeAccountId = await getOrCreateStripeAccount(user);
      const account = await stripe.accounts.retrieve(stripeAccountId);
  
      if (!account.payouts_enabled) {
        const onboardingLink = await createStripeOnboardingLink(user);
        return res.status(403).json({
          success: false,
          message: 'Complete onboarding to receive payouts.',
          onboardingLink,
        });
      }
  
      const amountInCents = Math.round(amount * 100);
  
      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: 'usd',
        destination: stripeAccountId,
        transfer_group: `user_withdrawal_${userId}_${Date.now()}`,
      });
  
      console.log('Transfer sent to connected account:', transfer.id);
  
      const payout = await stripe.payouts.create(
        {
          amount: amountInCents,
          currency: 'usd',
        },
        {
          stripeAccount: stripeAccountId,
        }
      );
  
      console.log('Payout sent:', payout.id);
  
      const validateTransaction = (tx) => {
        if (!tx.transactionCategory) {
          throw new Error('Transaction missing transactionCategory');
        }
        if (!tx.transactionId || tx.amount === undefined || !tx.from || !tx.to || !tx.status || !tx.type) {
          throw new Error('Transaction missing required fields');
        }
      };
  
      const newTransaction = {
        transactionId: payout.id,
        amount: -amount,
        timestamp: new Date(),
        type: 'debit',
        description: 'Withdrawal to bank account',
        status: 'completed',
        to: user.email,
        from: 'internal-wallet',
        transactionCategory: 'withdrawal',
      };
  
      console.log('Transaction to be saved:', JSON.stringify(newTransaction, null, 2));
      validateTransaction(newTransaction);
  
      const invalidTxs = wallet.transactions.filter(tx => !tx.transactionCategory);
      if (invalidTxs.length > 0) {
        console.log(`Found ${invalidTxs.length} invalid transactions in wallet`);
        wallet.transactions = wallet.transactions.map(tx => ({
          ...tx.toObject(),
          transactionCategory: tx.transactionCategory || 'withdrawal'
        }));
      }
  
      wallet.balance -= amount;
      wallet.transactions.push(newTransaction);
  
      await wallet.save();
  
  
  
  
  
      try {
        await sendTransferSuccessfulEmail({
          user,
          amount,
          transactionId: payout.id,
          balance: wallet.balance,
          type: 'withdrawal',
        });
      } catch (emailErr) {
        console.error('Failed to send withdrawal email:', emailErr);
      }
  
      return res.status(200).json({
        success: true,
        message: "Withdrawal successful",
        payoutId: payout.id,
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
  
  
  export async function handlePaymentSuccessProgrammatically(
    orderId,
    source = "TEST-ONLINE-PAYMENT"
  ) {
    let order;
    try {
      order = await Order.findById(orderId).populate("items.listing");
      if (!order) throw new Error("Order not found");
  
      // Prevent processing the same order twice
      if (order.payment?.status === "paid") {
        console.log(`Order ${orderId} already marked as paid – skipping`);
        return { success: true, orderId, note: "already_paid" };
      }
  
      // 1. Mark payment as paid
      order.payment.status = "paid";
      order.payment.method = order.payment.method || "card";
      order.payment.paidAt = new Date();
  
      // 2. Move order status to "processing" (valid enum value)
      order.status = "processing";
  
      // 3. Record in history
      order.history.push({
        status: "processing",
        updatedAt: new Date(),
        note: `Payment confirmed via ${source}`,
      });
  
      // 4. Save everything
      await order.save();
  
      console.log(`Payment success → Order ${orderId} is now PROCESSING`);
  
      return {
        success: true,
        orderId,
        status: order.status,
      };
  
    } catch (err) {
      console.error("Programmatic payment handler failed:", err);
  
      // Optionally mark as failed so it's visible in DB
      if (order && order.payment?.status !== "paid") {
        order.payment.status = "failed";
        await order.save().catch(() => {});
      }
  
      return {
        success: false,
        error: err.message,
      };
    }
  }