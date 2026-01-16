import axios from "axios";
import { MD5 } from "crypto-js";

// ── Types ────────────────────────────────────────────────────────────────
export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  imageUrl?: string;
  category: string; // ← Matches backend schema
  condition: string;
  description?: string;
  stock: number;
  rating?: number;
  isbn: string;
  pages?: number;
  releaseDate?: string;
}

interface FetchBooksParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  filters?: Record<string, any>;
  shelf?: "newArrivals" | "popularBooks" | "bestSellers" | "childrensBooks" | "clearanceItems" | "recentlyViewed";
}

// ── Categories ───────────────────────────────────────────────────────────
export interface ApiCategory {
  _id: string;
  name: string;
  slug?: string;
  count?: number;
}

// ── Placeholder images ───────────────────────────────────────────────────
export const generatePlaceholderImage = (book: { title: string; isbn?: string; category?: string }): string => {
  const input = book.isbn || book.title || "unknown-book";
  const hash = MD5(input).toString().slice(0, 8);

  const categorySeeds: Record<string, string> = {
    "Children's Books": "children",
    "Children's Fiction": "children",
    "Young Adult": "ya",
    Fiction: "fiction",
    "Contemporary Fiction": "fiction",
    "Literary Fiction": "fiction",
    Mystery: "mystery",
    Fantasy: "fantasy",
    "Science Fiction": "scifi",
    Biography: "bio",
    "Self-Help": "selfhelp",
    History: "history",
    "Non-Fiction": "nonfiction",
    Poetry: "poetry",
    default: "book",
  };

  const seed = book.category ? categorySeeds[book.category] || categorySeeds.default : categorySeeds.default;
  return `https://picsum.photos/seed/${hash}-${seed}/300/450`;
};

const generateCategoryPlaceholder = (name: string) =>
  `https://picsum.photos/seed/category-${MD5(name).toString().slice(0, 8)}/300/200`;

// ── Caching ─────────────────────────────────────────────────────────────
interface CacheEntry {
  books: Book[];
  total: number;
  timestamp: number;
}

const booksCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const generateCacheKey = (params: Required<FetchBooksParams>): string => {
  const sortedFilters = params.filters
    ? Object.fromEntries(Object.entries(params.filters).sort(([a], [b]) => a.localeCompare(b)))
    : {};

  return JSON.stringify({
    page: params.page,
    limit: params.limit,
    sort: params.sort || "createdAt",
    order: params.order || "desc",
    filters: sortedFilters,
    shelf: params.shelf || null,
  });
};

// ── Fetch books aligned with backend ──────────────────────────────────────
export const fetchBooks = async ({
  page = 1,
  limit = 20,
  sort = "createdAt",
  order = "desc",
  filters = {},
  shelf = null,
}: FetchBooksParams = {}): Promise<{ books: Book[]; total: number }> => {
  const now = new Date();
  const fullParams: Required<FetchBooksParams> = { page, limit, sort, order, filters, shelf };
  const cacheKey = generateCacheKey(fullParams);

  const cached = booksCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[fetchBooks] Cache HIT: ${cacheKey.slice(0, 60)}...`);
    return { books: cached.books, total: cached.total };
  }

  // ── Shelf logic matching backend ────────────────────────────────────────
  const queryParams: Record<string, any> = { page, limit, sort, order, ...filters };
  switch (shelf) {
    case "newArrivals":
      queryParams.stock = { $gt: 0 };
      queryParams.sort = "createdAt";
      queryParams.order = "desc";
      break;

    case "popularBooks":
      queryParams.stock = { $gt: 0 };
      queryParams.sort = ["salesCount", "rating"];
      queryParams.order = ["desc", "desc"];
      break;

    case "bestSellers":
      queryParams.stock = { $gt: 0 };
      queryParams.sort = "salesCount";
      queryParams.order = "desc";
      break;

    case "childrensBooks":
      queryParams.category = { $regex: /(child|kids|young|nursery|fairy|juvenile)/i };
      queryParams.sort = "createdAt";
      queryParams.order = "desc";
      break;

    case "clearanceItems":
      Object.assign(queryParams, {
        "discount.isActive": true,
        "discount.value": { $gte: 10 },
        "discount.validFrom": { $lte: now },
        "discount.validUntil": { $gte: now },
      });
      queryParams.sort = "discount.value";
      queryParams.order = "desc";
      break;

    case "recentlyViewed":
      queryParams.sort = "lastViewedAt";
      queryParams.order = "desc";
      break;
  }

  try {
    const response = await axios.get(
      "https://britbooks-api-production.up.railway.app/api/market/admin/listings",
      { params: queryParams }
    );

    if (!response.data?.success || !Array.isArray(response.data.listings)) {
      throw new Error("Invalid API response format");
    }

    const books: Book[] = response.data.listings.map((raw: any) => {
      const imageUrl =
      raw.coverImageUrl ||
      generatePlaceholderImage({
        title: raw.title,
        isbn: raw.isbn,
        category: raw.category,
      });
    

      return {
        id: String(raw._id ?? raw.id ?? ""),
        title: raw.title ?? "Untitled",
        author: raw.author ?? "Unknown Author",
        price: Number(raw.price) || 0,
        imageUrl,
        category: raw.category ?? "Uncategorized",
        condition: (raw.condition ?? "good").toLowerCase(),
        description: raw.notes ?? raw.description ?? "",
        stock: Number(raw.stock) ?? 0,
        rating: raw.rating ?? undefined,
        isbn: raw.isbn ?? "",
        pages: raw.pages ?? undefined,
        releaseDate: raw.publicationDate ?? raw.listedAt ?? new Date().toISOString(),
      };
    });

    const total = response.data.meta?.count ?? response.data.meta?.total ?? books.length;

    // ── Cache results ─────────────────────────────────────────────────────
    booksCache.set(cacheKey, { books, total, timestamp: Date.now() });

    return { books, total };
  } catch (error) {
    console.error("[fetchBooks] Error:", error);
    throw error;
  }
};

// ── Categories ───────────────────────────────────────────────────────────
export async function fetchCategories(): Promise<ApiCategory[]> {
  try {
    const response = await axios.get(
      "https://britbooks-api-production.up.railway.app/api/market/categories"
    );

    if (!response.data?.success || !Array.isArray(response.data.categories)) {
      throw new Error("Invalid response");
    }

    return response.data.categories
      .map((c: any) => ({
        _id: String(c._id ?? c.id ?? "unknown"),
        name: String(c.name ?? "").trim(),
        slug: String(c.slug ?? ""),
        count: Number(c.count ?? 0),
      }))
      .filter(
        (c) =>
          c.name.length > 0 &&
          !["uncategorized", "unknown", "undetermined"].includes(c.name.toLowerCase())
      )
      .filter((cat) => cat.count >= 5)
      .sort((a, b) => b.count - a.count);
  } catch (err) {
    console.error("[fetchCategories] Failed:", err);
    return [
      { _id: "fb-fiction", name: "Fiction" },
      { _id: "fb-nonfiction", name: "Non-Fiction" },
      { _id: "fb-childrens", name: "Children's Books" },
      { _id: "fb-selfhelp", name: "Self-Help" },
    ];
  }
}

// ── Utils ───────────────────────────────────────────────────────────────
export const clearBooksCache = () => {
  booksCache.clear();
  console.log("[books.ts] Cache cleared");
};
