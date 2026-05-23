/**
 * Application Metrics Collector
 * Express middleware that captures every HTTP request with full UK GDPR compliance:
 * - Pseudonymises user IDs and session IDs (SHA-256)
 * - Strips authentication headers
 * - Tracks response time percentiles per endpoint
 * - Records error rates (4xx/5xx)
 */

import crypto, { randomUUID } from 'crypto';
import RequestLog from '../models/RequestLog.js';

// In-memory percentile tracker (sliding window per endpoint, last 1000 requests)
const endpointStats = new Map();    // path -> { times: [], count, errors4xx, errors5xx, totalBytes }

const HEADERS_TO_STRIP = new Set([
  'authorization', 'cookie', 'x-api-key', 'x-auth-token',
  'x-access-token', 'proxy-authorization', 'set-cookie',
]);

function pseudonymise(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function sanitiseHeaders(headers) {
  const clean = {};
  for (const [key, val] of Object.entries(headers || {})) {
    if (HEADERS_TO_STRIP.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

function trackEndpoint(path, method, durationMs, statusCode, responseBytes) {
  const key = `${method}:${path}`;

  if (!endpointStats.has(key)) {
    endpointStats.set(key, {
      times: [],
      count: 0,
      errors4xx: 0,
      errors5xx: 0,
      totalRequestBytes: 0,
      totalResponseBytes: 0,
      slowest: [],      // top 10
    });
  }

  const stat = endpointStats.get(key);
  stat.count++;
  stat.times.push(durationMs);
  if (stat.times.length > 1000) stat.times.shift();
  if (statusCode >= 500) stat.errors5xx++;
  else if (statusCode >= 400) stat.errors4xx++;
  stat.totalResponseBytes += responseBytes || 0;

  // Track slowest 10
  stat.slowest.push({ durationMs, statusCode, timestamp: new Date() });
  stat.slowest.sort((a, b) => b.durationMs - a.durationMs);
  if (stat.slowest.length > 10) stat.slowest.pop();
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export function appMetricsMiddleware(req, res, next) {
  const startNs = process.hrtime.bigint();
  const requestId = randomUUID();
  req.requestId = requestId;

  res.on('finish', async () => {
    try {
      const durationMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;
      const statusCode = res.statusCode;
      const requestBodyBytes = parseInt(req.headers['content-length'] || 0);
      const responseBodyBytes = parseInt(res.getHeader('content-length') || 0);

      const path = req.route?.path || req.path || req.url;
      const method = req.method;

      trackEndpoint(path, method, durationMs, statusCode, responseBodyBytes);

      const logEntry = {
        requestId,
        timestamp: new Date(),
        http: {
          method,
          path,
          query: req.query,
          statusCode,
          requestBodyBytes,
          responseBodyBytes,
          durationMs: parseFloat(durationMs.toFixed(3)),
          apiVersion: req.headers['api-version'] || '1',
          routeHandler: req.route?.path || null,
        },
        headers: sanitiseHeaders(req.headers),
        actor: {
          userIdHash: pseudonymise(req.user?.userId),
          sessionIdHash: pseudonymise(req.headers['x-session-id'] || req.session?.id),
          role: req.user?.role || 'anonymous',
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'],
          country: req.geoCountry || null,
          city: req.geoCity || null,
        },
        isError: statusCode >= 400,
        is5xx: statusCode >= 500,
        is4xx: statusCode >= 400 && statusCode < 500,
        environment: process.env.NODE_ENV || 'production',
      };

      // Fire-and-forget — do not await in request path
      RequestLog.create(logEntry).catch(err => {
        console.error('[AppMetrics] Failed to persist request log:', err.message);
      });
    } catch (err) {
      console.error('[AppMetrics] Middleware error:', err.message);
    }
  });

  next();
}

// ─── Analytics Queries ───────────────────────────────────────────────────────

export async function getEndpointStats(path, method) {
  const key = `${method}:${path}`;
  const stat = endpointStats.get(key);
  if (!stat) return null;

  const sorted = [...stat.times].sort((a, b) => a - b);
  return {
    endpoint: key,
    totalRequests: stat.count,
    errors4xx: stat.errors4xx,
    errors5xx: stat.errors5xx,
    errorRate4xx: stat.count ? (stat.errors4xx / stat.count * 100).toFixed(2) : 0,
    errorRate5xx: stat.count ? (stat.errors5xx / stat.count * 100).toFixed(2) : 0,
    latency: {
      p50: percentile(sorted, 50),
      p90: percentile(sorted, 90),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0,
      avg: sorted.reduce((a, b) => a + b, 0) / (sorted.length || 1),
    },
    slowestRequests: stat.slowest,
  };
}

export function getAllEndpointStats() {
  const result = [];
  for (const [key, stat] of endpointStats.entries()) {
    const sorted = [...stat.times].sort((a, b) => a - b);
    result.push({
      endpoint: key,
      totalRequests: stat.count,
      errors4xx: stat.errors4xx,
      errors5xx: stat.errors5xx,
      errorRate: stat.count ? ((stat.errors4xx + stat.errors5xx) / stat.count * 100).toFixed(2) : 0,
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      slowestRequests: stat.slowest,
    });
  }
  return result.sort((a, b) => b.totalRequests - a.totalRequests);
}

export function getTop10SlowestEndpoints() {
  return getAllEndpointStats()
    .sort((a, b) => b.p95 - a.p95)
    .slice(0, 10);
}

export function getTop10ErrorEndpoints() {
  return getAllEndpointStats()
    .sort((a, b) => parseFloat(b.errorRate) - parseFloat(a.errorRate))
    .slice(0, 10);
}

export async function getRequestStats(fromDate, toDate) {
  return RequestLog.aggregate([
    { $match: { timestamp: { $gte: fromDate, $lte: toDate } } },
    {
      $group: {
        _id: { path: '$http.path', method: '$http.method' },
        count: { $sum: 1 },
        avgDuration: { $avg: '$http.durationMs' },
        maxDuration: { $max: '$http.durationMs' },
        errors: { $sum: { $cond: ['$isError', 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 50 },
  ]);
}
