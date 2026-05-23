/**
 * SECURITY — Insecure Direct Object Reference (IDOR) Tests
 *
 * Verifies that authenticated users can only access/modify their own resources.
 * A failing test means an IDOR vulnerability exists.
 */
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

vi.mock('../../src/lib/config/redisClient.js', () => ({
  default: { get: vi.fn().mockResolvedValue(null), set: vi.fn(), del: vi.fn(), on: vi.fn() },
}));

vi.mock('../../src/app/services/walletservice.js', () => ({
  createWallet: vi.fn().mockResolvedValue({ _id: 'w1' }),
  getWalletByUserId: vi.fn().mockResolvedValue({ balance: 0 }),
}));

vi.mock('../../src/app/services/nexcessService.js', () => ({
  sendEmailVerificationLink: vi.fn().mockResolvedValue({ success: true }),
  checkEmailVerificationCode: vi.fn().mockResolvedValue({ valid: true }),
  sendAccountClosureEmail: vi.fn().mockResolvedValue(true),
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
import { createTestUser, authHeader } from '../setup/helpers.js';
import { Order } from '../../src/app/models/Order.js';
import { MarketplaceListing } from '../../src/app/models/MarketPlace.js';

let app;

const shippingAddress = {
  fullName: 'Test',
  phoneNumber: '+447700900123',
  addressLine1: '1 St',
  city: 'London',
  country: 'UK',
};

beforeAll(async () => {
  process.env.JWT_SECRET = 'security-idor-test-secret';
  process.env.REDIS_URL = 'redis://localhost:6379';
  await connectTestDB();
  app = createTestApp();
});

afterAll(disconnectTestDB);
beforeEach(clearDB);

// ══════════════════════════════════════════════════════════════════════════════
// Orders — User A must not access User B's orders
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] IDOR — Order access control', () => {
  it('user cannot view another user\'s order by id', async () => {
    const userA = await createTestUser({ email: 'user-a@test.com' });
    const userB = await createTestUser({ email: 'user-b@test.com' });

    const listing = await MarketplaceListing.create({
      title: 'Book', author: 'A', price: 5, stock: 1, condition: 'good',
      sku: 'IDOR-001', isPublished: true,
    });

    // userA creates an order
    const order = await Order.create({
      user: userA._id,
      type: 'order',
      status: 'ordered',
      items: [{ listing: listing._id, quantity: 1, priceAtPurchase: 5, currency: 'GBP' }],
      shippingAddress,
      total: 5,
      currency: 'GBP',
    });

    // userB tries to access userA's order — must be rejected
    const res = await request(app)
      .get(`/api/orders/${order._id}`)
      .set(authHeader(userB));

    // Either 403 (forbidden) or 404 (hidden) — never 200
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('user cannot delete another user\'s order', async () => {
    const userA = await createTestUser({ email: 'user-c@test.com' });
    const userB = await createTestUser({ email: 'user-d@test.com' });

    const listing = await MarketplaceListing.create({
      title: 'Book2', author: 'A', price: 5, stock: 1, condition: 'good',
      sku: 'IDOR-002', isPublished: true,
    });

    const order = await Order.create({
      user: userA._id,
      type: 'order',
      status: 'ordered',
      items: [{ listing: listing._id, quantity: 1, priceAtPurchase: 5, currency: 'GBP' }],
      shippingAddress,
      total: 5,
      currency: 'GBP',
    });

    const res = await request(app)
      .delete(`/api/orders/${order._id}`)
      .set(authHeader(userB));

    expect(res.status).toBeGreaterThanOrEqual(400);

    // Verify the order still exists
    const check = await Order.findById(order._id);
    expect(check).not.toBeNull();
  });

  it('user cannot update status of another user\'s order', async () => {
    const userA = await createTestUser({ email: 'user-e@test.com' });
    const userB = await createTestUser({ email: 'user-f@test.com' });

    const listing = await MarketplaceListing.create({
      title: 'Book3', author: 'A', price: 5, stock: 1, condition: 'good',
      sku: 'IDOR-003', isPublished: true,
    });

    const order = await Order.create({
      user: userA._id,
      type: 'order',
      status: 'ordered',
      items: [{ listing: listing._id, quantity: 1, priceAtPurchase: 5, currency: 'GBP' }],
      shippingAddress,
      total: 5,
      currency: 'GBP',
    });

    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set(authHeader(userB))
      .send({ status: 'delivered' }); // userB trying to mark userA's order delivered

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// User profile — User A must not modify User B's profile
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] IDOR — User profile access control', () => {
  it('user cannot update another user\'s profile', async () => {
    const userA = await createTestUser({ email: 'user-g@test.com' });
    const userB = await createTestUser({ email: 'user-h@test.com' });

    const res = await request(app)
      .put(`/api/users/${userA._id}`)
      .set(authHeader(userB)) // userB's token
      .send({ fullName: 'Hijacked Name' });

    // Must be rejected
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('user cannot get addresses of another user', async () => {
    const userA = await createTestUser({ email: 'user-i@test.com' });
    const userB = await createTestUser({ email: 'user-j@test.com' });

    const res = await request(app)
      .get(`/api/users/${userA._id}/address`)
      .set(authHeader(userB));

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('user cannot add address to another user\'s account', async () => {
    const userA = await createTestUser({ email: 'user-k@test.com' });
    const userB = await createTestUser({ email: 'user-l@test.com' });

    const res = await request(app)
      .post(`/api/users/${userA._id}/address`)
      .set(authHeader(userB))
      .send({
        fullName: 'Attacker',
        phoneNumber: '+447700900999',
        addressLine1: '99 Hack St',
        city: 'Hackersville',
        country: 'UK',
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Account closure — user must only be able to close their own account
// ══════════════════════════════════════════════════════════════════════════════

describe('[SECURITY] IDOR — Account closure', () => {
  it('user cannot request closure of another user\'s account', async () => {
    const userA = await createTestUser({ email: 'user-m@test.com' });
    const userB = await createTestUser({ email: 'user-n@test.com' });

    const res = await request(app)
      .post(`/api/users/request-closure/${userA._id}`)
      .set(authHeader(userB))
      .send({ password: 'anything', feedback: 'closing victim' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
