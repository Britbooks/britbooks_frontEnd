import mongoose from 'mongoose';

const performanceSnapshotSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },

  eventLoop: {
    lagMs: Number,            // Measured event loop lag
    utilisation: Number,      // 0-1
  },

  heap: {
    usedBytes: Number,
    totalBytes: Number,
    limitBytes: Number,
    externalBytes: Number,
    arrayBufferBytes: Number,
    usagePercent: Number,
  },

  gc: {
    majorCount: Number,
    minorCount: Number,
    incrementalCount: Number,
    totalDurationMs: Number,
    lastType: String,         // 'major' | 'minor' | 'incremental'
    lastDurationMs: Number,
  },

  handles: {
    active: Number,
    requests: Number,
  },

  cpuUsage: {
    userMs: Number,
    systemMs: Number,
  },

  // Memory leak indicator: trend over last hour (bytes/minute)
  heapGrowthRatePerMin: Number,

  environment: { type: String, default: 'production' },
  tier: { type: String, enum: ['raw', 'hourly', 'daily'], default: 'raw' },
}, { timestamps: false });

performanceSnapshotSchema.index({ timestamp: -1, tier: 1 });

export default mongoose.model('PerformanceSnapshot', performanceSnapshotSchema);
