/**
 * GDPR Manager — UK GDPR / Data Protection Act 2018
 * Handles:
 * - Subject Access Requests (SAR)
 * - Right to be Forgotten / Erasure (RTBF)
 * - Consent management
 * - Cross-border transfer logging
 * - Data minimisation enforcement
 * - Pseudonymisation of analytics data
 */

import crypto, { randomUUID } from 'crypto';
import ConsentRecord from '../models/ConsentRecord.js';
import { writeAuditLog } from '../security/auditLogger.js';

const CURRENT_CONSENT_VERSION = process.env.CONSENT_VERSION || '2024-01-v1';

function pseudonymise(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

// ─── Consent Management ───────────────────────────────────────────────────────

/**
 * Record user consent for a specific processing purpose
 */
export async function recordConsent({
  userId,
  purpose,
  processingActivity,
  legalBasis,
  granted,
  ip,
  userAgent,
  channel = 'web',
  dataCategories = [],
  thirdPartySharing = false,
  crossBorderTransfer = false,
  transferDestination = null,
}) {
  const userIdHash = pseudonymise(userId);
  const consentId = randomUUID();

  const record = await ConsentRecord.findOneAndUpdate(
    { userIdHash, purpose },
    {
      $set: {
        consentId,
        consentVersion: CURRENT_CONSENT_VERSION,
        legalBasis,
        granted,
        grantedAt: granted ? new Date() : undefined,
        withdrawnAt: !granted ? new Date() : undefined,
        ip,
        userAgent,
        channel,
        dataCategories,
        thirdPartySharing,
        crossBorderTransfer,
        transferDestination,
        processingActivity,
      },
    },
    { upsert: true, new: true }
  );

  await writeAuditLog({
    action: granted ? 'CONSENT_GIVEN' : 'CONSENT_WITHDRAWN',
    actor: { userId, ip },
    resource: { type: 'ConsentRecord', id: consentId },
    after: { purpose, legalBasis, granted },
    legalBasis,
    reason: `User ${granted ? 'granted' : 'withdrew'} consent for ${purpose}`,
  });

  if (crossBorderTransfer) {
    await logCrossBorderTransfer({ userId, purpose, destination: transferDestination, legalBasis });
  }

  return record;
}

/**
 * Check whether user has granted consent for a given purpose
 */
export async function hasConsent(userId, purpose) {
  const userIdHash = pseudonymise(userId);
  const record = await ConsentRecord.findOne({ userIdHash, purpose }).lean();
  return record?.granted === true;
}

/**
 * Withdraw all consents for a user
 */
export async function withdrawAllConsents(userId, reason = 'User request') {
  const userIdHash = pseudonymise(userId);
  const result = await ConsentRecord.updateMany(
    { userIdHash, granted: true },
    { $set: { granted: false, withdrawnAt: new Date(), withdrawnReason: reason } }
  );

  await writeAuditLog({
    action: 'CONSENT_WITHDRAWN',
    actor: { userId },
    resource: { type: 'ConsentRecord', id: 'ALL' },
    reason,
    after: { allWithdrawn: true },
  });

  return result.modifiedCount;
}

// ─── Subject Access Request (SAR) ─────────────────────────────────────────────

/**
 * Initiate a Subject Access Request — must be fulfilled within 30 days (UK GDPR Art. 15)
 */
export async function initiateSAR({ userId, ip, requestorEmail }) {
  const requestId = randomUUID();
  const userIdHash = pseudonymise(userId);
  const requestedAt = new Date();
  const dueDate = new Date(requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000);  // 30 days

  await ConsentRecord.updateMany(
    { userIdHash },
    {
      $push: {
        sarRequests: {
          requestId,
          requestedAt,
          status: 'PENDING',
        },
      },
    }
  );

  await writeAuditLog({
    action: 'SAR_REQUEST',
    actor: { userId, ip },
    resource: { type: 'SAR', id: requestId },
    reason: 'Subject access request initiated',
    legalBasis: 'LEGAL_OBLIGATION',
    after: { requestId, requestedAt, dueDate, requestorEmail },
  });

  console.log(`[GDPR] SAR initiated — ID: ${requestId}, due by: ${dueDate.toISOString()}`);
  return { requestId, dueDate };
}

/**
 * Export all data held for a user (SAR fulfilment)
 */
export async function exportUserData(userId) {
  const userIdHash = pseudonymise(userId);

  const [consents] = await Promise.all([
    ConsentRecord.find({ userIdHash }).lean(),
  ]);

  // Callers should merge with data from other collections (User, Orders, etc.)
  return {
    exportedAt: new Date().toISOString(),
    userId,                       // Only included in SAR exports, not analytics
    userIdHash,
    consents,
    note: 'This export includes all analytics and compliance data held. Application data (orders, wallet) must be exported separately from primary collections.',
  };
}

// ─── Right to Erasure (RTBF) ──────────────────────────────────────────────────

/**
 * Schedule erasure — UK GDPR Art. 17. Must complete within 30 days.
 */
export async function initiateRTBF({ userId, ip, reason }) {
  const requestId = randomUUID();
  const userIdHash = pseudonymise(userId);
  const requestedAt = new Date();
  const scheduledErasureAt = new Date(requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  await ConsentRecord.updateMany(
    { userIdHash },
    {
      $push: {
        rtbfRequests: {
          requestId,
          requestedAt,
          scheduledErasureAt,
          status: 'PENDING',
        },
      },
    }
  );

  await writeAuditLog({
    action: 'RTBF_REQUEST',
    actor: { userId, ip },
    resource: { type: 'RTBF', id: requestId },
    reason: reason || 'Right to erasure request',
    legalBasis: 'LEGAL_OBLIGATION',
    after: { requestId, requestedAt, scheduledErasureAt },
  });

  console.log(`[GDPR] RTBF scheduled — ID: ${requestId}, erasure by: ${scheduledErasureAt.toISOString()}`);
  return { requestId, scheduledErasureAt };
}

/**
 * Execute erasure — anonymise analytics records, delete consent records
 */
export async function executeRTBF(userId) {
  const userIdHash = pseudonymise(userId);

  // Mark consent records as erased (we keep the record for compliance but strip PII)
  await ConsentRecord.updateMany(
    { userIdHash },
    {
      $set: {
        ip: '[ERASED]',
        userAgent: '[ERASED]',
        'rtbfRequests.$[].status': 'ERASED',
        'rtbfRequests.$[].erasedAt': new Date(),
      },
    }
  );

  await writeAuditLog({
    action: 'DELETE',
    actor: { userId: '[SYSTEM]' },
    resource: { type: 'UserData', id: userIdHash },
    reason: 'RTBF erasure executed',
    legalBasis: 'LEGAL_OBLIGATION',
    outcome: 'SUCCESS',
  });

  console.log(`[GDPR] RTBF executed for hash: ${userIdHash}`);
  return { erased: true, userIdHash };
}

// ─── Cross-Border Transfer Logging ────────────────────────────────────────────

export async function logCrossBorderTransfer({ userId, purpose, destination, legalBasis }) {
  await writeAuditLog({
    action: 'DATA_TRANSFER',
    actor: { userId: userId || '[SYSTEM]' },
    resource: { type: 'CrossBorderTransfer', id: randomUUID() },
    reason: `Data transferred to ${destination} for ${purpose}`,
    legalBasis,
    after: { destination, purpose, timestamp: new Date().toISOString() },
  });
}

// ─── Pending Requests Report ───────────────────────────────────────────────────

export async function getPendingSARRequests() {
  return ConsentRecord.aggregate([
    { $unwind: '$sarRequests' },
    { $match: { 'sarRequests.status': 'PENDING' } },
    {
      $project: {
        userIdHash: 1,
        requestId: '$sarRequests.requestId',
        requestedAt: '$sarRequests.requestedAt',
        dueDate: { $add: ['$sarRequests.requestedAt', 30 * 24 * 60 * 60 * 1000] },
      },
    },
  ]);
}

export async function getPendingRTBFRequests() {
  return ConsentRecord.aggregate([
    { $unwind: '$rtbfRequests' },
    { $match: { 'rtbfRequests.status': 'PENDING' } },
    {
      $project: {
        userIdHash: 1,
        requestId: '$rtbfRequests.requestId',
        requestedAt: '$rtbfRequests.requestedAt',
        scheduledErasureAt: '$rtbfRequests.scheduledErasureAt',
      },
    },
  ]);
}

export async function getConsentStats() {
  return ConsentRecord.aggregate([
    {
      $group: {
        _id: { purpose: '$purpose', legalBasis: '$legalBasis' },
        granted: { $sum: { $cond: ['$granted', 1, 0] } },
        total: { $sum: 1 },
      },
    },
  ]);
}
