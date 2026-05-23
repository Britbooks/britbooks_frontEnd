// src/models/CampaignRedemption.js
import mongoose from "mongoose";

const CampaignRedemptionSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    discountAmount: Number,
  },
  { timestamps: true }
);

export default mongoose.model(
  "CampaignRedemption",
  CampaignRedemptionSchema
);
