import Campaign from '../models/Campaign.js';
import {
  validateCampaignCode,
  redeemCampaign,
  generateUniqueCode,
  getCampaignAnalyticsData,
  exportCampaignsCSV,
  getClearanceSuggestions,
  createClearanceCampaign,
  removeDiscountFromListings,
  claimGameReward,
} from '../services/campaignService.js';
import { sendNewArrivalsEmail } from '../services/nexcessService.js';
import { sendAIMarketingEmail } from '../services/marketingService.js';
import { MarketplaceListing } from '../models/MarketPlace.js';
import User from '../models/User.js';

// ─── Helper: build human-readable discount string ────────────
function formatDiscount(type, value) {
  if (type === 'percentage') return `${value}%`;
  if (type === 'fixed') return `£${value} off`;
  if (type === 'free_shipping') return 'Free Shipping';
  if (type === 'bundle') return 'Bundle Deal';
  if (type === 'buy_x_get_y') return 'Buy X Get Y Free';
  if (type === 'gift_with_purchase') return 'Gift with Purchase';
  return value ? String(value) : '—';
}

// ─── Helper: parse discount display string → numeric value ───
function parseDiscountValue(discountStr) {
  if (!discountStr) return undefined;
  const match = String(discountStr).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : undefined;
}

// ─── Helper: attach computed discount field to a campaign ─────
function withDiscount(campaign) {
  const obj = campaign.toObject ? campaign.toObject() : { ...campaign };
  obj.discount = formatDiscount(obj.type, obj.value);
  obj.revenue = obj.revenue ? `£${Number(obj.revenue).toLocaleString()}` : '£0';
  return obj;
}

// GET /api/campaigns
export const getCampaigns = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { targetAudience: { $regex: search, $options: 'i' } },
      ];
    }
    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: campaigns.map(withDiscount) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/campaigns/:id
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, data: withDiscount(campaign) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/campaigns
export const createCampaign = async (req, res) => {
  try {
    const {
      title,
      type,
      code,
      discountValue,   // frontend name → model: value
      applyTo,
      startDate,
      endDate,
      maxUses,         // frontend name → model: maxTotalUses
      perCustomerLimit,// frontend name → model: maxUsesPerUser
      targetAudience,
      minOrderValue,   // frontend name → model: minimumOrderValue
      notes,           // frontend name → model: conditions
      events,
      currency,
    } = req.body;

    const campaign = await Campaign.create({
      title,
      type,
      code: code || undefined,
      value: discountValue ? Number(discountValue) : undefined,
      applyTo,
      startDate,
      endDate: endDate || undefined,
      maxTotalUses: maxUses ? Number(maxUses) : undefined,
      maxUsesPerUser: perCustomerLimit ? Number(perCustomerLimit) : 1,
      targetAudience: targetAudience || 'all',
      minimumOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      conditions: notes || undefined,
      events: events || [],
      currency: currency || 'GBP',
      createdBy: req.user.userId,
    });

    res.status(201).json({ success: true, data: withDiscount(campaign) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Campaign code already exists' });
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

// PUT /api/campaigns/:id
export const updateCampaign = async (req, res) => {
  try {
    const {
      title,
      code,
      status,
      discount,        // frontend sends display string e.g. "10%" → parse to value
      discountValue,   // or explicit numeric value
      startDate,
      endDate,
      notes,
      maxUses,
      perCustomerLimit,
      minOrderValue,
      targetAudience,
      events,
    } = req.body;

    const update = {};
    if (title !== undefined) update.title = title;
    if (code !== undefined) update.code = code;
    if (status !== undefined) update.status = status;
    if (startDate !== undefined) update.startDate = startDate;
    if (endDate !== undefined) update.endDate = endDate || null;
    if (notes !== undefined) update.conditions = notes;
    if (targetAudience !== undefined) update.targetAudience = targetAudience;
    if (events !== undefined) update.events = events;
    if (maxUses !== undefined) update.maxTotalUses = Number(maxUses);
    if (perCustomerLimit !== undefined) update.maxUsesPerUser = Number(perCustomerLimit);
    if (minOrderValue !== undefined) update.minimumOrderValue = Number(minOrderValue);

    // Parse discount — accept either a display string ("10%", "£25 off") or numeric
    if (discountValue !== undefined) {
      update.value = Number(discountValue);
    } else if (discount !== undefined) {
      const parsed = parseDiscountValue(discount);
      if (parsed !== undefined) update.value = parsed;
    }

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, data: withDiscount(campaign) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// DELETE /api/campaigns/:id
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/campaigns/:id/duplicate
export const duplicateCampaign = async (req, res) => {
  try {
    const original = await Campaign.findById(req.params.id).lean();
    if (!original) return res.status(404).json({ success: false, error: 'Campaign not found' });

    const { _id, code, createdAt: _createdAt, updatedAt: _updatedAt, uses: _uses, uniqueUsers: _uniqueUsers, revenue: _revenue, ...rest } = original;
    const newCode = code ? await generateUniqueCode(code.slice(0, 4)) : undefined;

    const duplicate = await Campaign.create({
      ...rest,
      title: `${rest.title} (Copy)`,
      code: newCode,
      status: 'draft',
      uses: 0,
      uniqueUsers: 0,
      revenue: 0,
      createdBy: req.user.userId,
    });

    res.status(201).json({ success: true, data: withDiscount(duplicate) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/campaigns/:id/analytics
export const getCampaignAnalytics = async (req, res) => {
  try {
    const data = await getCampaignAnalyticsData(req.params.id);

    // Shape analytics to match what the frontend expects via data?.analytics
    res.json({
      success: true,
      analytics: {
        totalRevenue: `£${Number(data.metrics.revenue).toLocaleString()}`,
        uses: data.metrics.uses,
        uniqueUsers: data.metrics.uniqueUsers,
        conversionRate: data.metrics.conversionRate,
      },
      dailyBreakdown: data.dailyBreakdown,
      campaign: withDiscount(data.campaign),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/campaigns/export
export const exportCampaigns = async (req, res) => {
  try {
    const csv = await exportCampaignsCSV();
    const filename = `campaigns-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/campaigns/generate-code
export const generateCode = async (req, res) => {
  try {
    const { prefix } = req.body;
    const code = await generateUniqueCode(prefix);
    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/campaigns/clearance/suggestions
export const clearanceSuggestions = async (req, res) => {
  try {
    const {
      maxStock = 3,
      minDaysListed = 90,
      conditions = 'good,acceptable',
      maxPurchases = 2,
      limit = 100,
    } = req.query;

    const listings = await getClearanceSuggestions({
      maxStock: Number(maxStock),
      minDaysListed: Number(minDaysListed),
      conditions: conditions.split(',').map((c) => c.trim()),
      maxPurchases: Number(maxPurchases),
      limit: Number(limit),
    });

    res.json({ success: true, total: listings.length, data: listings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/campaigns/clearance
export const createClearance = async (req, res) => {
  try {
    const {
      title,
      code,
      discountValue,
      startDate,
      endDate,
      listingIds,
      autoCriteria,
      conditions,
    } = req.body;

    if (!discountValue || !startDate) {
      return res.status(400).json({ success: false, error: 'discountValue and startDate are required' });
    }

    const campaign = await createClearanceCampaign({
      title: title || `Clearance Sale – ${new Date().toLocaleDateString('en-GB')}`,
      code,
      value: Number(discountValue),
      startDate,
      endDate,
      listingIds,
      autoCriteria,
      conditions,
      createdBy: req.user.userId,
    });

    res.status(201).json({ success: true, data: withDiscount(campaign) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// GET /api/campaigns/:id/listings
export const getCampaignListings = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    if (!campaign.listingIds?.length) {
      return res.json({ success: true, total: 0, data: [] });
    }

    const listings = await MarketplaceListing.find({ _id: { $in: campaign.listingIds } })
      .select('title author price stock condition coverImageUrl slug discount discountedPrice')
      .lean();

    res.json({ success: true, total: listings.length, data: listings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/campaigns/:id/clearance  — end clearance, remove discounts
export const endClearanceCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    if (campaign.type !== 'clearance') {
      return res.status(400).json({ success: false, error: 'Campaign is not a clearance campaign' });
    }

    await removeDiscountFromListings(campaign.listingIds);
    campaign.status = 'expired';
    await campaign.save();

    res.json({ success: true, message: 'Clearance campaign ended and discounts removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/campaigns/validate
export const validateCode = async (req, res) => {
  try {
    const result = await validateCampaignCode(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const claimReward = async (req, res) => {
  try {
    const result = await claimGameReward(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/campaigns/redeem
export const redeem = async (req, res) => {
  try {
    await redeemCampaign(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// POST /api/campaigns/send-ai-marketing  — AI-generated ad email blast
export const triggerAIMarketingEmail = async (req, res) => {
  try {
    const { campaignId, bookIds, audience = 'all', preview = false } = req.body;

    const result = await sendAIMarketingEmail({ campaignId, bookIds, audience, preview });

    res.json({
      success: true,
      message: preview
        ? 'AI marketing preview sent to admin inbox'
        : `AI marketing email sent to ${result.sent} users`,
      subject: result.subject,
      sent: result.sent,
      skipped: result.skipped,
      ...(preview && { html: result.html }),
    });
  } catch (err) {
    console.error('AI marketing email failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/campaigns/send-new-arrivals  — admin manual trigger
export const triggerNewArrivalsEmail = async (req, res) => {
  try {
    const { limit = 8, audience = 'all' } = req.body;

    // Fetch latest new arrival books
    const books = await MarketplaceListing.find({
      isPublished: true,
      isArchived: { $ne: true },
      stock: { $gt: 0 },
    })
      .sort({ listedAt: -1, _id: -1 })
      .limit(Number(limit))
      .select('title author price condition coverImageUrl slug listedAt')
      .lean();

    if (!books.length) {
      return res.status(404).json({ success: false, error: 'No published listings found' });
    }

    // Fetch recipients
    const userQuery = { role: 'user', status: { $ne: 'suspended' } };
    if (audience === 'test' && req.user?.email) {
      // Send only to the triggering admin for preview
      const adminUser = await User.findById(req.user.userId).select('fullName email').lean();
      const result = await sendNewArrivalsEmail(adminUser ? [adminUser] : [], books);
      return res.json({ success: true, message: 'Test email sent to admin', ...result });
    }

    const users = await User.find(userQuery).select('fullName email').lean();

    const result = await sendNewArrivalsEmail(users, books);
    res.json({
      success: true,
      message: `New arrivals email dispatched`,
      books: books.length,
      ...result,
    });
  } catch (err) {
    console.error('New arrivals email trigger failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
