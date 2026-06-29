import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    id:       { type: String, required: true },
    img:      { type: String, default: '' },
    title:    { type: String, required: true },
    author:   { type: String, default: '' },
    price:    { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 1, min: 1 },
    stock:    { type: Number, default: 0 },
  },
  { _id: false }
);

const wishlistItemSchema = new mongoose.Schema(
  {
    id:     { type: String, required: true },
    img:    { type: String, default: '' },
    title:  { type: String, required: true },
    author: { type: String, default: '' },
    price:  { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String, required: true },
  },
  { _id: true } // give each address its own id so it can be edited/deleted
);

const accessControlSchema = new mongoose.Schema(
  {
    canView: { type: Boolean, default: true },
    canEdit: { type: Boolean, default: false },
    canAdd: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    accessControl: { type: accessControlSchema, default: () => ({}) },
    onboardingChecklist: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: false }, 

    password: { type: String, required: false }, 

    // 🔵 NEW FIELDS
    googleId: { type: String, default: null },
    facebookId: { type: String, default: null },

    authProvider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },

    avatar: { type: String, default: null },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    adminType: { type: String, enum: ["super_admin","support_admin","compliance_admin","ops_admin","billing_admin"], default: null },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    suspendedAt: { type: Date, default: null },
    suspendedReason: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    settings: { type: settingsSchema, default: () => ({}) }, 
    addresses: [addressSchema],
    cart:      { type: [cartItemSchema],     default: [] },
    wishlist:  { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
