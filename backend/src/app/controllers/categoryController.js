import { Category } from '../models/Category.js';
import redis from '../../lib/config/redisClient.js';

export const getCategories = async (req, res) => {
  try {
    const cached = await redis.get("categories_cache");

    if (!cached) {
      return res.status(404).json({
        success: false,
        message: "Categories cache is empty. Try again later."
      });
    }

    const categories = JSON.parse(cached);

    return res.json({
      success: true,
      categories,
      cached: true
    });
  } catch (err) {
    console.error("❌ getCategories error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load categories",
      error: err.message
    });
  }
};











  export const getSubcategories = async (req, res) => {
    try {
      const { slug } = req.params;
  
      const parent = await Category.findOne({ slug, parent: null });
      if (!parent) return res.json({ success: true, subcategories: [] });
  
      const subcategories = await Category.find({ parent: parent._id })
        .sort({ name: 1 })
        .select('name slug count')
        .lean();
  
      return res.json({ success: true, subcategories });
    } catch (err) {
      console.error('❌ getSubcategories error:', err);
      return res.status(500).json({ success: false, message: 'Failed to load subcategories' });
    }
  };
  