/**
 * Integration tests — Chat routes (/api/chat)
 */
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

vi.mock('../../src/lib/config/redisClient.js', () => ({
  default: { get: vi.fn().mockResolvedValue(null), set: vi.fn(), del: vi.fn(), on: vi.fn() },
}));

vi.mock('../../src/lib/config/openAi.js', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock AI reply' } }],
        }),
      },
    },
  },
}));

import request from 'supertest';
import { connectTestDB, disconnectTestDB, clearDB } from '../setup/db.js';
import { createTestApp } from '../setup/createApp.js';
import { createTestUser, createTestAdmin, authHeader } from '../setup/helpers.js';

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'integration-chat-test-secret';
  process.env.REDIS_URL = 'redis://localhost:6379';
  await connectTestDB();
  app = createTestApp();
});

afterAll(disconnectTestDB);
beforeEach(clearDB);

// ─── POST /api/chat/create ────────────────────────────────────────────────────

describe('POST /api/chat/create', () => {
  it('creates a new chat session', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/chat/create')
      .send({ userId: user._id.toString(), subject: 'Order issue', description: 'My order is late' });
    expect(res.status).toBeLessThan(300);
    expect(res.body).toHaveProperty('_id');
  });

  it('returns existing chat if one already exists for user', async () => {
    const user = await createTestUser();
    const payload = { userId: user._id.toString(), subject: 'Help', description: 'Need help' };

    const first = await request(app).post('/api/chat/create').send(payload);
    const second = await request(app).post('/api/chat/create').send(payload);

    expect(second.status).toBeLessThan(300);
    expect(second.body._id).toBe(first.body._id);
  });

  it('returns 400 when userId is missing', async () => {
    const res = await request(app)
      .post('/api/chat/create')
      .send({ subject: 'Test', description: 'Test' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── POST /api/chat/send ──────────────────────────────────────────────────────

describe('POST /api/chat/send', () => {
  it('sends a message to an existing chat', async () => {
    const user = await createTestUser();

    const chatRes = await request(app)
      .post('/api/chat/create')
      .send({ userId: user._id.toString(), subject: 'Q', description: 'Question' });

    const chatId = chatRes.body._id;

    const res = await request(app).post('/api/chat/send').send({
      chatId,
      senderId: user._id.toString(),
      message: 'Hello, is anyone there?',
    });

    expect(res.status).toBeLessThan(300);
  });
});

// ─── GET /api/chat/:chatId/messages ──────────────────────────────────────────

describe('GET /api/chat/:chatId/messages', () => {
  it('returns paginated messages', async () => {
    const user = await createTestUser();

    const chatRes = await request(app)
      .post('/api/chat/create')
      .send({ userId: user._id.toString(), subject: 'Q', description: 'Question' });

    const chatId = chatRes.body._id;

    const res = await request(app).get(`/api/chat/${chatId}/messages`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('messages');
  });
});

// ─── GET /api/chat/user/:userId ───────────────────────────────────────────────

describe('GET /api/chat/user/:userId', () => {
  it('returns chat threads for a user', async () => {
    const user = await createTestUser();
    await request(app)
      .post('/api/chat/create')
      .send({ userId: user._id.toString(), subject: 'Help', description: 'Desc' });

    const res = await request(app).get(`/api/chat/user/${user._id}`);
    expect(res.status).toBe(200);
  });
});

// ─── Admin-only chat actions — require auth ───────────────────────────────────

describe('Admin-only chat actions', () => {
  it('POST /api/chat/resolve returns 401 without token', async () => {
    const res = await request(app).post('/api/chat/resolve').send({ chatId: 'abc' });
    expect(res.status).toBe(401);
  });

  it('POST /api/chat/reopen returns 401 without token', async () => {
    const res = await request(app).post('/api/chat/reopen').send({ chatId: 'abc' });
    expect(res.status).toBe(401);
  });

  it('POST /api/chat/escalate returns 401 without token', async () => {
    const res = await request(app).post('/api/chat/escalate').send({ chatId: 'abc' });
    expect(res.status).toBe(401);
  });

  it('POST /api/chat/pin returns 401 without token', async () => {
    const res = await request(app).post('/api/chat/pin').send({ chatId: 'abc' });
    expect(res.status).toBe(401);
  });

  it('POST /api/chat/assign returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/chat/assign')
      .send({ chatId: 'abc', adminId: 'xyz' });
    expect(res.status).toBe(401);
  });

  it('POST /api/chat/resolve returns 403 for regular user', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post('/api/chat/resolve')
      .set(authHeader(user))
      .send({ chatId: 'abc' });
    expect(res.status).toBe(403);
  });

  it('POST /api/chat/resolve succeeds for admin', async () => {
    const admin = await createTestAdmin();
    const userA = await createTestUser();

    const chatRes = await request(app)
      .post('/api/chat/create')
      .send({ userId: userA._id.toString(), subject: 'Help', description: 'Desc' });

    const res = await request(app)
      .post('/api/chat/resolve')
      .set(authHeader(admin))
      .send({ chatId: chatRes.body._id });

    expect(res.status).toBeLessThan(300);
  });
});
