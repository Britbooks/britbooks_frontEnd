/**
 * Integration tests — Wallet routes (/api/wallet)
 */
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

vi.mock('../../src/lib/config/redisClient.js', () => ({
  default: { get: vi.fn().mockResolvedValue(null), set: vi.fn(), del: vi.fn(), on: vi.fn() },
}));

// Mock wallet service to avoid complex internal logic in route tests
vi.mock('../../src/app/services/walletservice.js', () => ({
  createWallet: vi.fn().mockResolvedValue({ _id: 'w1', balance: 0, currency: 'GBP' }),
  getWalletByUserId: vi.fn().mockResolvedValue({ _id: 'w1', balance: 100 }),
  getWalletById: vi.fn().mockResolvedValue({ _id: 'w1', balance: 100 }),
  creditWallet: vi.fn().mockResolvedValue({ _id: 'w1', balance: 200 }),
  makePayment: vi.fn().mockResolvedValue({ wallet: { balance: 90 }, status: 'paid' }),
  transferFunds: vi.fn().mockResolvedValue({ success: true }),
  transferFundsWalletToWallet: vi.fn().mockResolvedValue({ transactionId: 'tx1', senderWalletBalance: 75, recipientWalletBalance: 125 }),
  requestRefund: vi.fn().mockResolvedValue({ success: true }),
  getPendingRefunds: vi.fn().mockResolvedValue([]),
  processRefund: vi.fn().mockResolvedValue({ success: true }),
  getRefunds: vi.fn().mockResolvedValue([]),
  getAllWallets: vi.fn().mockResolvedValue([]),
  getAllWalletBalances: vi.fn().mockResolvedValue([]),
  getAllTransactions: vi.fn().mockResolvedValue([]),
  getTransactionById: vi.fn().mockResolvedValue(null),
  getWalletTransactionsByUserId: vi.fn().mockResolvedValue([]),
}));

import request from 'supertest';
import { connectTestDB, disconnectTestDB, clearDB } from '../setup/db.js';
import { createTestApp } from '../setup/createApp.js';
import { createTestUser, authHeader } from '../setup/helpers.js';

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'integration-wallet-test-secret';
  process.env.REDIS_URL = 'redis://localhost:6379';
  await connectTestDB();
  app = createTestApp();
});

afterAll(disconnectTestDB);
beforeEach(clearDB);

// ─── Wallet endpoints response shapes ─────────────────────────────────────────

describe('GET /api/wallet', () => {
  it('returns 200 with a list', async () => {
    const res = await request(app).get('/api/wallet');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/wallet/balances', () => {
  it('returns 200 with balances', async () => {
    const user = await createTestUser();
    const res = await request(app).get('/api/wallet/balances').set(authHeader(user));
    expect(res.status).toBe(200);
  });
});

describe('GET /api/wallet/transactions', () => {
  it('returns 200 with transaction list', async () => {
    const user = await createTestUser();
    const res = await request(app).get('/api/wallet/transactions').set(authHeader(user));
    expect(res.status).toBe(200);
  });
});

describe('POST /api/wallet/create', () => {
  it('creates a wallet and returns 200/201', async () => {
    const res = await request(app)
      .post('/api/wallet/create')
      .send({ userId: '64a0000000000000000000aa', currency: 'GBP' });
    expect(res.status).toBeLessThan(300);
  });
});

describe('POST /api/wallet/credit', () => {
  it('credits a wallet', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/wallet/credit')
      .set(authHeader(user))
      .send({ userId: user._id.toString(), amount: 50 });
    expect(res.status).toBeLessThan(300);
  });

  it('returns 400 when userId is missing', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/wallet/credit')
      .set(authHeader(user))
      .send({ amount: 50 });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('returns 400 for negative amounts', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/wallet/credit')
      .set(authHeader(user))
      .send({ userId: user._id.toString(), amount: -100 });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('POST /api/wallet/pay', () => {
  it('processes a payment between wallets', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/wallet/pay')
      .set(authHeader(user))
      .send({ userId: user._id.toString(), amount: 10, bookingId: 'b1' });
    expect(res.status).toBeLessThan(300);
  });
});

describe('POST /api/wallet/transfer', () => {
  it('transfers funds between wallets', async () => {
    const user = await createTestUser();
    const recipient = await createTestUser();
    const res = await request(app)
      .post('/api/wallet/transfer')
      .set(authHeader(user))
      .send({ recipientUserId: recipient._id.toString(), amount: 25 });
    expect(res.status).toBeLessThan(300);
  });
});

describe('POST /api/wallet/request-refund', () => {
  it('submits a refund request', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/wallet/request-refund')
      .set(authHeader(user))
      .send({ userId: user._id.toString(), amount: 10, reason: 'Item not received' });
    expect(res.status).toBeLessThan(300);
  });
});

describe('GET /api/wallet/pending-refunds', () => {
  it('returns pending refund list', async () => {
    const user = await createTestUser();
    const res = await request(app).get('/api/wallet/pending-refunds').set(authHeader(user));
    expect(res.status).toBe(200);
  });
});
