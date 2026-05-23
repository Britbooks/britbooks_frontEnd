import mongoose from "mongoose";

const otpUsageSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto delete after expiry
otpUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpUsage = mongoose.model("OtpUsage", otpUsageSchema);