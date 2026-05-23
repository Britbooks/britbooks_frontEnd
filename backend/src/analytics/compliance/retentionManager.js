/**
 * Retention Manager — UK Legal Data Retention
 * Daily cron job enforcing:
 * - Raw metrics deleted after 30 days
 * - Hourly aggregates retained for 1 year
 * - Daily aggregates retained for 7 years
 * - Audit logs retained for 7 years (UK legal minimum)
 * - Security events retained for 1 year
 * - Request logs retained for 30 days
 *
 * Aggregation: compresses raw data into hourly/daily buckets before deletion
 */

import cron from 'node-cron';
import SystemMetric from '../models/SystemMetric.js';
import RequestLog from '../models/RequestLog.js';
import SecurityEvent from '../models/SecurityEvent.js';
import PerformanceSnapshot from '../models/PerformanceSnapshot.js';
import AuditLog from '../models/AuditLog.js';
import { writeAuditLog } from '../security/auditLogger.js';

const RETENTION = {
  rawDays: 30,
  hourlyDays: 365,
  dailyDays: 365 * 7,
  auditYears: 7,
  securityEventDays: 365,
  requestLogDays: 30,
  errorLogDays: 90,
};

let cleanupReport = {
  lastRun: null,
  totalDeleted: 0,
  lastResults: {},
};

// ─── Aggregation Helpers ───────────────────────────────────────────────────────

async function aggregateSystemMetrics(fromDate, toDate, tier) {
  const pipeline = [
    { $match: { tier: 'raw', timestamp: { $gte: fromDate, $lte: toDate } } },
    {
      $group: {
        _id: tier === 'hourly'
          ? {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' },
              hour: { $hour: '$timestamp' },
            }
          : {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' },
            },
        timestamp: { $first: '$timestamp' },
        avgCpuUsage: { $avg: '$cpu.usagePercent' },
        avgMemUsage: { $avg: '$memory.usagePercent' },
        avgLoad1: { $avg: '$loadAvg.oneMin' },
        avgLoad5: { $avg: '$loadAvg.fiveMin' },
        count: { $sum: 1 },
      },
    },
  ];

  const results = await SystemMetric.aggregate(pipeline);

  for (const r of results) {
    const ts = tier === 'hourly'
      ? new Date(`${r._id.year}-${String(r._id.month).padStart(2,'0')}-${String(r._id.day).padStart(2,'0')}T${String(r._id.hour).padStart(2,'0')}:00:00Z`)
      : new Date(`${r._id.year}-${String(r._id.month).padStart(2,'0')}-${String(r._id.day).padStart(2,'0')}T00:00:00Z`);

    await SystemMetric.findOneAndUpdate(
      { tier, timestamp: ts },
      {
        $setOnInsert: {
          tier,
          timestamp: ts,
          aggregatedAt: new Date(),
          environment: process.env.NODE_ENV || 'production',
          cpu: { usagePercent: r.avgCpuUsage },
          memory: { usagePercent: r.avgMemUsage },
          loadAvg: { oneMin: r.avgLoad1, fiveMin: r.avgLoad5 },
        },
      },
      { upsert: true }
    );
  }

  return results.length;
}

// ─── Cleanup Functions ────────────────────────────────────────────────────────

async function deleteOlderThan(Model, field, days, additionalFilter = {}) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await Model.deleteMany({
    [field]: { $lt: cutoff },
    ...additionalFilter,
  });
  return result.deletedCount;
}

async function runRetentionCleanup() {
  const startedAt = new Date();
  console.log('[RetentionManager] Starting daily retention cleanup...');

  const results = {};

  try {
    // 1. Aggregate raw system metrics to hourly (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const aggregatedHourly = await aggregateSystemMetrics(sixtyDaysAgo, thirtyDaysAgo, 'hourly');
    results.aggregatedHourlySystemMetrics = aggregatedHourly;

    // 2. Aggregate hourly to daily (older than 1 year)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
    const aggregatedDaily = await aggregateSystemMetrics(twoYearsAgo, oneYearAgo, 'daily');
    results.aggregatedDailySystemMetrics = aggregatedDaily;

    // 3. Delete raw system metrics older than 30 days
    results.deletedRawSystemMetrics = await deleteOlderThan(SystemMetric, 'timestamp', RETENTION.rawDays, { tier: 'raw' });

    // 4. Delete hourly aggregates older than 1 year
    results.deletedHourlySystemMetrics = await deleteOlderThan(SystemMetric, 'timestamp', RETENTION.hourlyDays, { tier: 'hourly' });

    // 5. Delete raw performance snapshots older than 30 days
    results.deletedRawPerformance = await deleteOlderThan(PerformanceSnapshot, 'timestamp', RETENTION.rawDays, { tier: 'raw' });

    // 6. Delete request logs older than 30 days
    results.deletedRequestLogs = await deleteOlderThan(RequestLog, 'timestamp', RETENTION.requestLogDays);

    // 7. Delete security events older than 1 year
    results.deletedSecurityEvents = await deleteOlderThan(SecurityEvent, 'timestamp', RETENTION.securityEventDays);

    // Audit logs are NEVER deleted — 7-year minimum retention
    // Verify audit logs exist for compliance
    const auditCutoff = new Date(Date.now() - RETENTION.auditYears * 365 * 24 * 60 * 60 * 1000);
    results.auditLogsBeforeRetentionCutoff = await AuditLog.countDocuments({
      timestamp: { $lt: auditCutoff },
    });

    const totalDeleted = Object.entries(results)
      .filter(([k]) => k.startsWith('deleted'))
      .reduce((sum, [, v]) => sum + (v || 0), 0);

    cleanupReport = {
      lastRun: startedAt,
      totalDeleted,
      lastResults: results,
      durationMs: Date.now() - startedAt.getTime(),
    };

    console.log(`[RetentionManager] Cleanup complete. Deleted ${totalDeleted} records.`, results);

    // Write audit log for compliance
    await writeAuditLog({
      action: 'DELETE',
      actor: { userId: '[SYSTEM]', role: 'system' },
      resource: { type: 'RetentionCleanup', id: startedAt.toISOString() },
      reason: 'Automated retention policy enforcement',
      legalBasis: 'LEGAL_OBLIGATION',
      outcome: 'SUCCESS',
      after: results,
    });

    return cleanupReport;
  } catch (err) {
    console.error('[RetentionManager] Cleanup failed:', err.message);
    await writeAuditLog({
      action: 'DELETE',
      actor: { userId: '[SYSTEM]', role: 'system' },
      resource: { type: 'RetentionCleanup', id: startedAt.toISOString() },
      reason: 'Automated retention policy enforcement',
      outcome: 'FAILURE',
      after: { error: err.message },
    });
    throw err;
  }
}

// ─── Monthly Compliance Report ────────────────────────────────────────────────

async function generateMonthlyRetentionReport() {
  const now = new Date();
  const report = {
    generatedAt: now.toISOString(),
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    policy: RETENTION,
    counts: {
      rawSystemMetrics: await SystemMetric.countDocuments({ tier: 'raw' }),
      hourlySystemMetrics: await SystemMetric.countDocuments({ tier: 'hourly' }),
      dailySystemMetrics: await SystemMetric.countDocuments({ tier: 'daily' }),
      requestLogs: await RequestLog.countDocuments({}),
      securityEvents: await SecurityEvent.countDocuments({}),
      auditLogs: await AuditLog.countDocuments({}),
    },
    lastCleanup: cleanupReport,
  };

  console.log('[RetentionManager] Monthly retention report generated:', JSON.stringify(report, null, 2));
  return report;
}

// ─── Cron Initialisation ──────────────────────────────────────────────────────

export function startRetentionManager() {
  // Daily at 03:00 UTC
  cron.schedule('0 3 * * *', async () => {
    try {
      await runRetentionCleanup();
    } catch (err) {
      console.error('[RetentionManager] Scheduled cleanup error:', err.message);
    }
  }, { timezone: 'UTC' });

  // Monthly compliance report — 1st of each month at 04:00 UTC
  cron.schedule('0 4 1 * *', async () => {
    try {
      await generateMonthlyRetentionReport();
    } catch (err) {
      console.error('[RetentionManager] Monthly report error:', err.message);
    }
  }, { timezone: 'UTC' });

  console.log('[RetentionManager] Scheduled daily cleanup at 03:00 UTC + monthly report on 1st');
}

export async function runRetentionNow() {
  return runRetentionCleanup();
}

export function getCleanupReport() {
  return cleanupReport;
}

export { RETENTION };
