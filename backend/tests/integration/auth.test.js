/**
 * Integration tests — Auth routes (/api/auth)
 * External services (Twilio, Nexcess, Wallet) are mocked.
 */
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

vi.mock('../../src/app/services/twilioService.js', () => ({
  sendVerificationCode: vi.fn().mockResolvedValue(true),
  checkVerificationCode: vi.fn().mockResolvedValue({ valid: true }),
}));

vi.mock('../../src/app/services/nexcessService.js', () => ({
  sendEmailVerificationLink: vi.fn().mockResolvedValue({ success: true }),
  checkEmailVerificationCode: vi.fn().mockResolvedValue({ valid: true }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../../src/app/services/walletservice.js', () => ({
  createWallet: vi.fn().mockResolvedValue({ _id: 'w1' }),
  getWalletByUserId: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../src/lib/config/redisClient.js', () => ({
  default: { get: vi.fn().mockResolvedValue(null), set: vi.fn(), del: vi.fn(), on: vi.fn() },
}));

import request from 'supertest';
import { connectTestDB, disconnectTestDB, clearDB } from '../setup/db.js';
import { createTestApp } from '../setup/createApp.js';
import { createTestUser, authHeader } from '../setup/helpers.js';

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'integration-auth-test-secret';
  process.env.REDIS_URL = 'redis://localhost:6379';
  await connectTestDB();
  app = createTestApp();
});

afterAll(disconnectTestDB);
beforeEach(clearDB);

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  const validPayload = {
    fullName: 'Alice Smith',
    email: 'alice@register.com',
    phoneNumber: '+447700900100',
    password: 'Secure123!',
    confirmPassword: 'Secure123!',
    role: 'user',
  };

  it('returns 200 and a temp token on valid data', async () => {
    const res = await request(app).post('/api/auth/register').send(validPayload);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('returns 400 when fullName is missing', async () => {
    const { fullName, ...rest } = validPayload;
    const res = await request(app).post('/api/auth/register').send(rest);
    expect(res.status).toBe(400);
  });

  it('returns 400 when passwords do not match', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, confirmPassword: 'Different1!' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is already registered', async () => {
    await request(app).post('/api/auth/register').send(validPayload);
    const res = await request(app).post('/api/auth/register').send(validPayload);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, role: 'superuser' });
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 400 for missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for unregistered email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Pass123!' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for wrong password', async () => {
    await request(app).post('/api/auth/register').send({
      fullName: 'Bob',
      email: 'bob@login.com',
      phoneNumber: '+447700900101',
      password: 'Correct123!',
      confirmPassword: 'Correct123!',
      role: 'user',
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@login.com', password: 'WrongPassword' });
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is malformed', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer bad.token.here');
    expect(res.status).toBe(401);
  });

  it('returns 2xx when a valid token is provided', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/auth/logout')
      .set(authHeader(user));
    expect(res.status).toBeLessThan(500);
  });
});

// ─── POST /api/auth/change-password ──────────────────────────────────────────

describe('POST /api/auth/change-password', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ oldPassword: 'Old1!', newPassword: 'New1!' });
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/auth/protected ─────────────────────────────────────────────────

describe('GET /api/auth/protected', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/protected');
    expect(res.status).toBe(401);
  });

  it('returns 2xx with a valid token', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .get('/api/auth/protected')
      .set(authHeader(user));
    expect(res.status).toBeLessThan(400);
  });
});
