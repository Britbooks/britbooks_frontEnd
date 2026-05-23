import { describe, it, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from '../../src/lib/utils/jwtUtils.js';

const SECRET = 'unit-test-jwt-secret';

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

// ─── generateToken ────────────────────────────────────────────────────────────

describe('generateToken', () => {
  it('returns a three-part JWT string', () => {
    const token = generateToken({ userId: 'abc' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('embeds payload fields', () => {
    const payload = { userId: 'u1', role: 'admin', email: 'a@b.com' };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('u1');
    expect(decoded.role).toBe('admin');
    expect(decoded.email).toBe('a@b.com');
  });

  it('defaults to 1-day expiry', () => {
    const token = generateToken({ userId: 'u2' });
    const { iat, exp } = jwt.decode(token);
    expect(exp - iat).toBe(86400);
  });

  it('respects a custom expiry', () => {
    const token = generateToken({ userId: 'u3' }, '2h');
    const { iat, exp } = jwt.decode(token);
    expect(exp - iat).toBe(7200);
  });

  it('signs with the correct secret (different secret fails verify)', () => {
    const token = generateToken({ userId: 'u4' });
    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });
});

// ─── verifyToken ──────────────────────────────────────────────────────────────

describe('verifyToken', () => {
  it('returns decoded payload for a valid token', () => {
    const token = generateToken({ userId: 'u5', role: 'user' });
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('u5');
  });

  it('throws JsonWebTokenError on a tampered signature', () => {
    const token = generateToken({ userId: 'u6' });
    const [h, p] = token.split('.');
    expect(() => verifyToken(`${h}.${p}.badsig`)).toThrow();
  });

  it('throws TokenExpiredError on an expired token', () => {
    const expired = jwt.sign({ userId: 'u7' }, SECRET, { expiresIn: '-1s' });
    expect(() => verifyToken(expired)).toThrowError(/expired/i);
  });

  it('throws on a token signed with a different secret', () => {
    const foreign = jwt.sign({ userId: 'u8' }, 'attacker-secret');
    expect(() => verifyToken(foreign)).toThrow();
  });

  it('throws on an empty string', () => {
    expect(() => verifyToken('')).toThrow();
  });

  it('throws on a random non-JWT string', () => {
    expect(() => verifyToken('hello.world')).toThrow();
  });

  it('throws on alg:none tampered token', () => {
    // Classic algorithm confusion attack: strip signature, set alg to none
    const [h, p] = generateToken({ userId: 'u9', role: 'admin' }).split('.');
    const fakeHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const noneToken = `${fakeHeader}.${p}.`;
    expect(() => verifyToken(noneToken)).toThrow();
  });
});
