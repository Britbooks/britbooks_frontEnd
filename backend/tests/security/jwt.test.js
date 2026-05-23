/**
 * SECURITY — JWT / Token Attack Tests
 *
 * Tests classic JWT attacks: algorithm confusion, forged payloads,
 * expired tokens, privilege escalation via token claims.
 */
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// In-memory Redis store for blacklisting tests
const mockStore = new Map();
vi.mock('../../src/lib/config/redisClient.js', () => ({
  default: {
    get: vi.fn(key => Promise.resolve(mockStore.get(key) ?? null)),
    set: vi.fn((key, value) => { mockStore.set(key, value); return Promise.resolve('OK'); }),
    del: vi.fn(key => { mockStore.delete(key); return Promise.resolve(1); }),
    on: vi.fn(),
  },
}));

vi.mock('../../src/app/services/walletservice.js', () => ({
  createWallet: vi.fn().mockResolvedValue({ _id: 'w1' }),
  getWalletByUserId: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../src/app/services/nexcessService.js', () => ({
  sendEmailVerificationLink: vi.fn().mockResolvedValue({ success: true }),
  checkEmailVerificationCode: vi.fn().mockResolvedValue({ valid: true }),
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { connectTestDB, disconnectTestDB, clearDB } from '../setup/db.js';
import { createTestApp } from '../setup/createApp.js';
import { createTestUser, generateTestToken } from '../setup/helpers.js';

let app;
const JWT_SECRET = 'security-jwt-test-secret';

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.REDIS_URL = 'redis://localhost:6379';
  await connectTestDB();
  app = createTestApp();
});

afterAll(disconnectTestDB);
beforeEach(() => { clearDB(); mockStore.clear(); });

// ══════════════════════════════════════════════════════════════════════════════
// Algorithm confusion attacks
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] JWT Algorithm Confusion', () => {
  it('rejects alg:none token (unsigned JWT)', async () => {
    const user = await createTestUser();
    const payload = { userId: user._id.toString(), role: 'user' };

    // Craft an "alg: none" token — no signature required
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
    const noneToken = `${header}.${body}.`; // empty signature

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${noneToken}`);

    expect(res.status).toBe(401);
  });

  it('rejects token with mismatched algorithm header (RS256 claimed, HS256 signed)', async () => {
    // Manually craft a JWT that claims RS256 in the header but is signed with HMAC.
    // The server uses HS256 — any token claiming a different alg should be rejected.
    const user = await createTestUser();
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      userId: user._id.toString(),
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
    })).toString('base64url');
    // Sign with HS256 using server secret — produces a valid HMAC sig but for wrong alg claim
    const hmacToken = jwt.sign({ userId: user._id.toString(), role: 'admin' }, JWT_SECRET, { algorithm: 'HS256' });
    const [, , realSig] = hmacToken.split('.');
    const forged = `${header}.${payload}.${realSig}`;

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Expired tokens
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] Expired Token Rejection', () => {
  it('rejects expired tokens on protected routes', async () => {
    const user = await createTestUser();
    const expired = jwt.sign(
      { userId: user._id.toString(), role: 'user' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });

  it('rejects expired tokens on admin-only routes', async () => {
    const admin = await createTestUser({ role: 'admin' });
    const expired = jwt.sign(
      { userId: admin._id.toString(), role: 'admin' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .post('/api/chat/resolve')
      .set('Authorization', `Bearer ${expired}`)
      .send({ chatId: 'abc' });

    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Privilege escalation via token claim manipulation
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] Privilege Escalation via Token Claims', () => {
  it('forged admin role in token is rejected (different secret)', async () => {
    const user = await createTestUser({ role: 'user' });

    // Attacker forges a token claiming admin role using a different secret
    const forged = jwt.sign(
      { userId: user._id.toString(), role: 'admin' },
      'attackers-secret'
    );

    const res = await request(app)
      .post('/api/chat/resolve')
      .set('Authorization', `Bearer ${forged}`)
      .send({ chatId: 'abc' });

    expect(res.status).toBe(401);
  });

  it('token with valid signature but wrong userId still results in 404/403', async () => {
    // Valid token but points to non-existent user
    const token = jwt.sign(
      { userId: '64a0000000000000000000ff', role: 'admin' },
      JWT_SECRET
    );

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    // Must not return 200 — user doesn't exist
    expect([401, 403, 404]).toContain(res.status);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Malformed token handling
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] Malformed Token Handling', () => {
  const protectedRoute = () => request(app).get('/api/orders');

  it('rejects missing Authorization header', async () => {
    const res = await protectedRoute();
    expect(res.status).toBe(401);
  });

  it('rejects "Bearer " with no token value', async () => {
    const res = await protectedRoute().set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });

  it('rejects token without "Bearer " prefix', async () => {
    const user = await createTestUser();
    const token = generateTestToken({ userId: user._id.toString() });
    const res = await protectedRoute().set('Authorization', token); // no Bearer prefix
    expect(res.status).toBe(401);
  });

  it('rejects a random string as token', async () => {
    const res = await protectedRoute().set('Authorization', 'Bearer randomgarbage');
    expect(res.status).toBe(401);
  });

  it('rejects a base64-only token (no JWT structure)', async () => {
    const fake = Buffer.from('{"userId":"admin"}').toString('base64');
    const res = await protectedRoute().set('Authorization', `Bearer ${fake}`);
    expect(res.status).toBe(401);
  });

  it('rejects a valid JWT with tampered payload', async () => {
    const user = await createTestUser();
    const token = generateTestToken({ userId: user._id.toString(), role: 'user' });
    const [header, , sig] = token.split('.');

    // Craft new payload claiming admin role
    const evilPayload = Buffer.from(
      JSON.stringify({ userId: user._id.toString(), role: 'admin', iat: Math.floor(Date.now() / 1000) })
    ).toString('base64url');

    const tampered = `${header}.${evilPayload}.${sig}`;
    const res = await protectedRoute().set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Token reuse / logout — tokens should be invalidated after logout
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] Token invalidation after logout', () => {
  it('token used after logout should be rejected (requires server-side blacklisting)', async () => {
    const user = await createTestUser();
    const token = generateTestToken({ userId: user._id.toString(), role: 'user' });

    // Logout
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    // Try to reuse the same token
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    // If the server uses stateless JWTs without a blacklist, this will
    // return 200 — which is a vulnerability (no token revocation).
    // The test documents this expectation: revoked tokens must return 401.
    expect(res.status).toBe(401); // FAILS if no token blacklist is implemented
  });
});
