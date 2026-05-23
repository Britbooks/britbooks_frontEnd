import mongoose from 'mongoose';

/**
 * Hourly business snapshot — aggregated from Orders, Users, Payments, Wallet, MarketPlace
 */
const businessSnapshotSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  period: { type: String, enum: ['hourly', 'daily'], default: 'hourly', index: true },

  users: {
    total: Number,
    active: Number,          // status === 'active'
    suspended: Number,
    verified: Number,
    unverified: Number,
    newToday: Number,        // createdAt >= start of day
    newThisWeek: Number,
    byAuthProvider: {
      local: Number,
      google: Number,
      facebook: Number,
    },
    withOrders: Number,      // users who have placed at least one order
  },

  orders: {
    total: Number,
    // by status
    ordered: Number,
    processing: Number,
    dispatched: Number,
    in_transit: Number,
    out_for_delivery: Number,
    delivered: Number,
    cancelled: Number,
    // carts vs live orders
    carts: Number,
    liveOrders: Number,
    // financials
    gmv: Number,             // gross merchandise value (sum of total for paid orders)
    avgOrderValue: Number,
    // today
    newToday: Number,
    revenueToday: Number,
    // rates
    cancellationRate: Number,       // %
    cartToOrderRate: Number,        // % carts converted to type=order
    // payment
    byPaymentMethod: {
      card: Number,
      wallet: Number,
      bank_transfer: Number,
      cash_on_delivery: Number,
    },
    byPaymentStatus: {
      unpaid: Number,
      paid: Number,
      failed: Number,
      refunded: Number,
    },
  },

  revenue: {
    totalGross: Number,       // sum of all paid order totals (GBP)
    totalRefunded: Number,    // sum of refunded orders
    totalNet: Number,         // gross - refunded
    thisMonth: Number,
    lastMonth: Number,
    avgDailyRevenue: Number,  // last 30 days
  },

  listings: {
    total: Number,
    published: Number,
    unpublished: Number,
    archived: Number,
    outOfStock: Number,       // stock === 0
    withDiscount: Number,
    totalViews: Number,
    totalPurchases: Number,
    avgPrice: Number,
    // by condition
    byCondition: {
      new: Number,
      like_new: Number,
      very_good: Number,
      good: Number,
      acceptable: Number,
    },
    topCategories: [{ category: String, count: Number }],   // top 5
    topSellers: [{ sellerId: String, count: Number }],       // top 5 by listing count
    aiEnriched: Number,       // aiMetadataFilled === true
  },

  wallet: {
    totalWallets: Number,
    totalBalance: Number,     // sum of all wallet balances (GBP)
    avgBalance: Number,
    pendingRefunds: Number,   // refundRequests with status=pending
    pendingRefundValue: Number,
    transactionsToday: Number,
  },

  userLifecycle: {
    // Funnel: registered → verified → first order → repeat buyer
    registeredLast30Days: Number,
    verifiedLast30Days: Number,
    firstOrderLast30Days: Number,   // users who placed their first order in 30d
    repeatBuyersLast30Days: Number, // users with 2+ orders in 30d
    verificationRate: Number,       // % verified / registered
    activationRate: Number,         // % placed ≥1 order / registered
    avgDaysToFirstOrder: Number,    // avg days between createdAt and first order placedAt
  },

}, { timestamps: false });

businessSnapshotSchema.index({ timestamp: -1, period: 1 });

export default mongoose.model('BusinessSnapshot', businessSnapshotSchema);
