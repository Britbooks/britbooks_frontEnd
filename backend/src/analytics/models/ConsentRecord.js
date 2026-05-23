import mongoose from 'mongoose';

// UK GDPR - consent management and ROPA
const consentRecordSchema = new mongoose.Schema({
  consentId: { type: String, index: true },

  // Pseudonymised user reference
  userIdHash: { type: String, index: true },   // SHA-256(userId)

  consentVersion: String,       // e.g. '2024-01-v1'
  consentText: String,          // Snapshot of consent wording
  legalBasis: {
    type: String,
    enum: [
      'CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION',
      'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS',
    ],
  },

  purpose: String,              // e.g. 'Analytics', 'Marketing', 'Service Delivery'
  processingActivity: String,   // Linked ROPA activity

  granted: Boolean,
  grantedAt: Date,
  withdrawnAt: Date,
  withdrawnReason: String,

  ip: String,
  userAgent: String,
  channel: String,              // 'web', 'mobile', 'api'

  // SAR / RTBF tracking
  sarRequests: [{
    requestId: String,
    requestedAt: Date,
    fulfilledAt: Date,
    status: { type: String, enum: ['PENDING', 'FULFILLED', 'REJECTED'] },
  }],

  rtbfRequests: [{
    requestId: String,
    requestedAt: Date,
    scheduledErasureAt: Date,
    erasedAt: Date,
    status: { type: String, enum: ['PENDING', 'ERASED', 'REJECTED'] },
  }],

  dataCategories: [String],     // e.g. ['behavioural', 'device', 'usage']
  thirdPartySharing: Boolean,
  crossBorderTransfer: Boolean,
  transferDestination: String,  // e.g. 'US (AWS)', 'EU'

  environment: { type: String, default: 'production' },
}, { timestamps: true });

consentRecordSchema.index({ userIdHash: 1, purpose: 1 });
consentRecordSchema.index({ 'rtbfRequests.status': 1 });
consentRecordSchema.index({ 'sarRequests.status': 1 });

export default mongoose.model('ConsentRecord', consentRecordSchema);
