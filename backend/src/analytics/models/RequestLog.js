import mongoose from 'mongoose';

const requestLogSchema = new mongoose.Schema({
  requestId: { type: String, index: true },         // UUID v4
  timestamp: { type: Date, default: Date.now, index: true },

  http: {
    method: String,
    path: String,
    query: mongoose.Schema.Types.Mixed,
    statusCode: Number,
    requestBodyBytes: Number,
    responseBodyBytes: Number,
    durationMs: Number,
    apiVersion: String,
    routeHandler: String,
  },

  // Sanitised headers — auth stripped
  headers: mongoose.Schema.Types.Mixed,

  // Actor (pseudonymised)
  actor: {
    userIdHash: String,       // SHA-256 of userId
    sessionIdHash: String,    // SHA-256 of session
    role: String,
    ip: String,
    userAgent: String,
    country: String,
    city: String,
  },

  // Aggregation helpers
  isError: Boolean,           // statusCode >= 400
  is5xx: Boolean,
  is4xx: Boolean,

  environment: { type: String, default: 'production' },
}, { timestamps: false });

requestLogSchema.index({ timestamp: -1, 'http.path': 1 });
requestLogSchema.index({ 'actor.userIdHash': 1, timestamp: -1 });
requestLogSchema.index({ 'http.statusCode': 1, timestamp: -1 });

export default mongoose.model('RequestLog', requestLogSchema);
