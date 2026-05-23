import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const reviewSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    listing: { type: Types.ObjectId, ref: 'MarketplaceListing', required: true },
    order: { type: Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    body: { type: String, trim: true, maxlength: 2000 },
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    moderationResult: { type: String, enum: ['approved', 'rejected', 'pending'], default: 'pending' },
    moderationReason: { type: String },
  },
  { timestamps: true }
);

// One review per user per listing
reviewSchema.index({ user: 1, listing: 1 }, { unique: true });

export const Review = model('Review', reviewSchema);
