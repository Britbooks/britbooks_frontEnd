import mongoose from 'mongoose';

const errorLogSchema = new mongoose.Schema({
  errorId: { type: String, index: true },       // UUID v4

  type: {
    type: String,
    enum: [
      'UNHANDLED_REJECTION', 'UNCAUGHT_EXCEPTION',
      'SYNTAX', 'RUNTIME', 'DATABASE',
      'NETWORK', 'VALIDATION', 'AUTH', 'OTHER',
    ],
    index: true,
  },

  message: String,
  stackTrace: String,
  name: String,             // Error constructor name

  frequency: {
    lastHour: { type: Number, default: 1 },
    lastDay: { type: Number, default: 1 },
    total: { type: Number, default: 1 },
  },

  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now, index: true },

  status: {
    type: String,
    enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'],
    default: 'OPEN',
    index: true,
  },

  context: {
    requestId: String,
    route: String,
    method: String,
    userIdHash: String,
    userRole: String,
    nodeVersion: String,
    os: String,
    environment: String,
    gitSha: String,
    isUserFacing: Boolean,
  },

  deploymentVersion: { type: String, default: () => process.env.GIT_COMMIT_SHA || 'unknown' },
  environment: { type: String, default: () => process.env.NODE_ENV || 'production' },
}, { timestamps: false });

// Fingerprint index for deduplication (message + stack first 200 chars)
errorLogSchema.index({ name: 1, 'context.route': 1, status: 1 });
errorLogSchema.index({ lastSeen: -1 });

export default mongoose.model('ErrorLog', errorLogSchema);
