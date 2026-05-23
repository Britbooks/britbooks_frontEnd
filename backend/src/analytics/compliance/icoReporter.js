/**
 * ICO Reporter
 * Generates UK ICO-compliant reports:
 * - GDPR Audit Report (CSV + JSON)
 * - ICO Data Breach Report (pre-filled template)
 * - ROPA export
 * - Consent summary
 * - Retention compliance report
 * - Subject Access Request log
 *
 * PDF generation uses PDFKit (already in project dependencies).
 */

import PDFDocument from 'pdfkit';
import { stringify as csvStringify } from 'csv-stringify/sync';
import { randomUUID } from 'crypto';
import AuditLog from '../models/AuditLog.js';
import ConsentRecord from '../models/ConsentRecord.js';
import { getAllROPAActivities } from './ropaLogger.js';
import { writeAuditLog } from '../security/auditLogger.js';

const ORG_NAME = process.env.ICO_ORG_NAME || 'BritBooks Ltd';
const ICO_NUMBER = process.env.ICO_REGISTRATION_NUMBER || 'ZxxxxxxX';
const DPO_EMAIL = process.env.DPO_EMAIL || process.env.ALERT_EMAIL || 'dpo@britbooks.co.uk';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date) {
  if (!date) return 'N/A';
  return `${new Date(date).toISOString().replace('T', ' ').slice(0, 19)  } UTC`;
}

function buildReportHeader(title) {
  return {
    reportId: randomUUID(),
    title,
    generatedAt: new Date().toISOString(),
    organisation: ORG_NAME,
    icoRegistrationNumber: ICO_NUMBER,
    dpoContact: DPO_EMAIL,
    environment: process.env.NODE_ENV || 'production',
  };
}

// ─── Audit Report (JSON + CSV) ────────────────────────────────────────────────

export async function generateAuditReport({ fromDate, toDate, format = 'json', requestedBy }) {
  const header = buildReportHeader('UK GDPR Audit Report');

  const logs = await AuditLog.find({
    timestamp: { $gte: fromDate, $lte: toDate },
  }).sort({ timestamp: -1 }).limit(10000).lean();

  const rows = logs.map(l => ({
    logId: l.logId,
    timestamp: formatDate(l.timestamp),
    action: l.action,
    actorRole: l.actor?.role || 'N/A',
    actorUserIdHash: l.actor?.userIdHash || 'N/A',
    actorIp: l.actor?.ip || 'N/A',
    resourceType: l.resource?.type || 'N/A',
    resourceId: l.resource?.id || 'N/A',
    outcome: l.outcome,
    legalBasis: l.legalBasis || 'N/A',
    reason: l.reason || 'N/A',
    environment: l.environment,
    gitSha: l.gitSha || 'N/A',
  }));

  await writeAuditLog({
    action: 'EXPORT',
    actor: { userId: requestedBy || '[SYSTEM]', role: 'admin' },
    resource: { type: 'AuditReport', id: header.reportId },
    reason: 'ICO audit report export',
    legalBasis: 'LEGAL_OBLIGATION',
    after: { format, fromDate, toDate, rowCount: rows.length },
  });

  if (format === 'csv') {
    const csv = csvStringify(rows, { header: true });
    return { header, csv, rowCount: rows.length };
  }

  return { header, data: rows, rowCount: rows.length };
}

// ─── ICO Data Breach Report ───────────────────────────────────────────────────

export async function generateBreachReport({
  breachDiscoveredAt,
  breachOccurredAt,
  description,
  affectedDataSubjects,
  dataCategories,
  potentialConsequences,
  measuresTaken,
  reportedBy,
}) {
  const header = buildReportHeader('ICO Personal Data Breach Report');

  // ICO requires breach notification within 72 hours
  const discoveredDate = new Date(breachDiscoveredAt || Date.now());
  const icoDeadline = new Date(discoveredDate.getTime() + 72 * 60 * 60 * 1000);

  const report = {
    ...header,

    // Section 1: Controller Details
    controller: {
      name: ORG_NAME,
      icoRegistrationNumber: ICO_NUMBER,
      address: process.env.CONTROLLER_ADDRESS || 'United Kingdom',
      dpoName: process.env.DPO_NAME || 'Data Protection Officer',
      dpoEmail: DPO_EMAIL,
      dpoPhone: process.env.DPO_PHONE || 'N/A',
    },

    // Section 2: Breach Details
    breach: {
      referenceNumber: header.reportId,
      discoveredAt: formatDate(breachDiscoveredAt),
      occurredAt: formatDate(breachOccurredAt),
      icoNotificationDeadline: formatDate(icoDeadline),
      type: 'Security/Data breach',
      description: description || '[TO BE COMPLETED]',
    },

    // Section 3: Affected Data
    affectedData: {
      estimatedDataSubjects: affectedDataSubjects || 0,
      dataCategories: dataCategories || ['[TO BE COMPLETED]'],
      specialCategoryData: false,
      affectedSystems: '[TO BE COMPLETED]',
    },

    // Section 4: Consequences & Measures
    riskAssessment: {
      potentialConsequences: potentialConsequences || '[TO BE COMPLETED]',
      likelihood: '[TO BE ASSESSED: Low/Medium/High]',
      severity: '[TO BE ASSESSED: Low/Medium/High]',
    },

    remediation: {
      measuresTaken: measuresTaken || '[TO BE COMPLETED]',
      notifiedDataSubjects: false,
      notificationMethod: '[TO BE COMPLETED]',
    },

    // Section 5: Submission
    submission: {
      reportedBy: reportedBy || '[NAME]',
      submittedAt: null,
      icoReference: null,
      notes: 'This report must be submitted to ICO within 72 hours of discovery at: https://ico.org.uk/for-organisations/report-a-breach/',
    },
  };

  await writeAuditLog({
    action: 'OTHER',
    actor: { userId: reportedBy || '[SYSTEM]', role: 'admin' },
    resource: { type: 'BreachReport', id: header.reportId },
    reason: 'Data breach report generated',
    legalBasis: 'LEGAL_OBLIGATION',
    outcome: 'SUCCESS',
  });

  return report;
}

// ─── PDF Audit Report ─────────────────────────────────────────────────────────

export function generateAuditReportPDF(reportData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { header, data = [] } = reportData;

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('UK GDPR Audit Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(`Organisation: ${header.organisation}`, { align: 'center' });
    doc.text(`ICO Number: ${header.icoRegistrationNumber}`, { align: 'center' });
    doc.text(`Generated: ${formatDate(header.generatedAt)}`, { align: 'center' });
    doc.text(`Report ID: ${header.reportId}`, { align: 'center' });
    doc.moveDown(1);

    // Summary
    doc.fontSize(14).font('Helvetica-Bold').text('Summary');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total audit entries: ${data.length}`);
    doc.text(`Environment: ${header.environment}`);
    doc.text(`DPO Contact: ${header.dpoContact}`);
    doc.moveDown(1);

    // Sample entries (first 50 to keep PDF manageable)
    doc.fontSize(14).font('Helvetica-Bold').text('Audit Log Entries (first 50)');
    doc.moveDown(0.3);

    const sample = data.slice(0, 50);
    for (const entry of sample) {
      doc.fontSize(9).font('Helvetica-Bold').text(
        `[${entry.timestamp}] ${entry.action} — ${entry.resourceType}/${entry.resourceId}`,
        { continued: false }
      );
      doc.fontSize(8).font('Helvetica').text(
        `  Actor: ${entry.actorRole} (${entry.actorUserIdHash.slice(0, 8)}...) | IP: ${entry.actorIp} | Outcome: ${entry.outcome} | Legal Basis: ${entry.legalBasis}`
      );
      if (entry.reason && entry.reason !== 'N/A') {
        doc.fontSize(8).text(`  Reason: ${entry.reason}`);
      }
      doc.moveDown(0.2);
    }

    if (data.length > 50) {
      doc.moveDown(0.5).fontSize(10).font('Helvetica-Oblique')
        .text(`[Full dataset contains ${data.length} entries — see CSV export for complete records]`);
    }

    // Footer
    doc.fontSize(8).font('Helvetica').text(
      `This document is classified as CONFIDENTIAL. ICO Registration: ${header.icoRegistrationNumber}`,
      50, doc.page.height - 60,
      { align: 'center' }
    );

    doc.end();
  });
}

// ─── ROPA PDF Report ──────────────────────────────────────────────────────────

export async function generateROPAReport(format = 'json') {
  const header = buildReportHeader('Record of Processing Activities (ROPA)');
  const activities = await getAllROPAActivities();

  if (format === 'json') {
    return { header, activities };
  }

  if (format === 'csv') {
    const rows = activities.map(a => ({
      activityId: a.activityId,
      name: a.name,
      purposes: a.purposes?.join('; '),
      legalBasis: a.legalBasis,
      dataCategories: a.dataCategories?.join('; '),
      dataSubjects: a.dataSubjects?.join('; '),
      retentionPeriod: a.retentionPeriod,
      dpiaRequired: a.dpiaRequired,
      status: a.status,
    }));
    return { header, csv: csvStringify(rows, { header: true }) };
  }

  return { header, activities };
}

// ─── Consent Summary ──────────────────────────────────────────────────────────

export async function generateConsentReport() {
  const header = buildReportHeader('Consent Summary Report');
  const stats = await ConsentRecord.aggregate([
    {
      $group: {
        _id: { purpose: '$purpose', legalBasis: '$legalBasis' },
        granted: { $sum: { $cond: ['$granted', 1, 0] } },
        withdrawn: { $sum: { $cond: ['$granted', 0, 1] } },
        total: { $sum: 1 },
        sarPending: { $sum: { $size: { $filter: { input: { $ifNull: ['$sarRequests', []] }, cond: { $eq: ['$$this.status', 'PENDING'] } } } } },
        rtbfPending: { $sum: { $size: { $filter: { input: { $ifNull: ['$rtbfRequests', []] }, cond: { $eq: ['$$this.status', 'PENDING'] } } } } },
      },
    },
    { $sort: { '_id.purpose': 1 } },
  ]);

  return { header, data: stats };
}
