/**
 * Unit tests for authService — all external I/O is mocked.
 */
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// ── Mocks must be declared before any app imports ────────────────────────────

vi.mock('../../src/app/services/twilioService.js', () => ({
  sendVerificationCode: vi.fn().mockResolvedValue(true),
  checkVerificationCode: vi.fn().mockResolvedValue({ valid: true }),
}));

vi.mock('../../src/app/services/nexcessService.js', () => ({
  sendEmailVerificationLink: vi.fn().mockResolvedValue({ success: true }),
  checkEmailVerificationCode: vi.fn().mockResolvedValue({ valid: true }),
}));

vi.mock('../../src/app/services/walletservice.js', () => ({
  createWallet: vi.fn().mockResolvedValue({ _id: 'wallet123' }),
}));

vi.mock('../../src/lib/config/redisClient.js', () => ({
  default: { get: vi.fn(), set: vi.fn(), del: vi.fn(), on: vi.fn() },
}));

// ── Test infrastructure ────────────────────────────────────────────────────────

import { connectTestDB, disconnectTestDB, clearDB } from '../setup/db.js';
import * as authService from '../../src/app/services/authService.js';
import { sendVerificationCode } from '../../src/app/services/twilioService.js';
import { sendEmailVerificationLink } from '../../src/app/services/nexcessService.js';
import User from '../../src/app/models/User.js';

beforeAll(async () => {
  process.env.JWT_SECRET = 'auth-service-unit-test-secret';
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearDB();
  vi.clearAllMocks();
});

// ─── register ────────────────────────────────────────────────────────────────

describe('authService.register', () => {
  it('creates a user with hashed password', async () => {
    await authService.register('Alice', 'alice@test.com', '+447700900001', 'Secret123!', 'user');
    const user = await User.findOne({ email: 'alice@test.com' });
    expect(user).toBeTruthy();
    expect(user.password).not.toBe('Secret123!');
    expect(user.isVerified).toBe(false);
  });

  it('sends both phone and email verification codes', async () => {
    await authService.register('Bob', 'bob@test.com', '+447700900002', 'Secret123!', 'user');
    expect(sendVerificationCode).toHaveBeenCalledOnce();
    expect(sendEmailVerificationLink).toHaveBeenCalledOnce();
  });

  it('assigns the requested role', async () => {
    await authService.register('Carol', 'carol@test.com', '+447700900003', 'Secret123!', 'admin');
    const user = await User.findOne({ email: 'carol@test.com' });
    expect(user.role).toBe('admin');
  });

  it('throws if email already exists', async () => {
    await authService.register('Dave', 'dave@test.com', '+447700900004', 'Secret123!', 'user');
    await expect(
      authService.register('Dave2', 'dave@test.com', '+447700900005', 'Secret123!', 'user')
    ).rejects.toThrow(/already in use/i);
  });

  it('throws if phone already exists', async () => {
    await authService.register('Eve', 'eve@test.com', '+447700900006', 'Secret123!', 'user');
    await expect(
      authService.register('Eve2', 'eve2@test.com', '+447700900006', 'Secret123!', 'user')
    ).rejects.toThrow(/already in use/i);
  });

  it('returns userId', async () => {
    const result = await authService.register('Frank', 'frank@test.com', '+447700900007', 'Secret123!', 'user');
    expect(result.userId).toBeTruthy();
  });

  it('throws when verification code sending fails', async () => {
    sendEmailVerificationLink.mockResolvedValueOnce({ success: false });
    await expect(
      authService.register('Gail', 'gail@test.com', '+447700900008', 'Secret123!', 'user')
    ).rejects.toThrow(/verification/i);
  });
});

// ─── verifyRegistration ───────────────────────────────────────────────────────

describe('authService.verifyRegistration', () => {
  it('throws on invalid OTP format (< 6 digits)', async () => {
    await expect(
      authService.verifyRegistration('+447700900001', '123', { email: 'a@b.com' })
    ).rejects.toThrow(/invalid otp format/i);
  });

  it('throws on invalid OTP format (non-numeric)', async () => {
    await expect(
      authService.verifyRegistration('+447700900001', 'ABCDEF', { email: 'a@b.com' })
    ).rejects.toThrow(/invalid otp format/i);
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('authService.login', () => {
  it('throws for unknown email', async () => {
    await expect(
      authService.login('nobody@test.com', 'pass')
    ).rejects.toThrow();
  });

  it('throws for wrong password', async () => {
    await authService.register('Hank', 'hank@test.com', '+447700900009', 'RealPass123!', 'user');
    await expect(
      authService.login('hank@test.com', 'WrongPass')
    ).rejects.toThrow();
  });
});
