/**
 * Analytics Dashboard Router
 * Protected — requires admin role (authenticateUser + authorizeAdmin middleware)
 *
 * Routes:
 *   GET  /api/analytics/health               — Real-time system health
 *   GET  /api/analytics/metrics/system       — System metrics history
 *   GET  /api/analytics/metrics/performance  — Performance snapshots
 *   GET  /api/analytics/metrics/requests     — Request stats by endpoint
 *   GET  /api/analytics/metrics/endpoints    — Top slow / erroring endpoints
 *   GET  /api/analytics/database             — DB health & slow queries
 *   GET  /api/analytics/security/events      — Security event feed
 *   GET  /api/analytics/security/stats       — Security stats
 *   GET  /api/analytics/errors               — Error log
 *   GET  /api/analytics/alerts               — Alert feed
 *   POST /api/analytics/alerts/:id/ack       — Acknowledge alert
 *   POST /api/analytics/alerts/:id/resolve   — Resolve alert
 *   GET  /api/analytics/audit                — Audit log viewer
 *   POST /api/analytics/audit/verify         — Verify chain integrity
 *   GET  /api/analytics/gdpr/consents        — Consent stats
 *   GET  /api/analytics/gdpr/sar             — Pending SARs
 *   GET  /api/analytics/gdpr/rtbf            — Pending RTBFs
 *   GET  /api/analytics/compliance/ropa      — ROPA export
 *   GET  /api/analytics/reports/audit        — Generate audit report (JSON/CSV/PDF)
 *   GET  /api/analytics/reports/breach       — ICO breach report template
 *   GET  /api/analytics/reports/consent      — Consent summary report
 *   GET  /api/analytics/reports/retention    — Retention status
 *   POST /api/analytics/retention/run        — Trigger retention cleanup (super_admin)
 *
 * Business routes:
 *   GET  /api/analytics/business/summary          — Real-time business overview
 *   GET  /api/analytics/business/orders/funnel    — Order status funnel
 *   GET  /api/analytics/business/orders/user/:id  — Orders for a specific user
 *   GET  /api/analytics/business/revenue          — Revenue time-series
 *   GET  /api/analytics/business/users/growth     — User registration over time
 *   GET  /api/analytics/business/listings/top     — Top selling listings
 *   GET  /api/analytics/business/snapshots        — Historical business snapshots
 */

import express from 'express';
import authMiddleware from '../../app/middleware/authMiddleware.js';
import { authorizeAdmin } from '../../app/middleware/adminMiddleware.js';
import {
  getRealtimeBusinessSummary,
  getOrderCycleFunnel,
  getRevenueTimeSeries,
  getUserGrowthTimeSeries,
  getTopSellingListings,
  getOrdersByUser,
  getSnapshotHistory,
} from '../collectors/businessMetrics.js';

import {
  getLatestSystemMetric,
  getSystemMetricHistory,
} from '../collectors/systemMetrics.js';
import {
  getAllEndpointStats,
  getTop10SlowestEndpoints,
  getTop10ErrorEndpoints,
  getRequestStats,
} from '../collectors/appMetrics.js';
import {
  getDatabaseHealth,
  getSlowQueries,
  getCollectionStats,
} from '../collectors/dbMetrics.js';
import {
  getLatestPerformanceSnapshot,
  getPerformanceHistory,
  getCurrentHeapSummary,
} from '../collectors/performanceMetrics.js';
import {
  getSecurityEventFeed,
  getSecurityEventStats,
} from '../security/threatDetector.js';
import {
  getAuditLogs,
  verifyChainIntegrity,
} from '../security/auditLogger.js';
import {
  getRecentAlerts,
  getOpenAlerts,
  acknowledgeAlert,
  resolveAlert,
} from '../alerting/alertEngine.js';
import {
  getConsentStats,
  getPendingSARRequests,
  getPendingRTBFRequests,
} from '../compliance/gdprManager.js';
import {
  getCleanupReport,
  runRetentionNow,
} from '../compliance/retentionManager.js';
import {
  generateAuditReport,
  generateAuditReportPDF,
  generateBreachReport,
  generateROPAReport,
  generateConsentReport,
} from '../compliance/icoReporter.js';
import ErrorLog from '../models/ErrorLog.js';
import SystemMetric from '../models/SystemMetric.js';

const router = express.Router();

// All analytics routes require admin auth
router.use(authMiddleware);
router.use(authorizeAdmin);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDateRange(query) {
  const now = new Date();
  const days = parseInt(query.days || 1);
  const fromDate = query.from ? new Date(query.from) : new Date(now - days * 24 * 60 * 60 * 1000);
  const toDate = query.to ? new Date(query.to) : now;
  return { fromDate, toDate };
}

// ─── Real-time Health ─────────────────────────────────────────────────────────

router.get('/health', async (req, res) => {
  try {
    const [systemMetric, perfSnapshot, dbHealth, openAlerts] = await Promise.all([
      getLatestSystemMetric(),
      getLatestPerformanceSnapshot(),
      getDatabaseHealth(),
      getOpenAlerts(),
    ]);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      system: systemMetric ? {
        cpu: systemMetric.cpu?.usagePercent,
        memoryPercent: systemMetric.memory?.usagePercent,
        uptime: systemMetric.uptime,
        loadAvg: systemMetric.loadAvg,
      } : null,
      performance: perfSnapshot ? {
        eventLoopLagMs: perfSnapshot.eventLoop?.lagMs,
        heapUsagePercent: perfSnapshot.heap?.usagePercent,
        heapSummary: getCurrentHeapSummary(),
      } : null,
      database: dbHealth,
      openAlerts: openAlerts.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── System Metrics ───────────────────────────────────────────────────────────

router.get('/metrics/system', async (req, res) => {
  try {
    const { fromDate, toDate } = parseDateRange(req.query);
    const tier = req.query.tier || 'raw';
    const data = await getSystemMetricHistory(fromDate, toDate, tier);
    res.json({ fromDate, toDate, tier, count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Performance ──────────────────────────────────────────────────────────────

router.get('/metrics/performance', async (req, res) => {
  try {
    const { fromDate, toDate } = parseDateRange(req.query);
    const tier = req.query.tier || 'raw';
    const [history, latest] = await Promise.all([
      getPerformanceHistory(fromDate, toDate, tier),
      getLatestPerformanceSnapshot(),
    ]);
    res.json({ fromDate, toDate, tier, latest, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Request Analytics ────────────────────────────────────────────────────────

router.get('/metrics/requests', async (req, res) => {
  try {
    const { fromDate, toDate } = parseDateRange(req.query);
    const data = await getRequestStats(fromDate, toDate);
    res.json({ fromDate, toDate, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/metrics/endpoints', async (req, res) => {
  try {
    res.json({
      all: getAllEndpointStats(),
      top10Slowest: getTop10SlowestEndpoints(),
      top10Errors: getTop10ErrorEndpoints(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Database ─────────────────────────────────────────────────────────────────

router.get('/database', async (req, res) => {
  try {
    res.json({
      health: getDatabaseHealth(),
      collections: getCollectionStats(),
      slowQueries: getSlowQueries(parseInt(req.query.limit || 20)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Security ─────────────────────────────────────────────────────────────────

router.get('/security/events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || 100);
    const events = await getSecurityEventFeed(limit);
    res.json({ count: events.length, events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/security/stats', async (req, res) => {
  try {
    const { fromDate, toDate } = parseDateRange(req.query);
    const stats = await getSecurityEventStats(fromDate, toDate);
    res.json({ fromDate, toDate, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Errors ───────────────────────────────────────────────────────────────────

router.get('/errors', async (req, res) => {
  try {
    const status = req.query.status || 'OPEN';
    const limit = parseInt(req.query.limit || 50);
    const errors = await ErrorLog.find(status !== 'ALL' ? { status } : {})
      .sort({ lastSeen: -1 })
      .limit(limit)
      .lean();
    res.json({ count: errors.length, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Alerts ───────────────────────────────────────────────────────────────────

router.get('/alerts', async (req, res) => {
  try {
    const [recent, open] = await Promise.all([
      getRecentAlerts(parseInt(req.query.limit || 50)),
      getOpenAlerts(),
    ]);
    res.json({ openCount: open.length, recentAlerts: recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/alerts/:id/ack', async (req, res) => {
  try {
    const alert = await acknowledgeAlert(req.params.id, req.user?.userId);
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await resolveAlert(req.params.id);
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Audit Log ────────────────────────────────────────────────────────────────

router.get('/audit', async (req, res) => {
  try {
    const { fromDate, toDate } = parseDateRange(req.query);
    const { userIdHash, action, resourceType } = req.query;
    const limit = parseInt(req.query.limit || 100);
    const offset = parseInt(req.query.offset || 0);

    const result = await getAuditLogs({ fromDate, toDate, userIdHash, action, resourceType, limit, offset });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/audit/verify', async (req, res) => {
  try {
    const { fromDate, toDate } = parseDateRange(req.body || {});
    const result = await verifyChainIntegrity(fromDate, toDate);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GDPR ─────────────────────────────────────────────────────────────────────

router.get('/gdpr/consents', async (req, res) => {
  try {
    const stats = await getConsentStats();
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/gdpr/sar', async (req, res) => {
  try {
    const pending = await getPendingSARRequests();
    res.json({ pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/gdpr/rtbf', async (req, res) => {
  try {
    const pending = await getPendingRTBFRequests();
    res.json({ pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Compliance ───────────────────────────────────────────────────────────────

router.get('/compliance/ropa', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const report = await generateROPAReport(format);
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ropa.csv"');
      res.send(report.csv);
    } else {
      res.json(report);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Reports ─────────────────────────────────────────────────────────────────

router.get('/reports/audit', async (req, res) => {
  try {
    const { fromDate, toDate } = parseDateRange(req.query);
    const format = req.query.format || 'json';
    const requestedBy = req.user?.userId;

    const report = await generateAuditReport({ fromDate, toDate, format, requestedBy });

    if (format === 'pdf') {
      const pdfBuffer = await generateAuditReportPDF(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="audit-report-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-report-${Date.now()}.csv"`);
      res.send(report.csv);
    } else {
      res.json(report);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/breach', async (req, res) => {
  try {
    const report = await generateBreachReport({
      breachDiscoveredAt: req.query.discoveredAt,
      breachOccurredAt: req.query.occurredAt,
      description: req.query.description,
      affectedDataSubjects: parseInt(req.query.affected || 0),
      dataCategories: req.query.categories?.split(',') || [],
      reportedBy: req.user?.userId,
    });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/consent', async (req, res) => {
  try {
    const report = await generateConsentReport();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/retention', async (req, res) => {
  try {
    const counts = {
      rawSystemMetrics: await SystemMetric.countDocuments({ tier: 'raw' }),
      hourlySystemMetrics: await SystemMetric.countDocuments({ tier: 'hourly' }),
      dailySystemMetrics: await SystemMetric.countDocuments({ tier: 'daily' }),
    };
    res.json({
      lastCleanup: getCleanupReport(),
      currentCounts: counts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Actions ────────────────────────────────────────────────────────────

router.post('/retention/run', async (req, res) => {
  // Only super_admin can trigger manual cleanup
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Requires super_admin role' });
  }
  try {
    const report = await runRetentionNow();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

// Real-time business overview — users, orders, revenue, listings, wallet, lifecycle
router.get('/business/summary', async (req, res) => {
  try {
    const summary = await getRealtimeBusinessSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Order status funnel — how many orders are at each stage
router.get('/business/orders/funnel', async (req, res) => {
  try {
    const funnel = await getOrderCycleFunnel();
    res.json({ funnel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders for a specific user
router.get('/business/orders/user/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || 20);
    const orders = await getOrdersByUser(req.params.userId, limit);
    res.json({ userId: req.params.userId, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Daily revenue time-series
router.get('/business/revenue', async (req, res) => {
  try {
    const days = parseInt(req.query.days || 30);
    const data = await getRevenueTimeSeries(days);
    res.json({ days, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User registration time-series
router.get('/business/users/growth', async (req, res) => {
  try {
    const days = parseInt(req.query.days || 30);
    const data = await getUserGrowthTimeSeries(days);
    res.json({ days, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top selling listings
router.get('/business/listings/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || 10);
    const listings = await getTopSellingListings(limit);
    res.json({ limit, listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Historical business snapshots (hourly or daily)
router.get('/business/snapshots', async (req, res) => {
  try {
    const days = parseInt(req.query.days || 7);
    const period = req.query.period || 'hourly';
    const data = await getSnapshotHistory(days, period);
    res.json({ days, period, count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
