/**
 * Alert Engine
 * Threshold-based alerting with cooldown to prevent alert storms.
 * Integrates with email, SMS, Slack notifiers and persists all alerts to DB.
 *
 * Thresholds:
 * - CPU > 85% for 2 minutes
 * - RAM > 90% used
 * - Disk > 80% full
 * - Event loop lag > 100ms for 60s
 * - Error rate > 5% on any endpoint in 5 minutes
 * - CRITICAL security event
 * - DB connection pool exhausted
 * - Heap > 85%
 * - Monitor down
 */

import { randomUUID } from 'crypto';
import AlertRecord from '../models/AlertRecord.js';

// Alert cooldowns — prevent re-firing the same alert within cooldown window
// Sustained conditions (RAM, disk) use long cooldowns to avoid alert storms
const COOLDOWNS = {
  CPU_HIGH: 30 * 60 * 1000,         // 30 minutes
  MEMORY_HIGH: 60 * 60 * 1000,      // 1 hour — sustained condition, don't spam
  DISK_HIGH: 6 * 60 * 60 * 1000,    // 6 hours — disk doesn't change quickly
  EVENT_LOOP_LAG: 10 * 60 * 1000,   // 10 minutes
  ERROR_RATE_HIGH: 15 * 60 * 1000,  // 15 minutes
  SECURITY_CRITICAL: 0,             // Never cooldown critical security
  DB_POOL_EXHAUSTED: 30 * 60 * 1000,
  HEAP_HIGH: 30 * 60 * 1000,
  OUTBOUND_API_FAILURE: 15 * 60 * 1000,
  MONITOR_DOWN: 60 * 60 * 1000,     // 1 hour
};

// Sustained threshold tracking: { type -> [timestamps] }
const sustainedTracking = new Map();
const SUSTAINED_REQUIREMENTS = {
  CPU_HIGH: 2 * 60 * 1000,        // Must be high for 2 min
  EVENT_LOOP_LAG: 60 * 1000,      // 60 seconds
};

const lastFiredAt = new Map();     // type -> Date

/**
 * Populate lastFiredAt from DB on startup so cooldowns survive restarts.
 * Without this, every deploy fires all threshold alerts immediately.
 */
export async function bootstrapAlertCooldowns() {
  try {
    const alertTypes = Object.keys(COOLDOWNS).filter(t => COOLDOWNS[t] > 0);

    // Find the most recent alert of each type
    const recent = await AlertRecord.aggregate([
      { $match: { type: { $in: alertTypes } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$type', lastFiredAt: { $first: '$timestamp' } } },
    ]);

    for (const { _id: type, lastFiredAt: firedAt } of recent) {
      lastFiredAt.set(type, new Date(firedAt));
    }

    console.log(`[AlertEngine] Cooldowns bootstrapped from DB (${recent.length} types restored)`);
  } catch (err) {
    console.error('[AlertEngine] Failed to bootstrap cooldowns:', err.message);
  }
}

// Lazy-loaded notifiers to avoid circular deps
let emailNotifier, smsNotifier, slackNotifier;

async function loadNotifiers() {
  if (!emailNotifier) {
    const [e, s, sl] = await Promise.all([
      import('./notifiers/emailNotifier.js'),
      import('./notifiers/smsNotifier.js'),
      import('./notifiers/slackNotifier.js'),
    ]);
    emailNotifier = e;
    smsNotifier = s;
    slackNotifier = sl;
  }
}

// ─── Remediation Hints ────────────────────────────────────────────────────────

const REMEDIATION = {
  CPU_HIGH: 'Check running processes (pm2 list, top). Consider scaling or identifying runaway processes.',
  MEMORY_HIGH: 'Check heap usage, look for memory leaks. Consider restarting the process or scaling.',
  DISK_HIGH: 'Run du -sh /* to identify large files. Rotate logs. Clear old FTP/SFTP staging files.',
  EVENT_LOOP_LAG: 'Check for synchronous I/O or long-running operations blocking the event loop.',
  ERROR_RATE_HIGH: 'Check application logs, recent deployments, and upstream service health.',
  SECURITY_CRITICAL: 'Review security event feed immediately. Consider blocking the source IP.',
  DB_POOL_EXHAUSTED: 'Check MongoDB connection usage. Investigate slow queries holding connections.',
  HEAP_HIGH: 'Take a heap snapshot. Check for memory leaks, large caches, or uncleaned intervals.',
  OUTBOUND_API_FAILURE: 'Check upstream service status. Review retry configuration and circuit breaker state.',
  MONITOR_DOWN: 'Check server connectivity and process status. Review UptimeRobot webhook logs.',
};

const SEVERITY_MAP = {
  CPU_HIGH: 'WARNING',
  MEMORY_HIGH: 'CRITICAL',
  DISK_HIGH: 'WARNING',
  EVENT_LOOP_LAG: 'WARNING',
  ERROR_RATE_HIGH: 'WARNING',
  SECURITY_CRITICAL: 'CRITICAL',
  DB_POOL_EXHAUSTED: 'CRITICAL',
  HEAP_HIGH: 'WARNING',
  OUTBOUND_API_FAILURE: 'WARNING',
  MONITOR_DOWN: 'CRITICAL',
};

// ─── Core Alert Dispatcher ────────────────────────────────────────────────────

async function dispatchAlert(alertData) {
  const {
    type,
    severity,
    title,
    message,
    metric = {},
    affectedSystem = 'britbooks-api',
    channels = (process.env.ALERT_CHANNELS || 'email,slack').split(','),
  } = alertData;

  const alertId = randomUUID();
  const now = new Date();
  const dashboardLink = `${process.env.FRONTEND_PROD_URL || 'https://britbooks.co.uk'}/admin/analytics`;

  // Persist to DB
  try {
    await AlertRecord.create({
      alertId,
      timestamp: now,
      severity,
      type,
      title,
      message,
      metric,
      affectedSystem,
      remediation: REMEDIATION[type] || 'Check system logs for details.',
      dashboardLink,
      channels,
      status: 'OPEN',
      environment: process.env.NODE_ENV || 'production',
    });
  } catch (err) {
    console.error('[AlertEngine] Failed to persist alert:', err.message);
  }

  const payload = {
    alertId,
    severity,
    type,
    title,
    message,
    metric,
    affectedSystem,
    timestamp: now.toISOString(),
    remediation: REMEDIATION[type] || 'Check system logs.',
    dashboardLink,
  };

  console.warn(`[ALERT] ${severity} — ${title}: ${message}`);

  // Send via channels
  await loadNotifiers();

  const notificationPromises = [];

  if (channels.includes('email') && process.env.ALERT_EMAIL) {
    notificationPromises.push(
      emailNotifier.sendAlertEmail(payload).catch(err =>
        console.error('[AlertEngine] Email notification failed:', err.message)
      )
    );
  }

  if (channels.includes('sms') && severity === 'CRITICAL') {
    notificationPromises.push(
      smsNotifier.sendAlertSMS(payload).catch(err =>
        console.error('[AlertEngine] SMS notification failed:', err.message)
      )
    );
  }

  if (channels.includes('slack') && process.env.SLACK_WEBHOOK_URL) {
    notificationPromises.push(
      slackNotifier.sendAlertSlack(payload).catch(err =>
        console.error('[AlertEngine] Slack notification failed:', err.message)
      )
    );
  }

  await Promise.allSettled(notificationPromises);
}

// ─── Cooldown Check ───────────────────────────────────────────────────────────

function isInCooldown(type) {
  const cooldown = COOLDOWNS[type] ?? 5 * 60 * 1000;
  if (cooldown === 0) return false;   // No cooldown
  const last = lastFiredAt.get(type);
  return last && Date.now() - last.getTime() < cooldown;
}

// ─── Sustained Threshold Check ────────────────────────────────────────────────

function isSustained(type) {
  const requiredMs = SUSTAINED_REQUIREMENTS[type];
  if (!requiredMs) return true;    // No sustained requirement — fire immediately

  const history = sustainedTracking.get(type) || [];
  const now = Date.now();
  const recent = history.filter(t => now - t < requiredMs);
  sustainedTracking.set(type, [...recent, now]);

  // Need at least one sample at the start of the window and now
  if (recent.length === 0) return false;
  return now - recent[0] >= requiredMs;
}

// ─── Public API ──────────────────────────────────────────────────────────────

const alertEngine = {
  /**
   * Check a metric against a threshold.
   * Handles cooldown, sustained requirements, and dispatching.
   */
  check(type, currentValue, threshold, unit = '') {
    if (isInCooldown(type)) return;
    if (!isSustained(type)) return;

    const severity = SEVERITY_MAP[type] || 'WARNING';
    lastFiredAt.set(type, new Date());

    dispatchAlert({
      type,
      severity,
      title: `${type.replace(/_/g, ' ')} Alert`,
      message: `${type}: current ${currentValue}${unit} exceeds threshold ${threshold}${unit}`,
      metric: { name: type, currentValue, threshold, unit },
    });
  },

  /**
   * Immediately trigger an alert (no cooldown check — use for critical events)
   */
  trigger(alertData) {
    const type = alertData.type || 'CUSTOM';
    const severity = alertData.severity || SEVERITY_MAP[type] || 'WARNING';

    if (isInCooldown(type) && severity !== 'CRITICAL') return;
    lastFiredAt.set(type, new Date());

    dispatchAlert({
      ...alertData,
      severity,
    });
  },

  /**
   * Clear sustained tracking for a metric (e.g. when it recovers below threshold)
   */
  clearSustained(type) {
    sustainedTracking.delete(type);
  },
};

export { alertEngine };

// ─── Query helpers ────────────────────────────────────────────────────────────

export async function getRecentAlerts(limit = 50) {
  return AlertRecord.find().sort({ timestamp: -1 }).limit(limit).lean();
}

export async function getOpenAlerts() {
  return AlertRecord.find({ status: 'OPEN' }).sort({ timestamp: -1 }).lean();
}

export async function acknowledgeAlert(alertId, acknowledgedBy) {
  return AlertRecord.findOneAndUpdate(
    { alertId },
    { $set: { status: 'ACKNOWLEDGED', acknowledgedBy } },
    { new: true }
  );
}

export async function resolveAlert(alertId) {
  return AlertRecord.findOneAndUpdate(
    { alertId },
    { $set: { status: 'RESOLVED', resolvedAt: new Date() } },
    { new: true }
  );
}
