/**
 * Integration tests — Marketplace routes (/api/market)
 */
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

vi.mock('../../src/lib/config/redisClient.js', () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    on: vi.fn(),
  },
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
import { createTestUser, createTestAdmin, authHeader } from '../setup/helpers.js';
import { MarketplaceListing } from '../../src/app/models/MarketPlace.js';

let app;

const validListing = {
  title: 'Clean Code',
  author: 'Robert C. Martin',
  price: 14.99,
  stock: 10,
  condition: 'good',
  sku: 'CLEAN-CODE-001',
};

beforeAll(async () => {
  process.env.JWT_SECRET = 'integration-market-test-secret';
  process.env.REDIS_URL = 'redis://localhost:6379';
  await connectTestDB();
  app = createTestApp();
});

afterAll(disconnectTestDB);
beforeEach(clearDB);

// ─── GET /api/market/published ────────────────────────────────────────────────

describe('GET /api/market/published', () => {
  it('returns an array (empty when no listings)', async () => {
    const res = await request(app).get('/api/market/published');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.listings)).toBe(true);
  });

  it('returns only published, non-archived listings', async () => {
    await MarketplaceListing.create({
      ...validListing,
      sku: 'PUB-1',
      isPublished: true,
      isArchived: false,
    });
    await MarketplaceListing.create({
      ...validListing,
      title: 'Archived Book',
      sku: 'PUB-2',
      isPublished: true,
      isArchived: true,
    });
    const res = await request(app).get('/api/market/published');
    expect(res.status).toBe(200);
    expect(res.body.listings.every((l) => !l.isArchived)).toBe(true);
  });
});

// ─── GET /api/market/:id ──────────────────────────────────────────────────────

describe('GET /api/market/:id', () => {
  it('returns 404 for a non-existent listing', async () => {
    const res = await request(app).get('/api/market/64a0000000000000000000aa');
    expect(res.status).toBe(404);
  });

  it('returns a listing by id', async () => {
    const listing = await MarketplaceListing.create({ ...validListing, isPublished: true });
    const res = await request(app).get(`/api/market/${listing._id}`);
    expect(res.status).toBe(200);
    expect(res.body.listing.title).toBe('Clean Code');
  });

  it('includes schema.org structuredData', async () => {
    const listing = await MarketplaceListing.create({ ...validListing, isPublished: true });
    const res = await request(app).get(`/api/market/${listing._id}`);
    expect(res.body.listing.structuredData?.['@type']).toBe('Book');
  });
});

// ─── GET /api/market/search ───────────────────────────────────────────────────

describe('GET /api/market/search', () => {
  it('returns 200 with results array', async () => {
    const res = await request(app).get('/api/market/search?keyword=code');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('returns empty array when no keyword provided', async () => {
    const res = await request(app).get('/api/market/search');
    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });
});

// ─── GET /api/market/stats ────────────────────────────────────────────────────

describe('GET /api/market/stats', () => {
  it('returns aggregate stats object', async () => {
    const res = await request(app).get('/api/market/stats');
    expect(res.status).toBe(200);
    expect(res.body.stats).toHaveProperty('totalListings');
    expect(res.body.stats).toHaveProperty('totalViews');
  });
});

// ─── POST /api/market ─────────────────────────────────────────────────────────

describe('POST /api/market', () => {
  it('creates a listing and returns 201/200', async () => {
    const user = await createTestUser();
    const res = await request(app).post('/api/market').set(authHeader(user)).send(validListing);
    expect(res.status).toBeLessThan(300);
    expect(res.body.listing?.title).toBe('Clean Code');
  });

  it('returns 400 for missing required fields', async () => {
    const user = await createTestUser();
    const { title, ...rest } = validListing;
    const res = await request(app).post('/api/market').set(authHeader(user)).send(rest);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── PUT /api/market/:id ──────────────────────────────────────────────────────

describe('PUT /api/market/:id', () => {
  it('updates and returns the listing', async () => {
    const user = await createTestUser();
    const listing = await MarketplaceListing.create({ ...validListing, isPublished: true });
    const res = await request(app)
      .put(`/api/market/${listing._id}`)
      .set(authHeader(user))
      .send({ price: 19.99 });
    expect(res.status).toBeLessThan(300);
  });
});

// ─── PATCH /api/market/:id/archive ───────────────────────────────────────────

describe('PATCH /api/market/:id/archive', () => {
  it('archives a listing', async () => {
    const user = await createTestUser();
    const listing = await MarketplaceListing.create({ ...validListing, isPublished: true });
    const res = await request(app).patch(`/api/market/${listing._id}/archive`).set(authHeader(user));
    expect(res.status).toBeLessThan(300);
  });
});

// ─── DELETE /api/market/:id ───────────────────────────────────────────────────

describe('DELETE /api/market/:id', () => {
  it('permanently removes a listing', async () => {
    const user = await createTestUser();
    const listing = await MarketplaceListing.create({ ...validListing, isPublished: true });
    const res = await request(app).delete(`/api/market/${listing._id}`).set(authHeader(user));
    expect(res.status).toBeLessThan(300);
    const check = await MarketplaceListing.findById(listing._id);
    expect(check).toBeNull();
  });
});

// ─── POST /api/market/:id/views ───────────────────────────────────────────────

describe('POST /api/market/:id/views', () => {
  it('increments the view counter', async () => {
    const listing = await MarketplaceListing.create({ ...validListing, isPublished: true, views: 0 });
    const res = await request(app).post(`/api/market/${listing._id}/views`);
    expect(res.status).toBeLessThan(300);
    const updated = await MarketplaceListing.findById(listing._id);
    expect(updated.views).toBe(1);
  });
});
