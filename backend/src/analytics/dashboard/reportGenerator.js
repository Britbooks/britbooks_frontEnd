/**
 * Report Generator
 * Additional report helpers not covered by icoReporter:
 * - Vulnerability / dependency report (npm audit)
 * - Uptime percentage summary
 * - System health summary PDF
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import PDFDocument from 'pdfkit';

const execAsync = promisify(exec);

// ─── NPM Audit / Dependency Report ───────────────────────────────────────────

export async function runDependencyAudit() {
  try {
    const { stdout } = await execAsync('npm audit --json', {
      cwd: process.cwd(),
      timeout: 30000,
    });
    const auditData = JSON.parse(stdout);

    return {
      generatedAt: new Date().toISOString(),
      vulnerabilities: auditData.vulnerabilities || {},
      metadata: auditData.metadata || {},
      summary: {
        total: auditData.metadata?.vulnerabilities?.total || 0,
        critical: auditData.metadata?.vulnerabilities?.critical || 0,
        high: auditData.metadata?.vulnerabilities?.high || 0,
        moderate: auditData.metadata?.vulnerabilities?.moderate || 0,
        low: auditData.metadata?.vulnerabilities?.low || 0,
        info: auditData.metadata?.vulnerabilities?.info || 0,
      },
      gdprConcerns: extractGDPRConcerns(auditData.vulnerabilities || {}),
    };
  } catch (err) {
    // npm audit exits with code 1 when vulnerabilities found — parse stdout anyway
    if (err.stdout) {
      try {
        const auditData = JSON.parse(err.stdout);
        return {
          generatedAt: new Date().toISOString(),
          vulnerabilities: auditData.vulnerabilities || {},
          metadata: auditData.metadata || {},
          summary: auditData.metadata?.vulnerabilities || {},
          gdprConcerns: extractGDPRConcerns(auditData.vulnerabilities || {}),
        };
      } catch { /* fall through */ }
    }
    return { generatedAt: new Date().toISOString(), error: err.message, summary: {} };
  }
}

function extractGDPRConcerns(vulnerabilities) {
  // Flag any vulnerability that could lead to data exposure
  const dataExposureKeywords = ['sql injection', 'xss', 'csrf', 'auth', 'session', 'token', 'credentials', 'exposure'];
  const concerns = [];

  for (const [pkg, vuln] of Object.entries(vulnerabilities)) {
    const title = (vuln.via?.[0]?.title || '').toLowerCase();
    if (dataExposureKeywords.some(k => title.includes(k))) {
      concerns.push({
        package: pkg,
        severity: vuln.severity,
        title: vuln.via?.[0]?.title,
        url: vuln.via?.[0]?.url,
        gdprRisk: 'Potential data exposure — review urgently',
      });
    }
  }

  return concerns;
}

// ─── System Health Summary PDF ────────────────────────────────────────────────

export async function generateSystemHealthPDF(healthData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const now = new Date().toISOString();

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('System Health Report', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text(`BritBooks API | Generated: ${now}`, { align: 'center' });
    doc.moveDown(1);

    // System Section
    const sys = healthData.system || {};
    doc.fontSize(14).font('Helvetica-Bold').text('System Metrics');
    doc.fontSize(10).font('Helvetica');
    doc.text(`CPU Usage: ${sys.cpu ?? 'N/A'}%`);
    doc.text(`Memory Usage: ${sys.memoryPercent ?? 'N/A'}%`);
    doc.text(`Uptime: ${sys.uptime ? `${Math.floor(sys.uptime / 3600)  } hours` : 'N/A'}`);
    if (sys.loadAvg) {
      doc.text(`Load Average: ${sys.loadAvg.oneMin}m / ${sys.loadAvg.fiveMin}m / ${sys.loadAvg.fifteenMin}m`);
    }
    doc.moveDown(0.8);

    // Performance Section
    const perf = healthData.performance || {};
    doc.fontSize(14).font('Helvetica-Bold').text('Node.js Performance');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Event Loop Lag: ${perf.eventLoopLagMs ?? 'N/A'} ms`);
    if (perf.heapSummary) {
      doc.text(`Heap Used: ${perf.heapSummary.usedMB} MB / ${perf.heapSummary.limitMB} MB (${perf.heapSummary.usagePercent}%)`);
    }
    doc.moveDown(0.8);

    // Database
    const db = healthData.database || {};
    doc.fontSize(14).font('Helvetica-Bold').text('Database');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Status: ${db.status ?? 'N/A'}`);
    doc.text(`Host: ${db.host ?? 'N/A'}`);
    doc.text(`Slow Queries in Buffer: ${db.slowQueriesInBuffer ?? 0}`);
    doc.moveDown(0.8);

    // Alerts
    doc.fontSize(14).font('Helvetica-Bold').text('Open Alerts');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Open Alerts: ${healthData.openAlerts ?? 0}`);
    doc.moveDown(1);

    // Footer
    doc.fontSize(8).font('Helvetica').text(
      `CONFIDENTIAL — BritBooks Internal | ICO: ${process.env.ICO_REGISTRATION_NUMBER || 'ZxxxxxxX'}`,
      50, doc.page.height - 60,
      { align: 'center' }
    );

    doc.end();
  });
}

// ─── Uptime Summary ───────────────────────────────────────────────────────────

export function getUptimeSummary() {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  return {
    uptimeSeconds,
    formatted: `${hours}h ${minutes}m`,
    startedAt: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid,
    environment: process.env.NODE_ENV || 'production',
  };
}
