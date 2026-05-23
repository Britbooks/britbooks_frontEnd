/**
 * Performance Metrics Collector
 * Tracks Node.js runtime internals:
 * - Event loop lag (perf_hooks)
 * - V8 heap statistics
 * - Garbage collection (PerformanceObserver)
 * - Active handles & requests
 * - Memory leak trend detection (heap growth rate over 1h)
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import v8 from 'v8';
import PerformanceSnapshot from '../models/PerformanceSnapshot.js';
import { alertEngine } from '../alerting/alertEngine.js';

const SAMPLE_INTERVAL_MS = 10_000;
const EVENT_LOOP_LAG_ALERT_MS = 100;
const HEAP_USAGE_ALERT_PERCENT = 85;

let intervalHandle = null;
const gcStats = { majorCount: 0, minorCount: 0, incrementalCount: 0, totalDurationMs: 0, lastType: null, lastDurationMs: 0 };
let prevCpuUsage = process.cpuUsage();

// Rolling heap snapshot for leak detection (last 360 samples = 1h at 10s)
const heapHistory = [];
const HEAP_HISTORY_MAX = 360;

// ─── GC Observer ─────────────────────────────────────────────────────────────

const gcObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const durationMs = entry.duration;
    const kind = entry.detail?.kind;

    gcStats.totalDurationMs += durationMs;
    gcStats.lastDurationMs = durationMs;

    if (kind === 1) {       // Minor GC (scavenge)
      gcStats.minorCount++;
      gcStats.lastType = 'minor';
    } else if (kind === 2) { // Major GC (mark-sweep)
      gcStats.majorCount++;
      gcStats.lastType = 'major';
    } else if (kind === 4) { // Incremental marking
      gcStats.incrementalCount++;
      gcStats.lastType = 'incremental';
    } else {
      gcStats.lastType = 'other';
    }
  }
});

try {
  gcObserver.observe({ entryTypes: ['gc'], buffered: false });
} catch {
  // GC observation not available in all Node versions
}

// ─── Event Loop Lag ──────────────────────────────────────────────────────────

function measureEventLoopLag() {
  return new Promise((resolve) => {
    const start = performance.now();
    setImmediate(() => {
      resolve(parseFloat((performance.now() - start).toFixed(3)));
    });
  });
}

// ─── Heap Trend ──────────────────────────────────────────────────────────────

function computeHeapGrowthRate() {
  if (heapHistory.length < 2) return 0;

  const oldest = heapHistory[0];
  const newest = heapHistory[heapHistory.length - 1];

  const timeDiffMin = (newest.time - oldest.time) / 60_000;
  if (timeDiffMin === 0) return 0;

  return (newest.heapUsed - oldest.heapUsed) / timeDiffMin;  // bytes/minute
}

// ─── Sample ───────────────────────────────────────────────────────────────────

async function sample() {
  try {
    const lagMs = await measureEventLoopLag();
    const heapStats = v8.getHeapStatistics();
    const heapUsedPct = heapStats.heap_size_limit > 0
      ? (heapStats.used_heap_size / heapStats.heap_size_limit) * 100
      : 0;

    // Update rolling heap history
    heapHistory.push({ time: Date.now(), heapUsed: heapStats.used_heap_size });
    if (heapHistory.length > HEAP_HISTORY_MAX) heapHistory.shift();

    const currCpuUsage = process.cpuUsage(prevCpuUsage);
    prevCpuUsage = process.cpuUsage();

    const snapshot = {
      timestamp: new Date(),
      eventLoop: {
        lagMs,
        utilisation: lagMs / SAMPLE_INTERVAL_MS,
      },
      heap: {
        usedBytes: heapStats.used_heap_size,
        totalBytes: heapStats.total_heap_size,
        limitBytes: heapStats.heap_size_limit,
        externalBytes: heapStats.external_memory,
        arrayBufferBytes: heapStats.array_buffer_memory || 0,
        usagePercent: parseFloat(heapUsedPct.toFixed(2)),
      },
      gc: { ...gcStats },
      handles: {
        active: process._getActiveHandles?.()?.length ?? 0,
        requests: process._getActiveRequests?.()?.length ?? 0,
      },
      cpuUsage: {
        userMs: currCpuUsage.user / 1000,
        systemMs: currCpuUsage.system / 1000,
      },
      heapGrowthRatePerMin: computeHeapGrowthRate(),
      environment: process.env.NODE_ENV || 'production',
      tier: 'raw',
    };

    await PerformanceSnapshot.create(snapshot);

    // ── Alert checks ────────────────────────────────────────────────────────
    if (lagMs > EVENT_LOOP_LAG_ALERT_MS) {
      alertEngine.check('EVENT_LOOP_LAG', lagMs, EVENT_LOOP_LAG_ALERT_MS, 'ms');
    }
    if (heapUsedPct > HEAP_USAGE_ALERT_PERCENT) {
      alertEngine.check('HEAP_HIGH', heapUsedPct, HEAP_USAGE_ALERT_PERCENT, '%');
    }

  } catch (err) {
    console.error('[PerformanceMetrics] Sample failed:', err.message);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function startPerformanceMetrics() {
  if (intervalHandle) return;
  setTimeout(sample, 3000);
  intervalHandle = setInterval(sample, SAMPLE_INTERVAL_MS);
  console.log('[PerformanceMetrics] Started');
}

export function stopPerformanceMetrics() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  try { gcObserver.disconnect(); } catch { /* ignore */ }
}

export async function getLatestPerformanceSnapshot() {
  return PerformanceSnapshot.findOne({ tier: 'raw' }).sort({ timestamp: -1 }).lean();
}

export async function getPerformanceHistory(fromDate, toDate, tier = 'raw') {
  return PerformanceSnapshot.find({
    tier,
    timestamp: { $gte: fromDate, $lte: toDate },
  }).sort({ timestamp: 1 }).lean();
}

export function getCurrentHeapSummary() {
  const stats = v8.getHeapStatistics();
  return {
    usedMB: (stats.used_heap_size / 1024 / 1024).toFixed(2),
    totalMB: (stats.total_heap_size / 1024 / 1024).toFixed(2),
    limitMB: (stats.heap_size_limit / 1024 / 1024).toFixed(2),
    usagePercent: ((stats.used_heap_size / stats.heap_size_limit) * 100).toFixed(2),
    growthRateBytesPerMin: computeHeapGrowthRate().toFixed(0),
  };
}
