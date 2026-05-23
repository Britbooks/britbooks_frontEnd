import express from "express";
import { MarketplaceListing } from "../app/models/MarketPlace.js";
import { Order } from "../app/models/Order.js";
import User from "../app/models/User.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    /* =====================================================
       1️⃣ LISTINGS & INVENTORY SUMMARY
    ===================================================== */
    const listingStats = await MarketplaceListing.aggregate([
      { $match: { isArchived: false } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          totalStock: { $sum: "$stock" },
          lowStockCount: { $sum: { $cond: [{ $lt: ["$stock", 5] }, 1, 0] } },
          totalInventoryValue: { $sum: { $multiply: ["$price", "$stock"] } },
          averagePrice: { $avg: "$price" },
          totalViews: { $sum: "$views" },
          totalPurchases: { $sum: "$purchases" },
        },
      },
    ]);

    const listings = listingStats[0] || {
      totalListings: 0,
      totalStock: 0,
      lowStockCount: 0,
      totalInventoryValue: 0,
      averagePrice: 0,
      totalViews: 0,
      totalPurchases: 0,
    };

    /* =====================================================
       2️⃣ SALES & REVENUE SUMMARY (FROM REAL ORDERS)
    ===================================================== */
    // ✅ Fetch all paid orders reliably
    const paidOrders = await Order.find({
      "payment.status": "paid"
    }).lean();
    
    
    console.log(await Order.findOne().lean())

  
const totalRevenue = paidOrders.reduce((sum, order) => {
  return sum + (order.total || 0);
}, 0);

const totalOrders = paidOrders.length;

    /* =====================================================
       3️⃣ TOP BESTSELLERS
    ===================================================== */
    const bestsellerMap = {};
    paidOrders.forEach(order => {
      order.items?.forEach(item => {
        if (!item.listing) return;
        const id = item.listing.toString();
        if (!bestsellerMap[id]) {
          bestsellerMap[id] = { totalSold: 0, revenue: 0 };
        }
        bestsellerMap[id].totalSold += item.quantity || 0;
        bestsellerMap[id].revenue += (item.priceAtPurchase || 0) * (item.quantity || 0);
      });
    });

    const listingIds = Object.keys(bestsellerMap);
    const listingDocs = await MarketplaceListing.find({ _id: { $in: listingIds } })
      .select("title author price coverImageUrl")
      .lean();

    const bestsellers = listingDocs
      .map(listing => ({
        listingId: listing._id,
        title: listing.title,
        author: listing.author,
        price: listing.price,
        imageUrl: listing.coverImageUrl,
        totalSold: bestsellerMap[listing._id.toString()]?.totalSold || 0,
        revenue: bestsellerMap[listing._id.toString()]?.revenue || 0,
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    /* =====================================================
       4️⃣ MONTHLY REVENUE (LAST 12 MONTHS)
    ===================================================== */
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const revenueMap = {};

    paidOrders.forEach(order => {
      const date = order.createdAt || order.placedAt;
      if (!date) return;
      const month = months[date.getMonth()];
      revenueMap[month] = (revenueMap[month] || 0) + (order.total || 0);
    });

    const monthlyRevenue = months.map(m => ({ month: m, revenue: Math.round(revenueMap[m] || 0) }));

    /* =====================================================
       5️⃣ USER ANALYTICS
    ===================================================== */
    const [totalUsers, activeUsers, suspendedUsers, admins, customers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    /* =====================================================
       6️⃣ DETAIL DATA FOR MODALS
    ===================================================== */
    const [lowStockListings, recentOrders, recentUsers] = await Promise.all([
      MarketplaceListing.find({ stock: { $lt: 5 }, isArchived: false })
        .select("sku title author price stock coverImageUrl")
        .limit(50)
        .lean(),

        Order.find({ "payment.status": "paid" })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),

      User.find()
        .select("name email role isActive createdAt")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */
    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: Math.round(totalRevenue),
          totalOrders,
          totalListings: listings.totalListings,
          totalStock: listings.totalStock,
          lowStockItems: listings.lowStockCount,
          estimatedInventoryValue: Math.round(listings.totalInventoryValue),
          averageBookPrice: listings.averagePrice?.toFixed(2) || "0.00",
          totalViews: listings.totalViews,
          totalPurchases: totalOrders,
          totalUsers,
          activeUsers,
          suspendedUsers,
          admins,
          customers,
        },
        monthlyRevenue,
        topBestsellers: bestsellers,
        details: {
          lowStockListings,
          recentOrders,
          recentUsers,
        },
      },
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: "Failed to load dashboard data" });
  }
});

export default router;
