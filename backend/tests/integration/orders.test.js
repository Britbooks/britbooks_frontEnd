/**
 * Integration tests — Order routes (/api/orders)
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
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true),
}));

import request from 'supertest';
import { connectTestDB, disconnectTestDB, clearDB } from '../setup/db.js';
import { createTestApp } from '../setup/createApp.js';
import { createTestUser, createTestAdmin, authHeader } from '../setup/helpers.js';
import { MarketplaceListing } from '../../src/app/models/MarketPlace.js';
import { Order } from '../../src/app/models/Order.js';

let app;

const shippingAddress = {
  fullName: 'Test User',
  phoneNumber: '+447700900123',
  addressLine1: '10 Downing St',
  city: 'London',
  country: 'UK',
};

beforeAll(async () => {
  process.env.JWT_SECRET = 'integration-orders-test-secret';
  process.env.REDIS_URL = 'redis://localhost:6379';
  await connectTestDB();
  app = createTestApp();
});

afterAll(disconnectTestDB);
beforeEach(clearDB);

async function seedListing(overrides = {}) {
  return MarketplaceListing.create({
    title: 'Order Test Book',
    author: 'Author',
    price: 9.99,
    stock: 10,
    condition: 'good',
    sku: `ORD-${Date.now()}`,
    isPublished: true,
    ...overrides,
  });
}

// ─── GET /api/orders — auth required ──────────────────────────────────────────

describe('GET /api/orders', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('returns 200 for authenticated user', async () => {
    const user = await createTestUser();
    const res = await request(app).get('/api/orders').set(authHeader(user));
    expect(res.status).toBe(200);
  });
});

// ─── GET /api/orders/:id — auth required ──────────────────────────────────────

describe('GET /api/orders/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/orders/64a0000000000000000000aa');
    expect(res.status).toBe(401);
  });

  it('returns 404 for non-existent order', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .get('/api/orders/64a0000000000000000000aa')
      .set(authHeader(user));
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/orders/:id/status — auth required ────────────────────────────

describe('PATCH /api/orders/:id/status', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .patch('/api/orders/64a0000000000000000000aa/status')
      .send({ status: 'processing' });
    expect(res.status).toBe(401);
  });

  it('transitions order status successfully', async () => {
    const user = await createTestUser();
    const listing = await seedListing();

    const order = await Order.create({
      user: user._id,
      type: 'order',
      status: 'ordered',
      items: [{ listing: listing._id, quantity: 1, priceAtPurchase: 9.99, currency: 'GBP' }],
      shippingAddress,
      total: 9.99,
      currency: 'GBP',
    });

    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set(authHeader(user))
      .send({ status: 'processing' });

    expect(res.status).toBeLessThan(300);
  });

  it('rejects an invalid status value', async () => {
    const user = await createTestUser();
    const listing = await seedListing();

    const order = await Order.create({
      user: user._id,
      type: 'order',
      status: 'ordered',
      items: [{ listing: listing._id, quantity: 1, priceAtPurchase: 9.99, currency: 'GBP' }],
      shippingAddress,
      total: 9.99,
      currency: 'GBP',
    });

    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set(authHeader(user))
      .send({ status: 'teleported' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── DELETE /api/orders/:id — auth required ───────────────────────────────────

describe('DELETE /api/orders/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/orders/64a0000000000000000000aa');
    expect(res.status).toBe(401);
  });

  it('deletes a user\'s own order', async () => {
    const user = await createTestUser();
    const listing = await seedListing();

    const order = await Order.create({
      user: user._id,
      type: 'order',
      status: 'ordered',
      items: [{ listing: listing._id, quantity: 1, priceAtPurchase: 9.99, currency: 'GBP' }],
      shippingAddress,
      total: 9.99,
      currency: 'GBP',
    });

    const res = await request(app)
      .delete(`/api/orders/${order._id}`)
      .set(authHeader(user));
    expect(res.status).toBeLessThan(300);
  });
});

// ─── GET /api/orders/user/:userId — auth required ────────────────────────────

describe('GET /api/orders/user/:userId', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/orders/user/someId');
    expect(res.status).toBe(401);
  });

  it('returns orders for authenticated user', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .get(`/api/orders/user/${user._id}`)
      .set(authHeader(user));
    expect(res.status).toBe(200);
  });
});
