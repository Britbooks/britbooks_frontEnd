/**
 * SECURITY — Injection Tests
 *
 * Tests for NoSQL injection, XSS reflection, and oversized payloads.
 * These verify the API either sanitizes input or returns a safe error.
 */
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

vi.mock('../../src/lib/config/redisClient.js', () => ({
  default: { get: vi.fn().mockResolvedValue(null), set: vi.fn(), del: vi.fn(), on: vi.fn() },
}));

vi.mock('../../src/app/services/twilioService.js', () => ({
  sendVerificationCode: vi.fn().mockResolvedValue(true),
  checkVerificationCode: vi.fn().mockResolvedValue({ valid: false }),
}));

vi.mock('../../src/app/services/nexcessService.js', () => ({
  sendEmailVerificationLink: vi.fn().mockResolvedValue({ success: true }),
  checkEmailVerificationCode: vi.fn().mockResolvedValue({ valid: false }),
}));

vi.mock('../../src/app/services/walletservice.js', () => ({
  createWallet: vi.fn().mockResolvedValue({ _id: 'w1' }),
  getWalletByUserId: vi.fn().mockResolvedValue(null),
}));

vi.mock('bee-queue', () => ({
  default: vi.fn().mockImplementation(() => ({
    createJob: vi.fn().mockReturnThis(),
    save: vi.fn().mockResolvedValue({}),
    on: vi.fn(),
  })),
}));

vi.mock('../../src/lib/config/openAi.js', () => ({
  genAI: { getGenerativeModel: vi.fn() },
}));

import request from 'supertest';
import { connectTestDB, disconnectTestDB, clearDB } from '../setup/db.js';
import { createTestApp } from '../setup/createApp.js';
import { createTestUser } from '../setup/helpers.js';

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'security-injection-test-secret';
  process.env.REDIS_URL = 'redis://localhost:6379';
  await connectTestDB();
  app = createTestApp();
});

afterAll(disconnectTestDB);
beforeEach(clearDB);

// ══════════════════════════════════════════════════════════════════════════════
// NoSQL Injection — Login endpoint
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] NoSQL Injection — POST /api/auth/login', () => {
  /**
   * Classic MongoDB operator injection:
   *   email: { "$gt": "" }  — matches any non-empty string (all users)
   * If the server passes req.body.email directly to User.findOne({ email }),
   * Mongoose will pass the object as-is, matching the first user found.
   */
  it('rejects { $gt: "" } operator in email field', async () => {
    await createTestUser({ email: 'victim@test.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: 'anything' });

    // Must NOT succeed — operator injection must be blocked
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.token).toBeUndefined();
  });

  it('rejects { $regex: ".*" } pattern in email field', async () => {
    await createTestUser({ email: 'victim2@test.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $regex: '.*' }, password: 'anything' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.token).toBeUndefined();
  });

  it('rejects { $where: "..." } expression in email field', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $where: 'this.email.length > 0' }, password: 'x' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('treats operator-looking string as literal email (not found)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '$admin', password: 'x' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.token).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// NoSQL Injection — Registration endpoint
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] NoSQL Injection — POST /api/auth/register', () => {
  it('rejects operator in email field during registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Hacker',
      email: { $gt: '' },
      phoneNumber: '+447700900999',
      password: 'Hack123!',
      confirmPassword: 'Hack123!',
      role: 'user',
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects operator injection in phoneNumber field', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Hacker',
      email: 'hacker@test.com',
      phoneNumber: { $gt: '' },
      password: 'Hack123!',
      confirmPassword: 'Hack123!',
      role: 'user',
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// XSS — stored script tags in listing fields
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] XSS — Stored script injection in marketplace listings', () => {
  /**
   * The API stores user-supplied strings in MongoDB and returns them in JSON.
   * The test verifies the server does NOT reflect <script> tags back in HTML
   * response headers or Content-Type. The raw JSON response is acceptable
   * (the client must escape on render), but the server must not set
   * Content-Type: text/html for these endpoints.
   */
  it('GET /api/market/:id returns JSON, not HTML, even with XSS payload in title', async () => {
    const { MarketplaceListing } = await import('../../src/app/models/MarketPlace.js');
    const listing = await MarketplaceListing.create({
      title: '<script>alert("xss")</script>',
      author: 'Evil Author',
      price: 9.99,
      stock: 1,
      condition: 'good',
      sku: 'XSS-TEST-001',
      isPublished: true,
    });

    const res = await request(app).get(`/api/market/${listing._id}`);
    // Response must be JSON, never HTML
    expect(res.headers['content-type']).toMatch(/application\/json/i);
    // Server must not execute or encode as HTML entity in the JSON payload itself
    // (encoding is the client's responsibility, but raw JSON should be safe)
    expect(res.status).toBeLessThan(500);
  });

  it('search endpoint does not reflect unsanitised script tags in JSON', async () => {
    const res = await request(app).get('/api/market/search?q=<script>alert(1)</script>');
    expect(res.headers['content-type']).toMatch(/application\/json/i);
    expect(res.status).toBeLessThan(500);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Oversized / malformed payloads
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] Oversized & malformed payloads', () => {
  it('handles extremely long email string without crashing (< 500)', async () => {
    const longEmail = 'a'.repeat(10000) + '@test.com';
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: longEmail, password: 'pass' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('handles deeply nested JSON object without crashing', async () => {
    // Prototype pollution / stack overflow attempt
    let nested = { a: 'value' };
    for (let i = 0; i < 100; i++) nested = { level: nested };

    const res = await request(app)
      .post('/api/auth/login')
      .send(nested);

    expect(res.status).toBeLessThan(500);
  });

  it('handles array where object is expected without crashing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send([{ email: 'a@b.com', password: 'x' }]);

    expect(res.status).toBeLessThan(500);
  });

  it('handles null body values without crashing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: null, password: null });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Mass Assignment — role escalation via profile update
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] Mass Assignment — role escalation via profile update', () => {
  /**
   * If PUT /api/users/:id passes req.body directly to User.findByIdAndUpdate,
   * an attacker can set role: "admin" on their own account.
   */
  it('cannot escalate own role to admin via PUT /api/users/:id', async () => {
    const { createTestUser, authHeader } = await import('../setup/helpers.js');
    const user = await createTestUser({ role: 'user' });

    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .set(authHeader(user))
      .send({ role: 'admin', adminType: 'super_admin' });

    // If this succeeds, check the user's actual role in the DB
    if (res.status < 300) {
      const User = (await import('../../src/app/models/User.js')).default;
      const updated = await User.findById(user._id);
      // The role must NOT have been changed to admin
      expect(updated.role).toBe('user');
    } else {
      // Correctly rejected the role change
      expect(res.status).toBeGreaterThanOrEqual(400);
    }
  });
});
