/**
 * Unit tests for marketPlaceService — DB via memory-server, Redis mocked.
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

import { connectTestDB, disconnectTestDB, clearDB } from '../setup/db.js';
import {
  createListing,
  getListingById,
  archiveListing,
  deleteListingPermanently,
  searchListings,
  getListingStats,
} from '../../src/app/services/marketPlaceService.js';

const baseListing = {
  title: 'Test Book',
  author: 'Jane Doe',
  price: 9.99,
  stock: 5,
  condition: 'good',
  sku: `TEST-${Date.now()}`,
};

beforeAll(async () => {
  process.env.REDIS_URL = 'redis://localhost:6379';
  await connectTestDB();
});

afterAll(disconnectTestDB);

beforeEach(async () => {
  await clearDB();
  vi.clearAllMocks();
});

// ─── createListing ────────────────────────────────────────────────────────────

describe('createListing', () => {
  it('creates and returns a listing', async () => {
    const listing = await createListing({ ...baseListing });
    expect(listing._id).toBeTruthy();
    expect(listing.title).toBe('Test Book');
    expect(listing.isPublished).toBe(true);
  });

  it('throws on duplicate title', async () => {
    await createListing({ ...baseListing });
    await expect(createListing({ ...baseListing, sku: 'DIFFERENT-SKU' })).rejects.toThrow(
      /already exists/i
    );
  });
});

// ─── getListingById ───────────────────────────────────────────────────────────

describe('getListingById', () => {
  it('returns listing by ObjectId', async () => {
    const created = await createListing({ ...baseListing });
    const found = await getListingById(created._id.toString());
    expect(found.title).toBe('Test Book');
  });

  it('returns listing by slug', async () => {
    const created = await createListing({ ...baseListing });
    const found = await getListingById(created.slug);
    expect(found).toBeTruthy();
  });

  it('returns null for unknown id', async () => {
    const found = await getListingById('64a0000000000000000000aa');
    expect(found).toBeNull();
  });

  it('attaches structuredData with schema.org markup', async () => {
    const created = await createListing({ ...baseListing });
    const found = await getListingById(created._id.toString());
    expect(found.structuredData['@type']).toBe('Book');
    expect(found.structuredData.offers.priceCurrency).toBe('GBP');
  });
});

// ─── archiveListing ───────────────────────────────────────────────────────────

describe('archiveListing', () => {
  it('sets isArchived to true', async () => {
    const listing = await createListing({ ...baseListing });
    const archived = await archiveListing(listing._id);
    expect(archived.isArchived).toBe(true);
  });
});

// ─── deleteListingPermanently ─────────────────────────────────────────────────

describe('deleteListingPermanently', () => {
  it('removes listing from the database', async () => {
    const listing = await createListing({ ...baseListing });
    await deleteListingPermanently(listing._id);
    const found = await getListingById(listing._id.toString());
    expect(found).toBeNull();
  });
});

// ─── getListingStats ──────────────────────────────────────────────────────────

describe('getListingStats', () => {
  it('returns zeroed stats when collection is empty', async () => {
    const stats = await getListingStats();
    expect(stats.totalListings).toBe(0);
    expect(stats.totalViews).toBe(0);
  });

  it('counts published listings', async () => {
    await createListing({ ...baseListing, sku: 'S1' });
    await createListing({ ...baseListing, sku: 'S2', title: 'Book Two' });
    const stats = await getListingStats();
    expect(stats.totalListings).toBe(2);
  });
});
