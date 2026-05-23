import stripe from '../../lib/config/stripe.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order } from '../models/Order.js';
import { MarketplaceListing } from '../models/MarketPlace.js';
import { sendBulkOrdersToSFTP } from '../../lib/integration/sendOrderToSFTP.js';
import { sendSuccessfulPaymentEmail } from './nexcessService.js';



dotenv.config();


const rateLimitMap = new Map();

const RATE_LIMIT_MS = 30 * 1000;
let readyOrdersBuffer = [];
const BULK_ORDER_LIMIT = 5;




export const createPaymentIntentForOrder = async ({
  userId,
  email,
  shippingAddress,
  items,
  subtotal,
  shippingFee,
  total,
  currency = "gbp",
  token,
}) => {
  // --- 1. Validation ---
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid or missing userId");
  }

  const amountInCents = Math.round(total * 100);
  if (amountInCents < 50) {
    throw new Error("Total must be at least £0.50");
  }

  if (!token || typeof token !== "string") {
    throw new Error("Missing or invalid Stripe token");
  }

  const user = await User.findById(userId);
  if (!user) throw new Error(`User not found for userId: ${userId}`);
  const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };
  
  if (rateLimitMap.has(userId)) {
    const lastCall = rateLimitMap.get(userId);
    const now = Date.now();
    if (now - lastCall < RATE_LIMIT_MS) {
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil(
          (RATE_LIMIT_MS - (now - lastCall)) / 1000
        )} seconds before creating another payment.`
      );
    }
  }
  
  // record this call
  rateLimitMap.set(userId, Date.now());
  

  // --- 2. Resolve Listings ---
  const normalizeTitle = (title) =>
  title
    .replace(/\(\d+\)$/, "") // remove (4161373)
    .trim()
    .toLowerCase();

    const normalizedItemTitles = items.map((item) =>
    normalizeTitle(item.title)
  );
  
  // Fetch possible matches using loose regex
  const listings = await MarketplaceListing.find({
    $or: normalizedItemTitles.map((title) => ({
      title: { $regex: escapeRegex(title), $options: "i" },
    })),
  });
  
// Now filter properly in memory



  

// --- 2B. Validate Listings Gracefully ---
const stockIssues = [];

const formattedItems = items.map((item) => {
  const normalizedItemTitle = normalizeTitle(item.title);

  const matchedListing = listings.find(
    (listing) =>
      normalizeTitle(listing.title) === normalizedItemTitle
  );

  if (!matchedListing) {
    stockIssues.push({
      title: item.title,
      reason: "not_found",
    });
    return null;
  }

  const requestedQty = item.quantity || 1;

  if (!matchedListing.isPublished || matchedListing.isArchived) {
    stockIssues.push({
      title: item.title,
      reason: "unavailable",
    });
    return null;
  }

  if (matchedListing.stock < requestedQty) {
    stockIssues.push({
      title: item.title,
      reason: "insufficient_stock",
      available: matchedListing.stock,
    });
    return null;
  }

  return {
    listing: matchedListing._id,
    quantity: requestedQty,
    priceAtPurchase: matchedListing.discountedPrice,
    currency: currency.toUpperCase(),
  };
}).filter(Boolean);

// 🚨 STOP HERE if any issue
if (stockIssues.length > 0) {
  return {
    success: false,
    type: "stock_error",
    message: "Some items are unavailable.",
    items: stockIssues,
  };
}


  

  // --- 3. Normalize Shipping Address ---
  const formattedShippingAddress = {
    fullName: shippingAddress.name,
    phoneNumber: shippingAddress.phoneNumber,
    addressLine1: shippingAddress.line1,
    addressLine2: shippingAddress.line2 || "",
    city: shippingAddress.city,
    state: shippingAddress.state || "",
    postalCode: shippingAddress.postalCode,
    country: shippingAddress.country,
  };

  // --- 4. Create Stripe Payment Method ---
  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: { token },
    billing_details: {
      name: shippingAddress.name,
      email,
    },
  });

  // --- 5. Create + Confirm Stripe PaymentIntent ---
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    confirm: true,
    capture_method: "automatic",
    payment_method: paymentMethod.id,
    payment_method_types: ["card"],
    receipt_email: email,
    metadata: {
      userId,
      paymentType: "order",
    },
    shipping: {
      name: shippingAddress.name,
      address: {
        line1: shippingAddress.line1,
        city: shippingAddress.city,
        postal_code: shippingAddress.postalCode,
        country: shippingAddress.country,
      },
    },
  });

  const paymentIntentId = paymentIntent.id;

  // --- 6. Extract Receipt URL ---

  await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5s delay

  let refreshedIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });

  // Retry once if receipt_url is still missing
  if (!refreshedIntent?.latest_charge?.receipt_url) {
    console.warn("⚠️ Receipt URL not ready, retrying Stripe fetch...");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    refreshedIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
  }

  const receiptUrl = refreshedIntent?.latest_charge?.receipt_url || null;
  const finalStatus = receiptUrl ? "succeeded" : "pending";


  // --- 7. Save Payment Record ---
  await Payment.create({
    user: user._id,
    amount: total,
    currency,
    reference: paymentIntentId,
    status: finalStatus,
    paymentIntentId,
    receiptUrl,
    type: "order-payment",
    email,
    items: formattedItems,
    shippingAddress: formattedShippingAddress,
  });

  const paymentStatus =
  paymentIntent.status === "succeeded"
    ? "paid"
    : paymentIntent.status === "requires_action"
    ? "pending"
    : "unpaid";

  // --- 8. Create Order ---
  const newOrder = await Order.create({
    user: user._id,
    items: formattedItems,
    shippingAddress: formattedShippingAddress,
    subtotal,
    shippingFee,
    total,
    currency,
    email,
    status: "ordered",
    paymentIntentId,
    payment: {
      status: paymentStatus,
      method: "card",
      transactionId: paymentIntentId,
      paidAt: paymentStatus === "paid" ? new Date() : null,
    },
  });


  
// --- 9. Decrement Stock Atomically ---
// --- 9. Decrement Stock Atomically ---
for (const item of formattedItems) {
  const updated = await MarketplaceListing.findOneAndUpdate(
    {
      _id: item.listing,
      stock: { $gte: item.quantity },
    },
    {
      $inc: {
        stock: -item.quantity,
        purchases: item.quantity,
      },
    },
    { new: true }
  );

  if (!updated) {
    return {
      success: false,
      type: "race_condition",
      message:
        "One of the items just sold out during checkout. Please try again.",
    };
  }
}




  // --- 10. Return Result ---
  return {
    clientSecret: paymentIntent.client_secret,
    reference: paymentIntentId,
    orderId: newOrder._id.toString(),
    status: paymentIntent.status,
    requiresAction: paymentIntent.status === "requires_action",
    nextAction: paymentIntent.next_action || null,
    receiptUrl,
  };
};












export const getAllPayments = async () => {
  return await Payment.find().populate('user bookingId');
};



export const getPaymentById = async (paymentId) => {
    return await Payment.findById(paymentId).populate('userId bookingId');
};

export const getUserPayments = async (userId) => {
    return await Payment.find({ user: userId }).populate('bookingId');
};

export const processRefund = async (paymentId) => {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'succeeded') throw new Error('Cannot refund an incomplete payment');

    await stripe.refunds.create({ payment_intent: payment.paymentIntentId });
    payment.status = 'refunded';
    await payment.save();

    return payment;
};

export const updatePaymentStatus = async (paymentIntentId, status, receiptUrl = null) => {
    const payment = await Payment.findOne({ paymentIntentId });
    if (!payment) throw new Error('Payment not found');

    payment.status = status;
    if (receiptUrl) payment.receiptUrl = receiptUrl;

    await payment.save();
    return payment;
};


export const creditUserWallet = async (userId, amount) => {
  
    const user = await User.findById(userId);
    user.walletBalance += amount; 
    await user.save();
    return user;
};


export const processSuccessfulPayment = async (reference) => {
  try {
    if (!reference) return { success: false, message: "Missing payment reference." };
    const cleanReference = reference.split("_secret")[0];

    const payment = await Payment.findOne({ reference: cleanReference });
    if (!payment) return { success: false, message: "Payment not found." };

    const paymentIntentId = payment.paymentIntentId;

    // --- Stripe PaymentIntent ---
    const stripeIntent = await stripe.paymentIntents.retrieve(cleanReference, {
      expand: ["latest_charge", "charges.data.balance_transaction"],
    });

    let receiptUrl =
      stripeIntent?.latest_charge?.receipt_url ||
      stripeIntent?.charges?.data?.[0]?.receipt_url ||
      null;

    if (!receiptUrl) {
      const chargeId = stripeIntent?.latest_charge?.id || stripeIntent?.charges?.data?.[0]?.id;
      if (chargeId) {
        try {
          const fullCharge = await stripe.charges.retrieve(chargeId);
          receiptUrl = fullCharge?.receipt_url || null;
        } catch { /* ignored */ }
      }
    }

    // --- Update payment record (only if needed) ---
    if (stripeIntent.status === "succeeded" && payment.status !== "succeeded") {
      payment.status = "succeeded";
      payment.receiptUrl = receiptUrl || `https://dashboard.stripe.com/test/payments/${paymentIntentId}`;
      await payment.save();
    }

    // --- Fetch user and wallet in parallel ---
    const [user, wallet] = await Promise.all([
      User.findById(payment.userId || payment.user),
      Wallet.findOne({ userId: payment.userId || payment.user })
    ]);

    if (!user) return { success: false, message: "User not found." };
    if (!wallet) return { success: false, message: `${user.role} wallet not found.` };

    // --- Wallet update (idempotent) ---
    const existingTransaction = wallet.transactions.find(txn => txn.transactionId === cleanReference);
    const walletUpdatePromise = existingTransaction
      ? Promise.resolve(wallet)
      : Wallet.findOneAndUpdate(
          { _id: wallet._id },
          {
            $inc: { balance: payment.amount },
            $push: {
              transactions: {
                transactionId: cleanReference,
                amount: payment.amount,
                date: new Date(),
                type: "credit",
                description: `Payment received with reference: ${cleanReference}`,
                status: "completed",
                to: user._id,
                from: "SYSTEM",
                receiptUrl: payment.receiptUrl,
              },
            },
          },
          { new: true }
        );

    // --- Order update ---
    const orderUpdatePromise = Order.findOneAndUpdate(
      { paymentIntentId },
      {
        $set: {
          "payment.status": "paid",
          "payment.paidAt": new Date(),
          status: "ordered",
        },
      },
      { new: true }
    );

    const [, order] = await Promise.all([walletUpdatePromise, orderUpdatePromise]);

    // --- Deduct inventory in parallel ---
    if (order?.items?.length) {
      const inventoryUpdates = order.items.map(item =>
        MarketplaceListing.findByIdAndUpdate(item.listing, { $inc: { stock: -item.quantity } })
      );
      await Promise.all(inventoryUpdates);
    }

    // --- Trigger email & SFTP asynchronously (don't block) ---
    sendSuccessfulPaymentEmail({
      user,
      amount: payment.amount,
      reference: cleanReference,
      receiptUrl: payment.receiptUrl,
      order,
    }).catch(err => console.error("❌ Email error:", err));

    const unexportedOrders = await Order.find({ paymentIntentId, exportedToSftp: { $ne: true } });
    if (unexportedOrders.length) {
      readyOrdersBuffer.push(...unexportedOrders);

      if (readyOrdersBuffer.length >= BULK_ORDER_LIMIT) {
        // async SFTP upload, don't await to speed up response
        (async () => {
          try {
            const result = await sendBulkOrdersToSFTP(readyOrdersBuffer);
            await Promise.all(readyOrdersBuffer.map(o => {
              o.exportedToSftp = true;
              return o.save();
            }));
            readyOrdersBuffer = [];
            console.log(`✅ Orders exported to SFTP: ${result.path}`);
          } catch (err) {
            console.error("❌ SFTP upload failed:", err.message);
          }
        })();
      }
    }

    return {
      success: true,
      message: "Payment processed successfully.",
      receiptUrl: payment.receiptUrl,
      orderId: order?._id?.toString() || null,
    };
  } catch (error) {
    console.error("❌ Payment processing error:", error);
    return { success: false, message: "Error processing payment.", error: error.message };
  }
};









export const getOrCreateStripeAccount = async (user) => {
    if (user.stripeAccountId) {
      return user.stripeAccountId;
    }
  
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Change based on user location
      email: user.email,
      business_type: 'individual',
      capabilities: {
        transfers: { requested: true },
      },
    });
  
    user.stripeAccountId = account.id;
    await user.save();
    return account.id;
  };

  export const attachBankAccount = async (stripeAccountId, routingNumber, accountNumber, accountHolderName) => {
    const bankAccount = await stripe.accounts.createExternalAccount(
      stripeAccountId,
      {
        external_account: {
          object: 'bank_account',
          country: 'US', // Adjust based on user country
          currency: 'usd',
          routing_number: routingNumber,
          account_number: accountNumber,
          account_holder_name: accountHolderName,
          account_holder_type: 'individual',
        }
      }
    );
  
    return bankAccount;
  };

  export const sendPayout = async (stripeAccountId, amountInCents) => {
    const payout = await stripe.payouts.create({
      amount: amountInCents,
      currency: 'usd',
    }, {
      stripeAccount: stripeAccountId
    });
  
    return payout;
  };

  export const createStripeOnboardingLink = async (user) => {
    const accountId = user.stripeAccountId;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'https://your-app.com/retry-onboarding',
      return_url: 'https://your-app.com/onboarding-success',
      type: 'account_onboarding',
    });
    return accountLink.url;
  };
  
  
  export const createBankAccountSetupIntent = async (stripeAccountId) => {
    const setupIntent = await stripe.setupIntents.create({
      usage: 'off_session',
    }, {
      stripeAccount: stripeAccountId
    });
  
    return setupIntent.client_secret;
  };
  