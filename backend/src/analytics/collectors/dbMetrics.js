/**
 * Database Metrics Collector
 * Instruments Mongoose to capture:
 * - Every query executed (text, duration, collection, rows affected)
 * - Slow queries (>200ms) with full context
 * - Connection pool stats
 * - Error rates per collection
 */

import mongoose from 'mongoose';

const SLOW_QUERY_THRESHOLD_MS = 200;

// In-memory aggregations
const collectionStats = new Map();   // collection -> { count, errors, totalMs, slowQueries }
let connectionPoolStats = {
  poolSize: 0,
  active: 0,
  idle: 0,
  pending: 0,
  checkedOut: 0,
};

// Slow query ring buffer (last 500)
const slowQueryLog = [];
const MAX_SLOW_QUERIES = 500;

function recordSlowQuery(entry) {
  slowQueryLog.unshift(entry);
  if (slowQueryLog.length > MAX_SLOW_QUERIES) slowQueryLog.pop();
}

function trackCollection(collectionName, durationMs, isError) {
  if (!collectionStats.has(collectionName)) {
    collectionStats.set(collectionName, { count: 0, errors: 0, totalMs: 0, slowCount: 0 });
  }
  const s = collectionStats.get(collectionName);
  s.count++;
  s.totalMs += durationMs;
  if (isError) s.errors++;
  if (durationMs >= SLOW_QUERY_THRESHOLD_MS) s.slowCount++;
}

// ─── Mongoose Plugin ──────────────────────────────────────────────────────────

function mongooseAnalyticsPlugin(schema, _options) {
  const ops = ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete',
    'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'count', 'countDocuments'];

  for (const op of ops) {
    schema.pre(op, function () {
      this._analyticsStart = Date.now();
      this._analyticsOp = op;
    });

    schema.post(op, function (result, next) {
      const durationMs = Date.now() - (this._analyticsStart || Date.now());
      const collectionName = this.model?.modelName || 'unknown';

      trackCollection(collectionName, durationMs, false);

      if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
        const entry = {
          timestamp: new Date(),
          collection: collectionName,
          operation: op,
          durationMs,
          filter: JSON.stringify(this.getFilter?.() || {}),
          update: JSON.stringify(this.getUpdate?.() || {}),
          options: JSON.stringify(this.getOptions?.() || {}),
          requestId: this._analyticsRequestId || null,
        };
        recordSlowQuery(entry);
        console.warn(`[DBMetrics] Slow query on ${collectionName}.${op}: ${durationMs}ms`);
      }

      if (typeof next === 'function') next();
    });

    schema.post(op, function (err, result, next) {
      if (err) {
        const collectionName = this.model?.modelName || 'unknown';
        trackCollection(collectionName, Date.now() - (this._analyticsStart || Date.now()), true);
        console.error(`[DBMetrics] Query error on ${collectionName}.${op}:`, err.message);
      }
      if (typeof next === 'function') next(err);
    });
  }

  // Save hooks
  schema.pre('save', function () {
    this._analyticsStart = Date.now();
  });
  schema.post('save', function () {
    const durationMs = Date.now() - (this._analyticsStart || Date.now());
    const collectionName = this.constructor?.modelName || 'unknown';
    trackCollection(collectionName, durationMs, false);
    if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
      recordSlowQuery({
        timestamp: new Date(),
        collection: collectionName,
        operation: 'save',
        durationMs,
        filter: 'N/A',
        update: 'N/A',
        options: '{}',
        requestId: null,
      });
    }
  });
}

// ─── Connection Pool Monitoring ───────────────────────────────────────────────

function watchConnectionPool() {
  const conn = mongoose.connection;

  conn.on('commandStarted', () => {
    connectionPoolStats.active++;
  });
  conn.on('commandSucceeded', () => {
    connectionPoolStats.active = Math.max(0, connectionPoolStats.active - 1);
    connectionPoolStats.idle++;
  });
  conn.on('commandFailed', () => {
    connectionPoolStats.active = Math.max(0, connectionPoolStats.active - 1);
  });

  // Periodically sync from Mongoose internal pool if available
  setInterval(() => {
    try {
      const pool = conn.client?.topology?.s?.pool;
      if (pool) {
        connectionPoolStats = {
          poolSize: pool.options?.maxPoolSize || 20,
          active: pool.currentCheckCount || 0,
          idle: (pool.options?.maxPoolSize || 20) - (pool.currentCheckCount || 0),
          pending: pool.waitQueue?.length || 0,
          checkedOut: pool.currentCheckCount || 0,
        };
      }
    } catch { /* internal API may differ by driver version */ }
  }, 5000);
}

// ─── Initialise ───────────────────────────────────────────────────────────────

export function initDbMetrics() {
  // Register plugin on all future schemas
  mongoose.plugin(mongooseAnalyticsPlugin);

  // Watch connection events
  mongoose.connection.once('connected', watchConnectionPool);

  console.log('[DBMetrics] Mongoose analytics plugin registered');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getSlowQueries(limit = 50) {
  return slowQueryLog.slice(0, limit);
}

export function getConnectionPoolStats() {
  return { ...connectionPoolStats };
}

export function getCollectionStats() {
  const result = [];
  for (const [name, stat] of collectionStats.entries()) {
    result.push({
      collection: name,
      totalQueries: stat.count,
      errors: stat.errors,
      errorRate: stat.count ? `${(stat.errors / stat.count * 100).toFixed(2)  }%` : '0%',
      avgDurationMs: stat.count ? (stat.totalMs / stat.count).toFixed(2) : 0,
      slowQueries: stat.slowCount,
    });
  }
  return result.sort((a, b) => b.totalQueries - a.totalQueries);
}

export function getDatabaseHealth() {
  const readyState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return {
    status: states[readyState] || 'unknown',
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    pool: getConnectionPoolStats(),
    slowQueriesInBuffer: slowQueryLog.length,
    slowQueryThresholdMs: SLOW_QUERY_THRESHOLD_MS,
  };
}
