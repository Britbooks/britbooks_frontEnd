/**
 * Integration tests — User routes (/api/users)
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

import request from 'supertest';
import { connectTestDB, disconnectTestDB, clearDB } from '../setup/db.js';
import { createTestApp } from '../setup/createApp.js';
import { createTestUser, createTestAdmin, authHeader } from '../setup/helpers.js';

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'integration-users-test-secret';
  process.env.REDIS_URL = 'redis://localhost:6379';
  await connectTestDB();
  app = createTestApp();
});

afterAll(disconnectTestDB);
beforeEach(clearDB);

// ─── GET /api/users ───────────────────────────────────────────────────────────

describe('GET /api/users', () => {
  it('returns 200 with array', async () => {
    const user = await createTestUser();
    const res = await request(app).get('/api/users').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('does not expose password field', async () => {
    const user = await createTestUser();
    const res = await request(app).get('/api/users').set(authHeader(user));
    const users = res.body;
    expect(users.every((u) => !u.password)).toBe(true);
  });
});

// ─── GET /api/users/:userId ───────────────────────────────────────────────────

describe('GET /api/users/:userId', () => {
  it('returns 404 for a non-existent user', async () => {
    const res = await request(app).get('/api/users/64a0000000000000000000aa');
    expect(res.status).toBe(404);
  });

  it('returns the user object', async () => {
    const user = await createTestUser({ email: 'profile@test.com' });
    const res = await request(app).get(`/api/users/${user._id}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('profile@test.com');
  });

  it('does not expose password in response', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/users/${user._id}`);
    expect(res.body.password).toBeUndefined();
  });
});

// ─── PUT /api/users/:userId ───────────────────────────────────────────────────

describe('PUT /api/users/:userId', () => {
  it('returns 401 without token', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .send({ fullName: 'Updated Name' });
    expect(res.status).toBe(401);
  });

  it('allows user to update own profile', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .set(authHeader(user))
      .send({ fullName: 'Updated Name' });
    expect(res.status).toBeLessThan(300);
  });
});

// ─── POST /api/users/:userId/address ─────────────────────────────────────────

describe('POST /api/users/:userId/address', () => {
  const address = {
    fullName: 'Test User',
    phoneNumber: '+447700900123',
    addressLine1: '1 Test St',
    city: 'London',
    country: 'UK',
  };

  it('returns 401 without token', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post(`/api/users/${user._id}/address`)
      .send(address);
    expect(res.status).toBe(401);
  });

  it('saves address with valid token', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post(`/api/users/${user._id}/address`)
      .set(authHeader(user))
      .send(address);
    expect(res.status).toBeLessThan(300);
  });
});

// ─── GET /api/users/:userId/address ──────────────────────────────────────────

describe('GET /api/users/:userId/address', () => {
  it('returns 401 without token', async () => {
    const user = await createTestUser();
    const res = await request(app).get(`/api/users/${user._id}/address`);
    expect(res.status).toBe(401);
  });

  it('returns address list for authenticated user', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .get(`/api/users/${user._id}/address`)
      .set(authHeader(user));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.addresses ?? res.body)).toBe(true);
  });
});

// ─── PATCH /api/users/assign-admin-type/:userId — admin only ──────────────────

describe('PATCH /api/users/assign-admin-type/:userId', () => {
  it('returns 401 without token', async () => {
    const target = await createTestUser();
    const res = await request(app)
      .patch(`/api/users/assign-admin-type/${target._id}`)
      .send({ adminType: 'ops_admin' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const user = await createTestUser();
    const target = await createTestUser();
    const res = await request(app)
      .patch(`/api/users/assign-admin-type/${target._id}`)
      .set(authHeader(user))
      .send({ adminType: 'ops_admin' });
    expect(res.status).toBe(403);
  });
});
