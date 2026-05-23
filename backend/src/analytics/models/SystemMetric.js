import mongoose from 'mongoose';

const systemMetricSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  environment: { type: String, default: 'production' },

  cpu: {
    usagePercent: Number,          // overall average
    perCore: [Number],             // per-core %
    model: String,
    cores: Number,
    speed: Number,                 // MHz
  },

  memory: {
    totalBytes: Number,
    usedBytes: Number,
    freeBytes: Number,
    usagePercent: Number,
    swapTotal: Number,
    swapUsed: Number,
    swapFree: Number,
  },

  disk: [{
    mount: String,
    device: String,
    fsType: String,
    totalBytes: Number,
    usedBytes: Number,
    freeBytes: Number,
    usagePercent: Number,
    readBytesPerSec: Number,
    writeBytesPerSec: Number,
    iopsRead: Number,
    iopsWrite: Number,
  }],

  network: [{
    interface: String,
    rxBytesPerSec: Number,
    txBytesPerSec: Number,
    rxPacketsPerSec: Number,
    txPacketsPerSec: Number,
    rxErrors: Number,
    txErrors: Number,
  }],

  loadAvg: {
    oneMin: Number,
    fiveMin: Number,
    fifteenMin: Number,
  },

  processes: {
    total: Number,
    running: Number,
    sleeping: Number,
    zombie: Number,
  },

  fileDescriptors: {
    open: Number,
    limit: Number,
  },

  uptime: Number,           // seconds

  temperature: [{
    sensor: String,
    celsius: Number,
  }],

  // Retention tier — raw|hourly|daily
  tier: { type: String, enum: ['raw', 'hourly', 'daily'], default: 'raw', index: true },
  aggregatedAt: Date,
}, { timestamps: false });

// TTL index is managed by retentionManager; we just add compound index for queries
systemMetricSchema.index({ timestamp: -1, tier: 1 });

export default mongoose.model('SystemMetric', systemMetricSchema);
