import mongoose from 'mongoose';
import CampaignRedemption from '../models/CampaignRedemption.js';

export const getCampaignAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await CampaignRedemption.aggregate([
      { $match: { campaign: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          uses: { $sum: 1 },
          revenue: { $sum: '$discountAmount' },
          uniqueUsers: { $addToSet: '$user' },
        },
      },
    ]);

    const data = stats[0] || { uses: 0, revenue: 0, uniqueUsers: [] };

    res.json({
      success: true,
      uses: data.uses,
      revenue: data.revenue,
      uniqueUsers: data.uniqueUsers.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
