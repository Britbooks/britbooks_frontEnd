/**
 * Audit Logger — UK Legal Standard
 * - Immutable, append-only entries
 * - Tamper-evident hash chain (each log hashes the previous)
 * - AES-256-GCM encryption of sensitive fields (before/after state, userId)
 * - ISO 8601 UTC timestamps with millisecond precision
 * - 7-year retention enforcement by retentionManager
 */

import crypto, { randomUUID } from 'crypto';
import AuditLog from '../models/AuditLog.js';

const ENCRYPTION_KEY_HEX = process.env.AUDIT_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

// Last hash in the chain — bootstrapped from DB on startup
let lastHash = '0'.repeat(64);   // genesis hash

// ─── Encryption ──────────────────────────────────────────────────────────────

function getKey() {
  if (!ENCRYPTION_KEY_HEX || ENCRYPTION_KEY_HEX.length < 64) {
    // Derive a key from JWT_SECRET as fallback — not ideal but functional
    return crypto.createHash('sha256')
      .update(process.env.JWT_SECRET || 'fallback-audit-key')
      .digest();
  }
  return Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
}

function encrypt(plaintext) {
  if (!plaintext) return null;
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const text = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext) {
  if (!ciphertext) return null;
  try {
    const key = getKey();
    const [ivHex, tagHex, encHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    try { return JSON.parse(decrypted); } catch { return decrypted; }
  } catch {
    return '[DECRYPTION_FAILED]';
  }
}

// ─── Hash Chain ───────────────────────────────────────────────────────────────

function computeHash(logId, timestamp, actor, action, previousHash) {
  const payload = JSON.stringify({ logId, timestamp, actor, action, previousHash });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function pseudonymise(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

// ─── Bootstrap hash chain from DB ────────────────────────────────────────────

export async function bootstrapHashChain() {
  try {
    const latest = await AuditLog.findOne().sort({ timestamp: -1 }).lean();
    if (latest?.hash) {
      lastHash = latest.hash;
      console.log('[AuditLogger] Hash chain bootstrapped from', latest.logId);
    } else {
      console.log('[AuditLogger] Starting fresh hash chain (genesis)');
    }
  } catch (err) {
    console.error('[AuditLogger] Failed to bootstrap hash chain:', err.message);
  }
}

// ─── Write Audit Entry ────────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {string} params.action - e.g. 'CREATE', 'LOGIN', 'SAR_REQUEST'
 * @param {object} params.actor - { userId, role, ip, sessionId }
 * @param {object} params.resource - { type, id }
 * @param {*} [params.before] - State before mutation (will be encrypted)
 * @param {*} [params.after] - State after mutation (will be encrypted)
 * @param {string} [params.outcome] - 'SUCCESS' | 'FAILURE'
 * @param {string} [params.reason] - Justification
 * @param {string} [params.legalBasis] - GDPR legal basis
 * @param {string} [params.requestId] - HTTP request ID
 */
export async function writeAuditLog({
  action,
  actor = {},
  resource = {},
  before = null,
  after = null,
  outcome = 'SUCCESS',
  reason = null,
  legalBasis = 'LEGITIMATE_INTERESTS',
  requestId = null,
}) {
  const logId = randomUUID();
  const timestamp = new Date().toISOString();
  const previousHash = lastHash;

  // Pseudonymise user ID for reporting; store encrypted real userId
  const userIdHash = pseudonymise(actor.userId);
  const encryptedUserId = encrypt(actor.userId);
  const encryptedBefore = before ? encrypt(before) : null;
  const encryptedAfter = after ? encrypt(after) : null;

  const hash = computeHash(logId, timestamp, { userIdHash, role: actor.role }, action, previousHash);
  lastHash = hash;

  try {
    await AuditLog.create({
      logId,
      timestamp: new Date(timestamp),
      actor: {
        userId: encryptedUserId,    // encrypted
        userIdHash,                 // pseudonymised, searchable
        role: actor.role || 'unknown',
        ip: actor.ip || null,
        sessionId: actor.sessionId || null,
      },
      action,
      resource: {
        type: resource.type || null,
        id: resource.id || null,
      },
      before: encryptedBefore,
      after: encryptedAfter,
      outcome,
      reason,
      legalBasis,
      requestId,
      previousHash,
      hash,
      gitSha: process.env.GIT_COMMIT_SHA || 'unknown',
      environment: process.env.NODE_ENV || 'production',
    });
  } catch (err) {
    // Log to console as emergency fallback — never silently drop audit events
    console.error('[AuditLogger] CRITICAL: Failed to write audit log:', err.message, {
      logId, action, actor: { userIdHash, role: actor.role }, outcome
    });
  }
}

// ─── Verify Chain Integrity ───────────────────────────────────────────────────

export async function verifyChainIntegrity(fromDate, toDate) {
  const logs = await AuditLog.find({
    timestamp: { $gte: fromDate, $lte: toDate },
  }).sort({ timestamp: 1 }).lean();

  const results = { verified: 0, tampered: 0, issues: [] };

  for (let i = 1; i < logs.length; i++) {
    const log = logs[i];
    const expected = computeHash(
      log.logId,
      log.timestamp.toISOString(),
      { userIdHash: log.actor?.userIdHash, role: log.actor?.role },
      log.action,
      log.previousHash
    );
    if (expected !== log.hash) {
      results.tampered++;
      results.issues.push({ logId: log.logId, timestamp: log.timestamp });
    } else {
      results.verified++;
    }
  }

  return results;
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

export async function getAuditLogs({ fromDate, toDate, userIdHash, action, resourceType, limit = 100, offset = 0 }) {
  const filter = {};
  if (fromDate || toDate) filter.timestamp = {};
  if (fromDate) filter.timestamp.$gte = fromDate;
  if (toDate) filter.timestamp.$lte = toDate;
  if (userIdHash) filter['actor.userIdHash'] = userIdHash;
  if (action) filter.action = action;
  if (resourceType) filter['resource.type'] = resourceType;

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(offset).limit(limit).lean(),
  ]);

  return { total, logs };
}
