/**
 * SECURITY — Authorization / Missing Authentication Tests
 *
 * These tests assert that sensitive endpoints REQUIRE authentication.
 * A test that currently FAILS documents a real security vulnerability
 * that needs to be fixed (endpoint accepts unauthenticated requests).
 *
 * Legend:
 *   [SECURE]  — endpoint correctly rejects unauthenticated requests (test passes)
 *   [VULN]    — endpoint is missing auth guard (test fails = security bug found)
 */
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

vi.mock('../../src/lib/config/redisClient.js', () => ({
  default: { get: vi.fn().mockResolvedValue(null), set: vi.fn(), del: vi.fn(), on: vi.fn() },
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

vi.mock('../../src/app/services/twilioService.js', () => ({
  sendVerificationCode: vi.fn().mockResolvedValue(true),
  checkVerificationCode: vi.fn().mockResolvedValue({ valid: true }),
}));

vi.mock('../../src/app/services/nexcessService.js', () => ({
  sendEmailVerificationLink: vi.fn().mockResolvedValue({ success: true }),
  checkEmailVerificationCode: vi.fn().mockResolvedValue({ valid: true }),
}));

vi.mock('../../src/app/services/walletservice.js', () => ({
  createWallet: vi.fn().mockResolvedValue({ _id: 'w1' }),
  getWalletByUserId: vi.fn().mockResolvedValue({ balance: 0 }),
  creditWallet: vi.fn().mockResolvedValue({}),
  makePayment: vi.fn().mockResolvedValue({}),
  transferFunds: vi.fn().mockResolvedValue({}),
}));

import request from 'supertest';
import { connectTestDB, disconnectTestDB, clearDB } from '../setup/db.js';
import { createTestApp } from '../setup/createApp.js';

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'security-auth-test-secret';
  process.env.REDIS_URL = 'redis://localhost:6379';
  await connectTestDB();
  app = createTestApp();
});

afterAll(disconnectTestDB);
beforeEach(clearDB);

// ══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE — write operations should require authentication
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] Marketplace write endpoints — must require authentication', () => {
  // [VULN] — no auth guard on POST /api/market
  it('POST /api/market (create listing) must return 401 without auth', async () => {
    const res = await request(app).post('/api/market').send({
      title: 'Hacker Book',
      author: 'Anon',
      price: 1,
      stock: 100,
      condition: 'good',
      sku: 'HACK-001',
    });
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — no auth guard on PUT /api/market/:id
  it('PUT /api/market/:id (update listing) must return 401 without auth', async () => {
    const res = await request(app)
      .put('/api/market/64a0000000000000000000aa')
      .send({ price: 0.01 });
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — no auth guard on DELETE /api/market/:id
  it('DELETE /api/market/:id (delete listing) must return 401 without auth', async () => {
    const res = await request(app).delete('/api/market/64a0000000000000000000aa');
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — no auth guard on PATCH /api/market/:id/archive
  it('PATCH /api/market/:id/archive must return 401 without auth', async () => {
    const res = await request(app).patch('/api/market/64a0000000000000000000aa/archive');
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — no auth guard on POST /api/market/:id/publish
  it('POST /api/market/:id/publish must return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/market/64a0000000000000000000aa/publish')
      .send({ isPublished: true });
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — no auth guard on bulk update
  it('POST /api/market/bulk-update must return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/market/bulk-update')
      .send({ action: 'archive', listingIds: [] });
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — CSV bulk sync requires auth
  it('POST /api/market/csv-sync must return 401 without auth', async () => {
    const res = await request(app).post('/api/market/csv-sync').send({ rows: [] });
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — admin listings endpoint has no auth
  it('POST /api/market/admin/listings must return 401 without auth', async () => {
    const res = await request(app).post('/api/market/admin/listings').send({});
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// WALLET — all operations should require authentication
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] Wallet endpoints — must require authentication', () => {
  // [VULN] — anyone can credit any wallet
  it('POST /api/wallet/credit must return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/wallet/credit')
      .send({ walletId: 'any', amount: 1000 });
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — anyone can make a payment from any wallet
  it('POST /api/wallet/pay must return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/wallet/pay')
      .send({ fromWalletId: 'any', toWalletId: 'any', amount: 50 });
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — anyone can transfer between wallets
  it('POST /api/wallet/transfer must return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/wallet/transfer')
      .send({ fromWalletId: 'x', toWalletId: 'y', amount: 100 });
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — anyone can request a refund
  it('POST /api/wallet/request-refund must return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/wallet/request-refund')
      .send({ walletId: 'any', amount: 10 });
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — pending refunds list is public
  it('GET /api/wallet/pending-refunds must return 401 without auth', async () => {
    const res = await request(app).get('/api/wallet/pending-refunds');
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — all wallets and balances are public
  it('GET /api/wallet/balances must return 401 without auth', async () => {
    const res = await request(app).get('/api/wallet/balances');
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — all wallet transactions are public
  it('GET /api/wallet/transactions must return 401 without auth', async () => {
    const res = await request(app).get('/api/wallet/transactions');
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// USER — sensitive operations must require authentication
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] User address endpoints — must require authentication', () => {
  const fakeUserId = '64a0000000000000000000aa';
  const fakeAddressId = '64a0000000000000000000bb';

  // [VULN] — address update has no auth guard
  it('PUT /api/users/:userId/address/:addressId must return 401 without auth', async () => {
    const res = await request(app)
      .put(`/api/users/${fakeUserId}/address/${fakeAddressId}`)
      .send({ city: 'Hacked City' });
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });

  // [VULN] — address delete has no auth guard
  it('DELETE /api/users/:userId/address/:addressId must return 401 without auth', async () => {
    const res = await request(app).delete(`/api/users/${fakeUserId}/address/${fakeAddressId}`);
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });
});

describe('[SECURITY] User listing endpoint — must restrict sensitive data', () => {
  // [VULN] — all users (with PII) returned to anonymous callers
  it('GET /api/users must return 401 without auth (or filter sensitive data)', async () => {
    const res = await request(app).get('/api/users');
    // Either require auth (401) or return minimal public data
    // Currently returns 200 with full user list — vulnerability
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ORDERS — creation must require authentication
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] Order creation — must require authentication', () => {
  // [VULN] — anyone can create an order
  it('POST /api/orders must return 401 without auth', async () => {
    const res = await request(app).post('/api/orders').send({
      items: [],
      shippingAddress: { fullName: 'Anon', phoneNumber: '+44', addressLine1: '1 St', city: 'London', country: 'UK' },
      total: 0,
    });
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CHAT — sensitive read/write must require authentication
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] Chat endpoints — sensitive reads must require auth', () => {
  // [VULN] — admin chat list is fully public
  it('GET /api/chat must return 401 without auth', async () => {
    const res = await request(app).get('/api/chat');
    expect(res.status).toBe(401); // FAILS → vulnerability confirmed
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Already-SECURE endpoints — these should continue to pass
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURE] Endpoints that correctly reject unauthenticated requests', () => {
  it('GET /api/orders returns 401 without auth', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('GET /api/orders/:id returns 401 without auth', async () => {
    const res = await request(app).get('/api/orders/64a0000000000000000000aa');
    expect(res.status).toBe(401);
  });

  it('PATCH /api/orders/:id/status returns 401 without auth', async () => {
    const res = await request(app)
      .patch('/api/orders/64a0000000000000000000aa/status')
      .send({ status: 'processing' });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/orders/:id returns 401 without auth', async () => {
    const res = await request(app).delete('/api/orders/64a0000000000000000000aa');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/logout returns 401 without auth', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/change-password returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ oldPassword: 'x', newPassword: 'y' });
    expect(res.status).toBe(401);
  });

  it('POST /api/chat/resolve returns 401 without auth', async () => {
    const res = await request(app).post('/api/chat/resolve').send({ chatId: 'x' });
    expect(res.status).toBe(401);
  });

  it('POST /api/payments/create-payment returns 401 without auth', async () => {
    const res = await request(app).post('/api/payments/create-payment').send({});
    expect(res.status).toBe(401);
  });
});
