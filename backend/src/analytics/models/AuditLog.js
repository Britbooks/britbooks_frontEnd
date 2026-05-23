import mongoose from 'mongoose';

// Immutable, tamper-evident audit log (append-only)
// Each entry hashes the previous entry's hash — chain integrity
const auditLogSchema = new mongoose.Schema({
  logId: { type: String, unique: true, index: true },   // UUID v4
  timestamp: { type: Date, default: Date.now, index: true },

  actor: {
    userId: String,           // Real user ID (encrypted at rest via app-level AES)
    userIdHash: String,       // SHA-256 pseudonym for reporting
    role: String,
    ip: String,
    sessionId: String,
  },

  action: {
    type: String,
    enum: [
      'CREATE', 'READ', 'UPDATE', 'DELETE',
      'LOGIN', 'LOGOUT', 'REGISTER',
      'EXPORT', 'IMPORT', 'PAYMENT',
      'ADMIN_ACTION', 'CONFIG_CHANGE',
      'DATA_ACCESS', 'DATA_TRANSFER',
      'CONSENT_GIVEN', 'CONSENT_WITHDRAWN',
      'RTBF_REQUEST', 'SAR_REQUEST',
      'SECURITY_EVENT', 'OTHER',
    ],
  },

  resource: {
    type: String,             // e.g. 'User', 'Order', 'Payment'
    id: String,               // Resource ID
  },

  before: mongoose.Schema.Types.Mixed,   // State before mutation (encrypted)
  after: mongoose.Schema.Types.Mixed,    // State after mutation (encrypted)

  outcome: { type: String, enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS' },

  reason: String,             // Justification for sensitive actions
  legalBasis: String,         // GDPR legal basis for data access
  requestId: String,          // Linked HTTP request

  // Chain integrity
  previousHash: String,       // Hash of previous log entry
  hash: String,               // SHA-256(logId + timestamp + actor + action + previousHash)

  // System context
  gitSha: { type: String, default: () => process.env.GIT_COMMIT_SHA || 'unknown' },
  environment: { type: String, default: () => process.env.NODE_ENV || 'production' },
}, {
  timestamps: false,
  // Prevent updates — enforced at application layer too
});

// Make it as close to immutable as possible at schema level
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditLog records are immutable');
});
auditLogSchema.pre('updateOne', function () {
  throw new Error('AuditLog records are immutable');
});
auditLogSchema.pre('updateMany', function () {
  throw new Error('AuditLog records are immutable');
});

auditLogSchema.index({ timestamp: -1, 'actor.userId': 1 });
auditLogSchema.index({ 'resource.type': 1, 'resource.id': 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
