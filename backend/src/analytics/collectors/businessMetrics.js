/**
 * Business Metrics Collector
 * Snapshots order cycle, user lifecycle, revenue, listings, and wallet
 * every hour — stored as BusinessSnapshot documents.
 *
 * Also exposes real-time query helpers for the dashboard.
 */

import cron from 'node-cron';
import BusinessSnapshot from '../models/BusinessSnapshot.js';

// ─── Lazy model imports (avoid circular at startup) ───────────────────────────

async function models() {
  const [
    { default: User },
    { Order },
    { default: Payment },
    { default: Wallet },
    { MarketplaceListing },
  ] = await Promise.all([
    import('../../app/models/User.js'),
    import('../../app/models/Order.js'),
    import('../../app/models/Payment.js'),
    import('../../app/models/Wallet.js'),
    import('../../app/models/MarketPlace.js'),
  ]);
  return { User, Order, Payment, Wallet, MarketplaceListing };
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// ─── User analytics ───────────────────────────────────────────────────────────

async function collectUserMetrics(User, Order) {
  const [
    total,
    active,
    suspended,
    verified,
    newToday,
    newThisWeek,
    byProvider,
    usersWithOrders,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'suspended' }),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ createdAt: { $gte: startOfDay() } }),
    User.countDocuments({ createdAt: { $gte: startOfWeek() } }),
    User.aggregate([
      { $group: { _id: '$authProvider', count: { $sum: 1 } } },
    ]),
    Order.distinct('user', { type: 'order' }).then(ids => ids.length),
  ]);

  const providerMap = { local: 0, google: 0, facebook: 0 };
  for (const { _id, count } of byProvider) {
    if (_id in providerMap) providerMap[_id] = count;
  }

  return {
    total,
    active,
    suspended,
    verified,
    unverified: total - verified,
    newToday,
    newThisWeek,
    byAuthProvider: providerMap,
    withOrders: usersWithOrders,
  };
}

// ─── Order analytics ──────────────────────────────────────────────────────────

async function collectOrderMetrics(Order) {
  const todayStart = startOfDay();

  const [
    statusCounts,
    _typeCounts,
    financials,
    todayOrders,
    paymentMethodCounts,
    paymentStatusCounts,
    cancelledCount,
    totalOrders,
    totalCarts,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { type: 'order' } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { type: 'order', 'payment.status': 'paid' } },
      {
        $group: {
          _id: null,
          gmv: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
        },
      },
    ]),
    Order.aggregate([
      { $match: { type: 'order', createdAt: { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$total', 0] } },
        },
      },
    ]),
    Order.aggregate([
      { $match: { type: 'order' } },
      { $group: { _id: '$payment.method', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { type: 'order' } },
      { $group: { _id: '$payment.status', count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ type: 'order', status: 'cancelled' }),
    Order.countDocuments({ type: 'order' }),
    Order.countDocuments({ type: 'cart' }),
  ]);

  const statusMap = {};
  for (const { _id, count } of statusCounts) {
    if (_id) statusMap[_id] = count;
  }

  const methodMap = { card: 0, wallet: 0, bank_transfer: 0, cash_on_delivery: 0 };
  for (const { _id, count } of paymentMethodCounts) {
    if (_id in methodMap) methodMap[_id] = count;
  }

  const payStatusMap = { unpaid: 0, paid: 0, failed: 0, refunded: 0 };
  for (const { _id, count } of paymentStatusCounts) {
    if (_id in payStatusMap) payStatusMap[_id] = count;
  }

  const fin = financials[0] || { gmv: 0, avgOrderValue: 0 };
  const today = todayOrders[0] || { count: 0, revenue: 0 };

  return {
    total: totalOrders,
    ordered: statusMap.ordered || 0,
    processing: statusMap.processing || 0,
    dispatched: statusMap.dispatched || 0,
    in_transit: statusMap.in_transit || 0,
    out_for_delivery: statusMap.out_for_delivery || 0,
    delivered: statusMap.delivered || 0,
    cancelled: statusMap.cancelled || 0,
    carts: totalCarts,
    liveOrders: totalOrders,
    gmv: parseFloat((fin.gmv || 0).toFixed(2)),
    avgOrderValue: parseFloat((fin.avgOrderValue || 0).toFixed(2)),
    newToday: today.count,
    revenueToday: parseFloat((today.revenue || 0).toFixed(2)),
    cancellationRate: totalOrders > 0
      ? parseFloat(((cancelledCount / totalOrders) * 100).toFixed(2))
      : 0,
    cartToOrderRate: (totalCarts + totalOrders) > 0
      ? parseFloat((totalOrders / (totalCarts + totalOrders) * 100).toFixed(2))
      : 0,
    byPaymentMethod: methodMap,
    byPaymentStatus: payStatusMap,
  };
}

// ─── Revenue analytics ────────────────────────────────────────────────────────

async function collectRevenueMetrics(Order) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thirtyDaysAgo = daysAgo(30);

  const [gross, refunded, thisMonth, lastMonth, last30Days] = await Promise.all([
    Order.aggregate([
      { $match: { type: 'order', 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { type: 'order', 'payment.status': 'refunded' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { type: 'order', 'payment.status': 'paid', 'payment.paidAt': { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { type: 'order', 'payment.status': 'paid', 'payment.paidAt': { $gte: lastMonthStart, $lt: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { type: 'order', 'payment.status': 'paid', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  const totalGross = gross[0]?.total || 0;
  const totalRefunded = refunded[0]?.total || 0;

  return {
    totalGross: parseFloat(totalGross.toFixed(2)),
    totalRefunded: parseFloat(totalRefunded.toFixed(2)),
    totalNet: parseFloat((totalGross - totalRefunded).toFixed(2)),
    thisMonth: parseFloat((thisMonth[0]?.total || 0).toFixed(2)),
    lastMonth: parseFloat((lastMonth[0]?.total || 0).toFixed(2)),
    avgDailyRevenue: parseFloat(((last30Days[0]?.total || 0) / 30).toFixed(2)),
  };
}

// ─── Listing analytics ────────────────────────────────────────────────────────

async function collectListingMetrics(MarketplaceListing) {
  const [
    total, published, archived, outOfStock, withDiscount,
    conditionCounts, topCategories, avgPrice, totals, aiEnriched,
  ] = await Promise.all([
    MarketplaceListing.countDocuments({}),
    MarketplaceListing.countDocuments({ isPublished: true, isArchived: false }),
    MarketplaceListing.countDocuments({ isArchived: true }),
    MarketplaceListing.countDocuments({ stock: 0 }),
    MarketplaceListing.countDocuments({ 'discount.isActive': true }),
    MarketplaceListing.aggregate([
      { $group: { _id: '$condition', count: { $sum: 1 } } },
    ]),
    MarketplaceListing.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    MarketplaceListing.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: null, avg: { $avg: '$price' } } },
    ]),
    MarketplaceListing.aggregate([
      { $group: { _id: null, views: { $sum: '$views' }, purchases: { $sum: '$purchases' } } },
    ]),
    MarketplaceListing.countDocuments({ aiMetadataFilled: true }),
  ]);

  const condMap = { new: 0, like_new: 0, very_good: 0, good: 0, acceptable: 0 };
  for (const { _id, count } of conditionCounts) {
    const key = (_id || '').replace(/ /g, '_').toLowerCase();
    if (key in condMap) condMap[key] = count;
  }

  return {
    total,
    published,
    unpublished: total - published - archived,
    archived,
    outOfStock,
    withDiscount,
    totalViews: totals[0]?.views || 0,
    totalPurchases: totals[0]?.purchases || 0,
    avgPrice: parseFloat((avgPrice[0]?.avg || 0).toFixed(2)),
    byCondition: condMap,
    topCategories: topCategories.map(c => ({ category: c._id || 'Uncategorised', count: c.count })),
    aiEnriched,
  };
}

// ─── Wallet analytics ─────────────────────────────────────────────────────────

async function collectWalletMetrics(Wallet) {
  const todayStart = startOfDay();

  const [totals, pendingRefunds, txToday] = await Promise.all([
    Wallet.aggregate([
      { $group: { _id: null, count: { $sum: 1 }, totalBalance: { $sum: '$balance' }, avgBalance: { $avg: '$balance' } } },
    ]),
    Wallet.aggregate([
      { $unwind: '$refundRequests' },
      { $match: { 'refundRequests.status': 'pending' } },
      { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$refundRequests.amount' } } },
    ]),
    Wallet.aggregate([
      { $unwind: '$transactions' },
      { $match: { 'transactions.timestamp': { $gte: todayStart } } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    totalWallets: totals[0]?.count || 0,
    totalBalance: parseFloat((totals[0]?.totalBalance || 0).toFixed(2)),
    avgBalance: parseFloat((totals[0]?.avgBalance || 0).toFixed(2)),
    pendingRefunds: pendingRefunds[0]?.count || 0,
    pendingRefundValue: parseFloat((pendingRefunds[0]?.value || 0).toFixed(2)),
    transactionsToday: txToday[0]?.count || 0,
  };
}

// ─── User lifecycle funnel ────────────────────────────────────────────────────

async function collectLifecycleMetrics(User, Order) {
  const thirtyDaysAgo = daysAgo(30);

  const [registered, verified, firstOrders, repeatBuyers] = await Promise.all([
    User.countDocuments({ role: 'user', createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ role: 'user', isVerified: true, createdAt: { $gte: thirtyDaysAgo } }),
    // Users who placed their FIRST order in the last 30 days
    Order.aggregate([
      { $match: { type: 'order', createdAt: { $gte: thirtyDaysAgo } } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: '$user', firstOrder: { $first: '$createdAt' } } },
      { $match: { firstOrder: { $gte: thirtyDaysAgo } } },
      { $count: 'total' },
    ]),
    // Users with 2+ orders in last 30 days
    Order.aggregate([
      { $match: { type: 'order', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } },
      { $count: 'total' },
    ]),
  ]);

  // Avg days from registration to first order (sampled from last 500 users with orders)
  let avgDaysToFirstOrder = 0;
  try {
    const sample = await Order.aggregate([
      { $match: { type: 'order' } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: '$user', firstOrderAt: { $first: '$createdAt' } } },
      { $limit: 500 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          daysDiff: {
            $divide: [{ $subtract: ['$firstOrderAt', '$user.createdAt'] }, 86400000],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: '$daysDiff' } } },
    ]);
    avgDaysToFirstOrder = parseFloat((sample[0]?.avg || 0).toFixed(1));
  } catch { /* ignore */ }

  const firstOrderCount = firstOrders[0]?.total || 0;
  const repeatCount = repeatBuyers[0]?.total || 0;

  return {
    registeredLast30Days: registered,
    verifiedLast30Days: verified,
    firstOrderLast30Days: firstOrderCount,
    repeatBuyersLast30Days: repeatCount,
    verificationRate: registered > 0 ? parseFloat(((verified / registered) * 100).toFixed(1)) : 0,
    activationRate: registered > 0 ? parseFloat(((firstOrderCount / registered) * 100).toFixed(1)) : 0,
    avgDaysToFirstOrder,
  };
}

// ─── Full snapshot ────────────────────────────────────────────────────────────

async function takeSnapshot(period = 'hourly') {
  try {
    const { User, Order, Wallet, MarketplaceListing } = await models();

    const [users, orders, revenue, listings, wallet, userLifecycle] = await Promise.all([
      collectUserMetrics(User, Order),
      collectOrderMetrics(Order),
      collectRevenueMetrics(Order),
      collectListingMetrics(MarketplaceListing),
      collectWalletMetrics(Wallet),
      collectLifecycleMetrics(User, Order),
    ]);

    await BusinessSnapshot.create({
      timestamp: new Date(),
      period,
      users,
      orders,
      revenue,
      listings,
      wallet,
      userLifecycle,
    });

    console.log(`[BusinessMetrics] ${period} snapshot saved`);
  } catch (err) {
    console.error('[BusinessMetrics] Snapshot failed:', err.message);
  }
}

// ─── Real-time queries (no snapshot needed) ───────────────────────────────────

export async function getRealtimeBusinessSummary() {
  const { User, Order, Wallet, MarketplaceListing } = await models();
  const [users, orders, revenue, listings, wallet, lifecycle] = await Promise.all([
    collectUserMetrics(User, Order),
    collectOrderMetrics(Order),
    collectRevenueMetrics(Order),
    collectListingMetrics(MarketplaceListing),
    collectWalletMetrics(Wallet),
    collectLifecycleMetrics(User, Order),
  ]);
  return { users, orders, revenue, listings, wallet, userLifecycle: lifecycle, generatedAt: new Date() };
}

export async function getOrderCycleFunnel() {
  const { Order } = await models();
  const statuses = ['ordered', 'processing', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'];
  const counts = await Order.aggregate([
    { $match: { type: 'order' } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map(c => [c._id, c.count]));
  return statuses.map(s => ({ status: s, count: map[s] || 0 }));
}

export async function getRevenueTimeSeries(days = 30) {
  const { Order } = await models();
  return Order.aggregate([
    { $match: { type: 'order', 'payment.status': 'paid', createdAt: { $gte: daysAgo(days) } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);
}

export async function getUserGrowthTimeSeries(days = 30) {
  const { User } = await models();
  return User.aggregate([
    { $match: { role: 'user', createdAt: { $gte: daysAgo(days) } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);
}

export async function getTopSellingListings(limit = 10) {
  const { Order } = await models();
  return Order.aggregate([
    { $match: { type: 'order', 'payment.status': 'paid' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.listing',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.priceAtPurchase', '$items.quantity'] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'marketplacelistings',
        localField: '_id',
        foreignField: '_id',
        as: 'listing',
      },
    },
    { $unwind: { path: '$listing', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        listingId: '$_id',
        title: '$listing.title',
        author: '$listing.author',
        condition: '$listing.condition',
        price: '$listing.price',
        totalSold: 1,
        totalRevenue: 1,
      },
    },
  ]);
}

export async function getOrdersByUser(userId, limit = 20) {
  const { Order } = await models();
  return Order.find({ user: userId, type: 'order' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function getSnapshotHistory(days = 7, period = 'hourly') {
  return BusinessSnapshot.find({
    period,
    timestamp: { $gte: daysAgo(days) },
  }).sort({ timestamp: 1 }).lean();
}

// ─── Cron ──────────────────────────────────────────────────────────────────────

let started = false;

export function startBusinessMetrics() {
  if (started) return;
  started = true;

  // Hourly snapshot — at minute 0 of every hour
  cron.schedule('0 * * * *', () => takeSnapshot('hourly'), { timezone: 'UTC' });

  // Daily snapshot — at 00:05 UTC
  cron.schedule('5 0 * * *', () => takeSnapshot('daily'), { timezone: 'UTC' });

  // Take one immediately after boot (after 10s delay for DB to settle)
  setTimeout(() => takeSnapshot('hourly'), 10_000);

  console.log('[BusinessMetrics] Hourly + daily snapshots scheduled');
}
