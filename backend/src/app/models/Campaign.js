// src/models/Campaign.js
import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    code: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "percentage",
        "fixed",
        "free_shipping",
        "bundle",
        "buy_x_get_y",
        "gift_with_purchase",
        "clearance",
      ],
      required: true,
    },

    // Listings pinned to this campaign (used by clearance + selected_products)
    listingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceListing" }],

    // Clearance auto-selection criteria (stored for audit/re-run)
    clearanceCriteria: {
      maxStock: Number,
      minDaysListed: Number,
      conditions: [String],
      maxPurchases: Number,
    },

    value: Number, // % or fixed amount
    currency: { type: String, default: "GBP" },

    status: {
      type: String,
      enum: ["draft", "active", "expired"],
      default: "draft",
      index: true,
    },

    startDate: { type: Date, required: true },
    endDate: Date,

    maxTotalUses: Number,
    maxUsesPerUser: { type: Number, default: 1 },

    minimumOrderValue: { type: Number, default: 0 },

    applyTo: {
      type: String,
      enum: ["all_products", "category", "selected_products", "cart_total"],
      default: "all_products",
    },

    targetAudience: {
      type: String,
      enum: ["all", "new", "repeat", "vip", "custom"],
      default: "all",
    },

    conditions: String,
    events: [String],

    // Analytics counters
    uses: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Campaign", CampaignSchema);
