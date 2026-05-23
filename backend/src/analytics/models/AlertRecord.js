import mongoose from 'mongoose';

const alertRecordSchema = new mongoose.Schema({
  alertId: { type: String, index: true },         // UUID v4
  timestamp: { type: Date, default: Date.now, index: true },

  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'WARNING',
    index: true,
  },

  type: {
    type: String,
    enum: [
      'CPU_HIGH', 'MEMORY_HIGH', 'DISK_HIGH',
      'EVENT_LOOP_LAG', 'ERROR_RATE_HIGH',
      'SECURITY_CRITICAL', 'DB_POOL_EXHAUSTED',
      'HEAP_HIGH', 'OUTBOUND_API_FAILURE',
      'MONITOR_DOWN', 'CUSTOM',
    ],
    index: true,
  },

  title: String,
  message: String,

  metric: {
    name: String,
    currentValue: Number,
    threshold: Number,
    unit: String,
  },

  affectedSystem: String,
  remediation: String,
  dashboardLink: String,

  channels: [String],         // email, sms, slack, pagerduty

  status: {
    type: String,
    enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'],
    default: 'OPEN',
    index: true,
  },

  acknowledgedBy: String,
  resolvedAt: Date,
  environment: { type: String, default: 'production' },
}, { timestamps: true });

alertRecordSchema.index({ timestamp: -1, status: 1 });

export default mongoose.model('AlertRecord', alertRecordSchema);
