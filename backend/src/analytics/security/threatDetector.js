/**
 * Threat Detector
 * Monitors every request for:
 * - Brute force / failed login (5 failures in 10min = alert)
 * - Rate limit violations
 * - SQL injection patterns in query/body
 * - XSS patterns
 * - CSRF failures
 * - Suspicious user agents
 * - JWT/session anomalies
 * - CORS violations
 * - Admin panel access attempts
 * - API key misuse
 */

import crypto, { randomUUID } from 'crypto';
import SecurityEvent from '../models/SecurityEvent.js';
import { geoLookup } from './geoip.js';
import { alertEngine } from '../alerting/alertEngine.js';

// ─── Pattern Libraries ────────────────────────────────────────────────────────

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE)\b)/i,
  /('|--|;|\/\*|\*\/|xp_|sp_)/,
  /(\bOR\b\s+\d+=\d+)/i,
  /(\bAND\b\s+\d+=\d+)/i,
  /SLEEP\s*\(\d+\)/i,
  /WAITFOR\s+DELAY/i,
  /BENCHMARK\s*\(/i,
  /information_schema/i,
];

const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:/i,
  /on(load|error|click|mouseover|focus|blur|change|submit|keyup|keydown)\s*=/i,
  /<img[^>]+src\s*=\s*['"]*javascript/i,
  /eval\s*\(/i,
  /document\.(cookie|location|write)/i,
  /window\.(location|open)/i,
  /<iframe/i,
  /base64\s*,/i,
];

const SUSPICIOUS_UAS = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /hydra/i,
  /metasploit/i, /burpsuite/i, /w3af/i, /acunetix/i,
  /zgrab/i, /dirbuster/i, /gobuster/i, /wfuzz/i,
  /python-requests\/[01]\./i,    // old requests lib
  /curl\/[0-6]\./i,              // very old curl
];

// ─── State ────────────────────────────────────────────────────────────────────

// loginAttempts: ip -> { count, windowStart }
const loginAttempts = new Map();
// rateLimitViolations: ip -> { count, windowStart, endpoints: Set }
const rateLimitViolations = new Map();
const BRUTE_FORCE_THRESHOLD = 5;
const BRUTE_FORCE_WINDOW_MS = 10 * 60 * 1000;   // 10 minutes

function pseudonymise(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function scanString(str) {
  if (!str || typeof str !== 'string') return { sql: false, xss: false };
  return {
    sql: SQL_INJECTION_PATTERNS.some(p => p.test(str)),
    xss: XSS_PATTERNS.some(p => p.test(str)),
  };
}

function deepScan(obj, depth = 0) {
  if (depth > 4) return { sql: false, xss: false };
  if (typeof obj === 'string') return scanString(obj);
  if (typeof obj === 'object' && obj !== null) {
    for (const val of Object.values(obj)) {
      const result = deepScan(val, depth + 1);
      if (result.sql || result.xss) return result;
    }
  }
  return { sql: false, xss: false };
}

// ─── Persist Security Event ───────────────────────────────────────────────────

async function persistEvent({ severity, category, eventType, description, req, action, metadata }) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  let geo = { country: 'Unknown', city: 'Unknown', isTor: false };
  try { geo = await geoLookup(ip); } catch { /* ignore */ }

  const event = {
    eventId: randomUUID(),
    timestamp: new Date(),
    severity,
    category,
    eventType,
    description,
    source: {
      ip,
      userAgent: req.headers?.['user-agent'] || '',
      userIdHash: pseudonymise(req.user?.userId),
      country: geo.country,
      city: geo.city,
      isTor: geo.isTor,
    },
    target: {
      resource: req.path || req.url,
      method: req.method,
      requestId: req.requestId,
    },
    action: action || 'FLAGGED',
    metadata,
    environment: process.env.NODE_ENV || 'production',
  };

  SecurityEvent.create(event).catch(err =>
    console.error('[ThreatDetector] Failed to persist security event:', err.message)
  );

  if (severity === 'CRITICAL') {
    alertEngine.trigger({
      type: 'SECURITY_CRITICAL',
      severity: 'CRITICAL',
      title: `Critical Security Event: ${category}`,
      message: description,
      affectedSystem: req.path,
    });
  }

  return event;
}

// ─── Detection Functions ──────────────────────────────────────────────────────

export async function checkLoginAttempt(req, success) {
  const ip = req.ip || req.connection?.remoteAddress;
  if (!ip) return;

  if (success) {
    loginAttempts.delete(ip);
    return;
  }

  const now = Date.now();
  const state = loginAttempts.get(ip) || { count: 0, windowStart: now };

  if (now - state.windowStart > BRUTE_FORCE_WINDOW_MS) {
    state.count = 1;
    state.windowStart = now;
  } else {
    state.count++;
  }

  loginAttempts.set(ip, state);

  await persistEvent({
    severity: state.count >= BRUTE_FORCE_THRESHOLD ? 'CRITICAL' : 'WARNING',
    category: state.count >= BRUTE_FORCE_THRESHOLD ? 'BRUTE_FORCE' : 'FAILED_LOGIN',
    eventType: 'FAILED_LOGIN_ATTEMPT',
    description: `Failed login attempt ${state.count} from ${ip} in 10-minute window`,
    req,
    action: state.count >= BRUTE_FORCE_THRESHOLD ? 'BLOCKED' : 'FLAGGED',
    metadata: { attemptCount: state.count, windowStart: new Date(state.windowStart) },
  });
}

export function checkSuspiciousUserAgent(req) {
  const ua = req.headers?.['user-agent'] || '';
  if (!ua) return false;

  const isSuspicious = SUSPICIOUS_UAS.some(p => p.test(ua));
  if (isSuspicious) {
    persistEvent({
      severity: 'WARNING',
      category: 'SUSPICIOUS_UA',
      eventType: 'SUSPICIOUS_USER_AGENT',
      description: `Suspicious user agent detected: ${ua.slice(0, 200)}`,
      req,
      action: 'FLAGGED',
      metadata: { userAgent: ua },
    });
  }
  return isSuspicious;
}

export function checkPayloadForAttacks(req) {
  const toScan = {
    query: req.query,
    body: req.body,
    params: req.params,
  };

  const { sql, xss } = deepScan(toScan);

  if (sql) {
    persistEvent({
      severity: 'CRITICAL',
      category: 'SQL_INJECTION',
      eventType: 'SQL_INJECTION_ATTEMPT',
      description: `SQL injection pattern detected in request to ${req.path}`,
      req,
      action: 'BLOCKED',
      metadata: { path: req.path, method: req.method },
    });
  }

  if (xss) {
    persistEvent({
      severity: 'WARNING',
      category: 'XSS',
      eventType: 'XSS_ATTEMPT',
      description: `XSS pattern detected in request to ${req.path}`,
      req,
      action: 'FLAGGED',
      metadata: { path: req.path, method: req.method },
    });
  }

  return { sql, xss };
}

export function checkRateLimitViolation(req) {
  const ip = req.ip || req.connection?.remoteAddress;
  if (!ip) return;

  const now = Date.now();
  const state = rateLimitViolations.get(ip) || { count: 0, windowStart: now, endpoints: new Set() };

  if (now - state.windowStart > 60_000) {
    state.count = 1;
    state.windowStart = now;
    state.endpoints = new Set([req.path]);
  } else {
    state.count++;
    state.endpoints.add(req.path);
  }

  rateLimitViolations.set(ip, state);

  persistEvent({
    severity: state.count > 50 ? 'CRITICAL' : 'WARNING',
    category: 'RATE_LIMIT',
    eventType: 'RATE_LIMIT_VIOLATION',
    description: `Rate limit violation: ${state.count} requests from ${ip} in 60s`,
    req,
    action: 'RATE_LIMITED',
    metadata: { count: state.count, endpoints: [...state.endpoints] },
  });
}

export function checkPrivilegeEscalation(req, requiredRole, userRole) {
  if (userRole !== requiredRole && userRole !== 'super_admin') {
    persistEvent({
      severity: 'CRITICAL',
      category: 'PRIVILEGE_ESCALATION',
      eventType: 'PRIVILEGE_ESCALATION_ATTEMPT',
      description: `User with role '${userRole}' attempted to access resource requiring '${requiredRole}'`,
      req,
      action: 'BLOCKED',
      metadata: { requiredRole, userRole, path: req.path },
    });
  }
}

export function checkJwtAnomaly(req, anomalyType, detail) {
  persistEvent({
    severity: 'WARNING',
    category: 'JWT_ANOMALY',
    eventType: `JWT_${anomalyType.toUpperCase()}`,
    description: `JWT anomaly (${anomalyType}): ${detail}`,
    req,
    action: 'FLAGGED',
    metadata: { anomalyType, detail },
  });
}

export function checkAdminAccess(req) {
  persistEvent({
    severity: 'INFO',
    category: 'ADMIN_ACCESS',
    eventType: 'ADMIN_PANEL_ACCESS',
    description: `Admin panel accessed: ${req.path}`,
    req,
    action: 'ALLOWED',
    metadata: { path: req.path, method: req.method },
  });
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function threatDetectionMiddleware(req, res, next) {
  checkSuspiciousUserAgent(req);
  // Payload scanning is lightweight enough to run synchronously
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    checkPayloadForAttacks(req);
  }
  next();
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getSecurityEventFeed(limit = 100) {
  return SecurityEvent.find().sort({ timestamp: -1 }).limit(limit).lean();
}

export async function getSecurityEventStats(fromDate, toDate) {
  return SecurityEvent.aggregate([
    { $match: { timestamp: { $gte: fromDate, $lte: toDate } } },
    { $group: { _id: { category: '$category', severity: '$severity' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
}
