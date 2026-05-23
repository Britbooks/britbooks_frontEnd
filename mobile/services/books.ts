import { apiClient } from './api';
import { ENDPOINTS } from '../constants/Api';
import { Book, Category, ListingsRequest } from '../types';

// ── Cache ─────────────────────────────────────────────────────────────────────
interface CacheEntry { data: any; expires: number; staleAt: number }
const cache = new Map<string, CacheEntry>();

// In-flight deduplication: same key → one request
const inFlight = new Map<string, Promise<any>>();

// Mirror frontend TTLs exactly
const CACHE_DURATIONS: Record<string, number> = {
  popularBooks:   30 * 60 * 1000,   // 30 min
  bestSellers:    30 * 60 * 1000,   // 30 min
  childrensBooks: 60 * 60 * 1000,   // 1 hr
  clearanceItems: 60 * 60 * 1000,   // 1 hr
  newArrivals:    60 * 60 * 1000,   // 1 hr
  default:         5 * 60 * 1000,   // 5 min
};

// Serve stale data while revalidating for 30 s after expiry
const STALE_WINDOW = 30 * 1000;

// ── Cache key ─────────────────────────────────────────────────────────────────
// Matches frontend's fastCacheKey: pipe-delimited, field-order independent,
// explicit nulls so {shelf:'x'} and {shelf:'x', category:null} are the same key.
function cacheKey(body: {
  shelf?: string | null;
  category?: string | null;
  subcategory?: string | null;
  search?: string | null;
  sort?: string | null;
  order?: string | null;
  page?: number;
  limit?: number;
}): string {
  return [
    body.shelf       ?? '',
    body.category    ?? '',
    body.subcategory ?? '',
    body.search      ?? '',
    body.sort        ?? '',
    body.order       ?? '',
    String(body.page  ?? 1),
    String(body.limit ?? 20),
  ].join('|');
}

// ── Synchronous cache read ────────────────────────────────────────────────────
// MUST normalize params before computing the key — fetchBooks stores data under
// the normalized key (with sort/order/page defaults filled in), so a raw-param
// key will never match.
export function getCached(params: ListingsRequest): { data: any; stale: boolean } | null {
  const entry = cache.get(cacheKey(normalizeBody(params)));
  if (!entry) return null;
  const now = Date.now();
  if (now < entry.expires) return { data: entry.data, stale: false };
  if (now < entry.staleAt) return { data: entry.data, stale: true };
  return null;
}

// ── Normalize request body (same as frontend effectiveBody) ───────────────────
function normalizeBody(params: ListingsRequest): Record<string, any> {
  return {
    page:           params.page  ?? 1,
    limit:          params.limit ?? 20,
    shelf:          params.shelf       ?? null,
    category:       params.category    ?? null,
    subcategory:    params.subcategory ?? null,
    includeArchived: false,
    sort:           params.sort  ?? 'listedAt',
    order:          params.order ?? 'desc',
    // Optional filters — only include when present
    ...(params.condition !== undefined && { condition:  params.condition  }),
    ...(params.priceMin  !== undefined && { priceMin:   params.priceMin   }),
    ...(params.priceMax  !== undefined && { priceMax:   params.priceMax   }),
  };
}

// ── Raw fetch + normalise response ────────────────────────────────────────────
async function doFetch(
  key: string,
  body: Record<string, any>,
  shelf?: string | null,
): Promise<{ books: Book[]; meta: any }> {
  const res = await apiClient.post(ENDPOINTS.market.listings, body);

  if (!res.data?.success || !Array.isArray(res.data.listings)) {
    throw new Error('Invalid API response');
  }

  const rawMeta = res.data.meta ?? {};
  // Always compute pages from count — never trust meta.pages (can be null on skipCount)
  const count = rawMeta.count ?? res.data.listings.length;
  const limit  = Number(body.limit ?? 20);
  const meta = {
    ...rawMeta,
    count,
    page:  Number(body.page ?? 1),
    limit,
    pages: Math.ceil(count / limit) || 1,
  };

  const books: Book[] = res.data.listings.map((raw: any) => {
    const rawPrice  = Number(raw.price) || 0;
    const discPct   = raw.discount?.isActive ? Number(raw.discount?.value ?? 0) : 0;
    const computed  = discPct > 0 ? Math.round(rawPrice * (1 - discPct / 100) * 100) / 100 : null;
    const discPrice = raw.discount?.isActive
      ? Number(raw.discountedPrice ?? computed ?? rawPrice)
      : null;

    return {
      _id:            String(raw._id || raw.id),
      title:          (raw.title?.trim() || 'Untitled').replace(/\s*\(\d+\)$/, ''),
      author:         raw.author?.trim() || 'Unknown Author',
      price:          rawPrice,
      discountedPrice: discPrice,
      discount:       raw.discount,
      coverImageUrl:  raw.coverImageUrl?.trim()
                        ? raw.coverImageUrl.replace(/^http:\/\//, 'https://')
                        : '',
      category:       raw.category ?? raw.subcategory ?? 'General',
      subcategory:    raw.subcategory ?? '',
      condition:      String(raw.condition ?? 'good').toLowerCase(),
      stock:          Number(raw.stock ?? 0),
      views:          Number(raw.views  ?? 0),
      purchases:      Number(raw.purchases ?? 0),
      listedAt:       raw.listedAt  ?? null,
      updatedAt:      raw.updatedAt ?? null,
      isbn:           raw.isbn ?? '',
      description:    raw.notes ?? raw.description ?? '',
      totalSold:      raw.totalSold != null ? Number(raw.totalSold) : undefined,
    };
  });

  const ttl    = CACHE_DURATIONS[shelf ?? ''] ?? CACHE_DURATIONS.default;
  const result = { books, meta };
  cache.set(key, { data: result, expires: Date.now() + ttl, staleAt: Date.now() + ttl + STALE_WINDOW });
  return result;
}

// ── Public fetch ──────────────────────────────────────────────────────────────
export async function fetchBooks(params: ListingsRequest): Promise<{ books: Book[]; meta: any }> {
  const body = normalizeBody(params);
  const key  = cacheKey(body);

  // Fresh hit → no network call
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expires) return entry.data;

  // Deduplicate concurrent requests for the same key
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = doFetch(key, body, params.shelf).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

// ── Book by ID ────────────────────────────────────────────────────────────────
export async function fetchBookById(id: string): Promise<Book> {
  const res = await apiClient.get(ENDPOINTS.market.listing(id));
  const d   = res.data.listing ?? res.data;
  const rawPrice = Number(d.price) || 0;
  const discPct  = d.discount?.isActive ? Number(d.discount?.value ?? 0) : 0;
  const discPrice = d.discount?.isActive
    ? Number(d.discountedPrice ?? (discPct > 0 ? Math.round(rawPrice * (1 - discPct / 100) * 100) / 100 : rawPrice))
    : undefined;

  return {
    _id:            String(d._id || d.id),
    title:          (d.title || 'Untitled').trim().replace(/\s*\(\d+\)$/, ''),
    author:         d.author || 'Unknown Author',
    price:          rawPrice,
    discountedPrice: discPrice,
    discount:       d.discount,
    coverImageUrl:  d.coverImageUrl?.replace(/^http:\/\//, 'https://') || '',
    category:       d.category || 'General',
    subcategory:    d.subcategory,
    condition:      String(d.condition ?? 'good').toLowerCase(),
    stock:          Number(d.stock ?? 1),
    views:          Number(d.views  ?? 0),
    purchases:      Number(d.purchases ?? 0),
    listedAt:       d.listedAt  ?? null,
    updatedAt:      d.updatedAt ?? null,
    isbn:           d.isbn ?? '',
    description:    d.description || d.notes || '',
    totalSold:      d.totalSold != null ? Number(d.totalSold) : undefined,
  };
}

// ── Categories ────────────────────────────────────────────────────────────────
// Mirrors frontend's fetchCategories normalisation: subcategories always have
// a valid _id, filtered to non-empty names and count > 0.
export async function fetchCategories(): Promise<Category[]> {
  const key    = 'categories';
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expires) return cached.data;

  const res  = await apiClient.get(ENDPOINTS.market.categories);
  if (!res.data?.success || !Array.isArray(res.data.categories)) return [];

  const ttl = 60 * 60 * 1000;

  const categories: Category[] = res.data.categories
    .filter((c: any) => c?.name?.trim() && Number(c?.count ?? 0) > 0)
    .map((c: any) => {
      const name = c.name.trim();
      const slug = c.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const subcategories: Category[] = (c.subcategories ?? [])
        .filter((s: any) => s?.name?.trim() && Number(s?.count ?? 0) > 0)
        .map((s: any, i: number) => {
          const sName = s.name.trim();
          const sSlug = s.slug || sName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          return {
            _id:   String(s._id ?? s.slug ?? `${slug}-sub-${i}`),
            name:  sName,
            slug:  sSlug,
            count: Number(s.count) || 0,
          };
        })
        .sort((a: Category, b: Category) => a.name.localeCompare(b.name));

      return {
        _id:   String(c._id ?? c.slug ?? `cat-${slug}`),
        name,
        slug,
        count: Number(c.count) || 0,
        subcategories,
      };
    })
    .sort((a: Category, b: Category) => a.name.localeCompare(b.name));

  cache.set(key, { data: categories, expires: Date.now() + ttl, staleAt: Date.now() + ttl + STALE_WINDOW });
  return categories;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getImageUrl(book: Book): string {
  if (book.coverImageUrl && book.coverImageUrl.startsWith('http')) return book.coverImageUrl;
  const seed = book.isbn || book._id || book.title;
  return `https://picsum.photos/seed/${seed}/300/450`;
}

export function getDisplayPrice(book: Book): number {
  if (book.discount?.isActive && book.discountedPrice) return book.discountedPrice;
  return book.price;
}

export function clearBooksCache(): void {
  cache.clear();
}
