import Campaign from '../models/Campaign.js';
import CampaignRedemption from '../models/CampaignRedemption.js';
import { MarketplaceListing } from '../models/MarketPlace.js';
import mongoose from 'mongoose';

// ─── Code generator ──────────────────────────────────────────
export const generateUniqueCode = async (prefix = '') => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let exists = true;

  while (exists) {
    const random = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    code = prefix ? `${prefix.toUpperCase()}${random}` : random;
    exists = await Campaign.exists({ code });
  }

  return code;
};

// ─── Validate code at checkout ───────────────────────────────
export const validateCampaignCode = async ({ code, userId, cartTotal }) => {
  const now = new Date();

  const campaign = await Campaign.findOne({
    code: code.toUpperCase(),
    status: 'active',
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  });

  if (!campaign) throw new Error('Invalid or expired campaign code');

  if (cartTotal < campaign.minimumOrderValue) {
    throw new Error(`Minimum order value of £${campaign.minimumOrderValue} not met`);
  }

  // Check total uses cap
  if (campaign.maxTotalUses && campaign.uses >= campaign.maxTotalUses) {
    throw new Error('This campaign has reached its usage limit');
  }

  // Per-user usage limit
  const userUses = await CampaignRedemption.countDocuments({
    campaign: campaign._id,
    user: userId,
  });

  if (campaign.maxUsesPerUser && userUses >= campaign.maxUsesPerUser) {
    throw new Error('You have already used this campaign code');
  }

  // Compute discount
  let discountAmount = 0;
  if (campaign.type === 'percentage') {
    discountAmount = (cartTotal * campaign.value) / 100;
  } else if (campaign.type === 'fixed') {
    discountAmount = Math.min(campaign.value, cartTotal);
  } else if (campaign.type === 'free_shipping') {
    discountAmount = 0; // handled at shipping level
  }

  const finalTotal = Math.max(cartTotal - discountAmount, 0);

  return {
    campaignId: campaign._id,
    title: campaign.title,
    type: campaign.type,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalTotal: Math.round(finalTotal * 100) / 100,
    isFreeShipping: campaign.type === 'free_shipping',
  };
};

// ─── Redeem after successful order ───────────────────────────
export const redeemCampaign = async ({ campaignId, userId, orderId, discountAmount }) => {
  await CampaignRedemption.create({
    campaign: campaignId,
    user: userId,
    order: orderId,
    discountAmount,
  });

  // Check if this user has redeemed before
  const previousRedemptions = await CampaignRedemption.countDocuments({
    campaign: campaignId,
    user: userId,
  });

  const isNewUser = previousRedemptions === 1; // just created above = first time

  await Campaign.findByIdAndUpdate(campaignId, {
    $inc: {
      uses: 1,
      revenue: discountAmount,
      ...(isNewUser && { uniqueUsers: 1 }),
    },
  });
};

// ─── Game reward claim — creates a real single-use Campaign ──
const GAME_PRIZE_MAP = {
  SPIN10:    { type: 'percentage',    value: 10,  title: '10% Off — Spin the Wheel' },
  FREESHIP:  { type: 'free_shipping', value: 0,   title: 'Free Shipping — Game Reward' },
  SPIN15:    { type: 'percentage',    value: 15,  title: '15% Off — Spin the Wheel' },
  SPIN20:    { type: 'percentage',    value: 20,  title: '20% Off — Spin the Wheel' },
  SPIN5:     { type: 'percentage',    value: 5,   title: '5% Off — Spin the Wheel' },
  TWO0FF:    { type: 'fixed',        value: 2,   title: '£2 Off — Spin the Wheel' },
  SCRATCH12: { type: 'percentage',    value: 12,  title: '12% Off — Scratch Card' },
  THREE0FF:  { type: 'fixed',        value: 3,   title: '£3 Off — Scratch Card' },
  SCRATCH8:  { type: 'percentage',    value: 8,   title: '8% Off — Scratch Card' },
  SCRATCH15: { type: 'percentage',    value: 15,  title: '15% Off — Scratch Card' },
  MYSTBOOK:  { type: 'fixed',        value: 5,   title: '£5 Off — Mystery Box' },
};

export const claimGameReward = async ({ prizeKey }) => {
  const prize = GAME_PRIZE_MAP[prizeKey?.toUpperCase()];
  if (!prize) throw new Error('Unknown prize');

  const code = await generateUniqueCode('BB');
  const now  = new Date();
  const end  = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days validity

  const campaign = await Campaign.create({
    title:           prize.title,
    code,
    type:            prize.type,
    value:           prize.value,
    status:          'active',
    startDate:       now,
    endDate:         end,
    maxTotalUses:    1,
    maxUsesPerUser:  1,
    minimumOrderValue: 0,
    applyTo:         'all_products',
    targetAudience:  'all',
    conditions:      'Generated via game reward',
  });

  return {
    code: campaign.code,
    type: campaign.type,
    value: campaign.value,
    title: campaign.title,
    expiresAt: end,
  };
};

// ─── Analytics with daily breakdown ──────────────────────────
export const getCampaignAnalyticsData = async (campaignId) => {
  const id = new mongoose.Types.ObjectId(campaignId);

  const [campaign, aggResult, dailyBreakdown] = await Promise.all([
    Campaign.findById(campaignId).lean(),

    CampaignRedemption.aggregate([
      { $match: { campaign: id } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$discountAmount' },
          totalUses: { $sum: 1 },
          uniqueUserIds: { $addToSet: '$user' },
        },
      },
    ]),

    CampaignRedemption.aggregate([
      { $match: { campaign: id } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          uses: { $sum: 1 },
          revenue: { $sum: '$discountAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  if (!campaign) throw new Error('Campaign not found');

  const stats = aggResult[0] || { totalRevenue: 0, totalUses: 0, uniqueUserIds: [] };
  const uniqueUsers = stats.uniqueUserIds.length;
  const conversionRate = uniqueUsers > 0
    ? `${((stats.totalUses / uniqueUsers) * 100).toFixed(1)}%`
    : '—';

  return {
    campaign,
    metrics: {
      revenue: stats.totalRevenue,
      uses: stats.totalUses,
      uniqueUsers,
      conversionRate,
    },
    dailyBreakdown: dailyBreakdown.map((d) => ({
      date: d._id,
      uses: d.uses,
      revenue: d.revenue,
    })),
  };
};

// ─── Export all campaigns as CSV ─────────────────────────────
export const exportCampaignsCSV = async () => {
  const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();

  const headers = [
    'Title', 'Code', 'Type', 'Value', 'Status',
    'Start Date', 'End Date', 'Uses', 'Unique Users',
    'Revenue (£)', 'Target Audience', 'Max Total Uses',
    'Per Customer Limit', 'Min Order Value', 'Created At',
  ];

  const rows = campaigns.map((c) => [
    c.title,
    c.code || '',
    c.type,
    c.value ?? '',
    c.status,
    c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
    c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : 'Ongoing',
    c.uses,
    c.uniqueUsers,
    c.revenue,
    c.targetAudience,
    c.maxTotalUses ?? 'Unlimited',
    c.maxUsesPerUser ?? 1,
    c.minimumOrderValue ?? 0,
    new Date(c.createdAt).toISOString().split('T')[0],
  ]);

  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');

  return csv;
};

// ─── Clearance: suggest candidate listings ────────────────────
export const getClearanceSuggestions = async ({
  maxStock = 3,
  minDaysListed = 90,
  conditions = ['good', 'acceptable'],
  maxPurchases = 2,
  limit = 100,
} = {}) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - minDaysListed);

  const listings = await MarketplaceListing.find({
    isPublished: true,
    isArchived: false,
    stock: { $gt: 0, $lte: maxStock },
    listedAt: { $lte: cutoffDate },
    condition: { $in: conditions },
    purchases: { $lte: maxPurchases },
    'discount.isActive': { $ne: true }, // not already discounted
  })
    .select('title author price stock condition listedAt purchases coverImageUrl slug category')
    .sort({ listedAt: 1 }) // oldest first
    .limit(limit)
    .lean();

  return listings.map((l) => ({
    ...l,
    daysListed: Math.floor((Date.now() - new Date(l.listedAt)) / 86400000),
  }));
};

// ─── Clearance: apply discount to listings ────────────────────
export const applyDiscountToListings = async (listingIds, { discountValue, startDate, endDate }) => {
  if (!listingIds?.length) return;

  await MarketplaceListing.updateMany(
    { _id: { $in: listingIds } },
    {
      $set: {
        'discount.discountType': 'percentage',
        'discount.value': discountValue,
        'discount.validFrom': startDate ? new Date(startDate) : new Date(),
        'discount.validUntil': endDate ? new Date(endDate) : null,
        'discount.isActive': true,
      },
    }
  );
};

// ─── Clearance: remove discount from listings ─────────────────
export const removeDiscountFromListings = async (listingIds) => {
  if (!listingIds?.length) return;

  await MarketplaceListing.updateMany(
    { _id: { $in: listingIds } },
    {
      $set: {
        'discount.isActive': false,
        'discount.value': 0,
      },
    }
  );
};

// ─── Clearance: create campaign + apply discounts ─────────────
export const createClearanceCampaign = async ({
  title,
  code,
  value,
  startDate,
  endDate,
  listingIds,
  autoCriteria,
  conditions,
  createdBy,
}) => {
  let resolvedListingIds = listingIds || [];

  // If no listings supplied, auto-select using criteria
  if (!resolvedListingIds.length && autoCriteria) {
    const suggestions = await getClearanceSuggestions(autoCriteria);
    resolvedListingIds = suggestions.map((s) => s._id);
  }

  if (!resolvedListingIds.length) {
    throw new Error('No clearance listings found matching the criteria');
  }

  const campaign = await Campaign.create({
    title,
    type: 'clearance',
    code: code || undefined,
    value,
    applyTo: 'selected_products',
    startDate,
    endDate: endDate || undefined,
    status: 'active',
    listingIds: resolvedListingIds,
    clearanceCriteria: autoCriteria || null,
    conditions,
    createdBy,
  });

  // Apply discounts immediately on create
  await applyDiscountToListings(resolvedListingIds, { discountValue: value, startDate, endDate });

  return campaign;
};
