import mongoose from 'mongoose';

const securityEventSchema = new mongoose.Schema({
  eventId: { type: String, index: true },         // UUID v4
  timestamp: { type: Date, default: Date.now, index: true },

  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'WARNING',
    index: true,
  },

  category: {
    type: String,
    enum: [
      'BRUTE_FORCE', 'RATE_LIMIT', 'SQL_INJECTION', 'XSS', 'CSRF',
      'SUSPICIOUS_UA', 'TOR_EXIT', 'GEO_ANOMALY', 'PRIVILEGE_ESCALATION',
      'JWT_ANOMALY', 'FAILED_LOGIN', 'ADMIN_ACCESS', 'API_KEY_MISUSE',
      'CORS_VIOLATION', 'TLS_FAILURE', 'FILE_UPLOAD', 'OTHER',
    ],
    index: true,
  },

  eventType: String,          // Freeform detail
  description: String,

  source: {
    ip: String,
    userAgent: String,
    userIdHash: String,       // Pseudonymised
    country: String,
    city: String,
    isTor: Boolean,
  },

  target: {
    resource: String,         // e.g. '/api/auth/login'
    method: String,
    requestId: String,
  },

  action: {
    type: String,
    enum: ['BLOCKED', 'ALLOWED', 'FLAGGED', 'RATE_LIMITED'],
    default: 'FLAGGED',
  },

  metadata: mongoose.Schema.Types.Mixed,   // Extra context per event type
  environment: { type: String, default: 'production' },
}, { timestamps: false });

securityEventSchema.index({ timestamp: -1, severity: 1 });
securityEventSchema.index({ category: 1, timestamp: -1 });
securityEventSchema.index({ 'source.ip': 1, timestamp: -1 });

export default mongoose.model('SecurityEvent', securityEventSchema);
