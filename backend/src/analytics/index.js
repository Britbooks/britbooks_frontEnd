/**
 * Analytics Module — Main Initialiser
 *
 * Usage in server.js / app.js:
 *
 *   import analytics from './src/analytics/index.js';
 *   analytics.init(app, {
 *     environment: process.env.NODE_ENV,
 *     gdprMode: true,
 *     retentionDays: 30,
 *     auditRetentionYears: 7,
 *     alertChannels: ['email', 'slack'],
 *   });
 *
 * Each collector can be individually disabled via env flags:
 *   ANALYTICS_ENABLED=true
 *   ANALYTICS_SYSTEM_METRICS=true
 *   ANALYTICS_APP_METRICS=true
 *   ANALYTICS_DB_METRICS=true
 *   ANALYTICS_PERFORMANCE_METRICS=true
 *   ANALYTICS_SECURITY=true
 *   ANALYTICS_RETENTION=true
 */

import { startSystemMetrics, stopSystemMetrics } from './collectors/systemMetrics.js';
import { appMetricsMiddleware } from './collectors/appMetrics.js';
import { initDbMetrics } from './collectors/dbMetrics.js';
import { startPerformanceMetrics, stopPerformanceMetrics } from './collectors/performanceMetrics.js';
import { threatDetectionMiddleware } from './security/threatDetector.js';
import { bootstrapHashChain } from './security/auditLogger.js';
import { bootstrapAlertCooldowns } from './alerting/alertEngine.js';
import { startBusinessMetrics } from './collectors/businessMetrics.js';
import { startRetentionManager } from './compliance/retentionManager.js';
import { initROPA } from './compliance/ropaLogger.js';
import ErrorLog from './models/ErrorLog.js';
import crypto, { randomUUID } from 'crypto';

function isEnabled(envKey, defaultValue = true) {
  const val = process.env[envKey];
  if (val === undefined) return defaultValue;
  return val === 'true' || val === '1';
}

function pseudonymise(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

// ─── Error Tracking ───────────────────────────────────────────────────────────

function setupErrorTracking() {
  async function recordError(errorType, err, context = {}) {
    try {
      const existing = await ErrorLog.findOne({
        name: err.name,
        'context.route': context.route || null,
        status: { $ne: 'RESOLVED' },
      });

      if (existing) {
        await ErrorLog.updateOne(
          { _id: existing._id },
          {
            $set: { lastSeen: new Date(), message: err.message },
            $inc: {
              'frequency.total': 1,
              'frequency.lastHour': 1,
              'frequency.lastDay': 1,
            },
          }
        );
      } else {
        await ErrorLog.create({
          errorId: randomUUID(),
          type: errorType,
          message: err.message,
          stackTrace: err.stack,
          name: err.name,
          context: {
            requestId: context.requestId,
            route: context.route,
            method: context.method,
            userIdHash: pseudonymise(context.userId),
            userRole: context.role,
            nodeVersion: process.version,
            os: process.platform,
            environment: process.env.NODE_ENV || 'production',
            gitSha: process.env.GIT_COMMIT_SHA || 'unknown',
            isUserFacing: context.isUserFacing ?? false,
          },
          deploymentVersion: process.env.GIT_COMMIT_SHA || 'unknown',
          environment: process.env.NODE_ENV || 'production',
        });
      }
    } catch (logErr) {
      console.error('[Analytics] Failed to record error:', logErr.message);
    }
  }

  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    err.name = err.name || 'UnhandledRejection';
    console.error('[Analytics] Unhandled rejection:', err.message);
    recordError('UNHANDLED_REJECTION', err);
  });

  process.on('uncaughtException', (err) => {
    console.error('[Analytics] Uncaught exception:', err.message);
    recordError('UNCAUGHT_EXCEPTION', err);
    // Do NOT exit here — let existing error handling manage that
  });
}

// ─── System Metric Alert Checks ───────────────────────────────────────────────

function setupSystemMetricAlerts() {
  // Lazy setup — check latest metric every 30s for threshold breaches
  setInterval(async () => {
    try {
      const [{ alertEngine }, { getLatestSystemMetric }] = await Promise.all([
        import('./alerting/alertEngine.js'),
        import('./collectors/systemMetrics.js'),
      ]);
      const metric = await getLatestSystemMetric();
      if (!metric) return;

      if (metric.cpu?.usagePercent > 85) {
        alertEngine.check('CPU_HIGH', metric.cpu.usagePercent, 85, '%');
      } else {
        alertEngine.clearSustained('CPU_HIGH');
      }

      if (metric.memory?.usagePercent > 90) {
        alertEngine.check('MEMORY_HIGH', metric.memory.usagePercent, 90, '%');
      }

      for (const disk of metric.disk || []) {
        if (disk.usagePercent > 80) {
          alertEngine.check('DISK_HIGH', disk.usagePercent, 80, '%');
        }
      }
    } catch { /* ignore */ }
  }, 30_000);
}

// ─── Main Init ────────────────────────────────────────────────────────────────

const analytics = {
  async init(app, options = {}) {
    if (!isEnabled('ANALYTICS_ENABLED', true)) {
      console.log('[Analytics] Module disabled via ANALYTICS_ENABLED=false');
      return;
    }

    const {
      environment = process.env.NODE_ENV || 'production',
      gdprMode = true,
      retentionDays = 30,
      auditRetentionYears = 7,
      alertChannels = ['email', 'slack'],
    } = options;

    // Store config in env for other modules to read
    process.env.ANALYTICS_GDPR_MODE = gdprMode ? 'true' : 'false';
    process.env.ANALYTICS_RETENTION_DAYS = String(retentionDays);
    process.env.ANALYTICS_AUDIT_YEARS = String(auditRetentionYears);
    process.env.ALERT_CHANNELS = alertChannels.join(',');

    console.log(`[Analytics] Initialising in ${environment} mode (GDPR: ${gdprMode})`);

    // 1. Bootstrap audit hash chain + alert cooldowns from DB
    await bootstrapHashChain();
    await bootstrapAlertCooldowns();

    // 2. Initialise ROPA (Record of Processing Activities)
    if (gdprMode) {
      await initROPA().catch(err => console.error('[Analytics] ROPA init failed:', err.message));
    }

    // 3. App metrics middleware (must be registered before routes)
    if (isEnabled('ANALYTICS_APP_METRICS', true)) {
      app.use(appMetricsMiddleware);
      console.log('[Analytics] App metrics middleware registered');
    }

    // 4. Threat detection middleware
    if (isEnabled('ANALYTICS_SECURITY', true)) {
      app.use(threatDetectionMiddleware);
      console.log('[Analytics] Threat detection middleware registered');
    }

    // 5. DB metrics (Mongoose plugin — must run after model imports)
    if (isEnabled('ANALYTICS_DB_METRICS', true)) {
      initDbMetrics();
    }

    // 7. System metrics collector
    if (isEnabled('ANALYTICS_SYSTEM_METRICS', true)) {
      startSystemMetrics(10_000);
    }

    // 8. Performance metrics collector
    if (isEnabled('ANALYTICS_PERFORMANCE_METRICS', true)) {
      startPerformanceMetrics();
    }

    // 9. Error tracking
    setupErrorTracking();

    // 10. System metric alert checks
    setupSystemMetricAlerts();

    // 11. Business metrics (hourly snapshots + real-time queries)
    if (isEnabled('ANALYTICS_BUSINESS_METRICS', true)) {
      startBusinessMetrics();
    }

    // 12. Retention manager (daily cron)
    if (isEnabled('ANALYTICS_RETENTION', true)) {
      startRetentionManager();
    }

    console.log('[Analytics] All modules initialised successfully');
  },

  stop() {
    stopSystemMetrics();
    stopPerformanceMetrics();
    console.log('[Analytics] Collectors stopped');
  },
};

export default analytics;

// Named exports for direct use in other modules
export { writeAuditLog } from './security/auditLogger.js';
export { checkLoginAttempt, checkPrivilegeEscalation, checkJwtAnomaly, checkAdminAccess } from './security/threatDetector.js';
export { recordConsent, initiateRTBF, initiateSAR, executeRTBF, hasConsent } from './compliance/gdprManager.js';
