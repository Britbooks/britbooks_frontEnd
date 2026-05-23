import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../../src/app/models/User.js';

export function generateTestToken(payload, expiresIn = '1d') {
  const secret = process.env.JWT_SECRET || 'test-secret-key-for-jest';
  return jwt.sign(payload, secret, { expiresIn });
}

export async function createTestUser(overrides = {}) {
  const rawPassword = 'TestPass123!';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const user = await User.create({
    fullName: 'Test User',
    email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    phoneNumber: '+447700900123',
    password: hashedPassword,
    role: 'user',
    isVerified: true,
    ...overrides,
    password: hashedPassword, // always override raw password with hash
  });

  return user;
}

export async function createTestAdmin(overrides = {}) {
  return createTestUser({ role: 'admin', adminType: 'super_admin', ...overrides });
}

export function authHeader(user) {
  const token = generateTestToken({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  });
  return { Authorization: `Bearer ${token}` };
}

export function expiredAuthHeader(user) {
  const token = generateTestToken(
    { userId: user._id.toString(), role: user.role },
    '-1s' // already expired
  );
  return { Authorization: `Bearer ${token}` };
}

export function malformedAuthHeader() {
  return { Authorization: 'Bearer not.a.real.jwt.token' };
}
