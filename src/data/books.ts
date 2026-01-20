import axios from "axios";
import { MD5 } from "crypto-js";

// ── Types ────────────────────────────────────────────────────────────────
export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  imageUrl?: string;
  category: string;
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

export interface CategoryNode extends ApiCategory {
  children: CategoryNode[];
}

// ── Placeholder images ───────────────────────────────────────────────────
export const generatePlaceholderImage = (book: { title: string; isbn?: string; category?: string }): string => {
  const input = book.isbn || book.title || "unknown-book";
  const hash = MD5(input).toString().slice(0, 8);

  const categorySeeds: Record<string, string> = {
    "Children's Books": "children",
    Fiction: "fiction",
    "Non-fiction": "nonfiction",
    "Self-Help": "selfhelp",
    default: "book",
  };

  const seed = book.category ? categorySeeds[book.category] || categorySeeds.default : categorySeeds.default;
  return `https://picsum.photos/seed/${hash}-${seed}/300/450`;
};

const generateCategoryPlaceholder = (name: string) =>
  `https://picsum.photos/seed/category-${MD5(name).toString().slice(0, 8)}/300/200`;

// ── Caching for books ───────────────────────────────────────────────────
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

// ── Fetch books (unchanged except small cleanup) ────────────────────────
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
    console.log(`[fetchBooks] Cache HIT`);
    return { books: cached.books, total: cached.total };
  }

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
    booksCache.set(cacheKey, { books, total, timestamp: Date.now() });

    return { books, total };
  } catch (error) {
    console.error("[fetchBooks] Error:", error);
    throw error;
  }
};

// ── fetchCategories – NOW PERFECTLY MATCHES YOUR BACKEND ───────────────
export async function fetchCategories(signal?: AbortSignal): Promise<CategoryNode[]> {
  try {
    const response = await axios.get(
      "https://britbooks-api-production.up.railway.app/api/market/categories",
      { signal }
    );

    if (!response.data?.success || !Array.isArray(response.data.categories)) {
      throw new Error("Invalid categories response");
    }

    // Map backend structure directly — clean only
    const categories: CategoryNode[] = response.data.categories
      .filter((cat: any) => cat.name?.trim() && Number(cat.count) > 0)
      .map((cat: any) => {
        const subs = (cat.subcategories || [])
          .filter((sub: any) => sub.name?.trim() && Number(sub.count) > 0)
          .map((sub: any) => ({
            _id: sub.slug || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: sub.name.trim(),
            slug: sub.slug || "",
            count: Number(sub.count),
            children: [],
          }))
          .sort((a, b) => b.count - a.count); // optional: sort by popularity

        return {
          _id: cat.slug || `main-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: cat.name.trim(),
          slug: cat.slug || "",
          count: Number(cat.count),
          children: subs,
        };
      })
      .sort((a, b) => b.count - a.count); // biggest first

    console.log(`Loaded ${categories.length} main categories with real subcategories`);

    return categories;

  } catch (err: any) {
    console.error("[fetchCategories] Failed:", err.message);
    toast.error("Failed to load categories");
    return [];
  }
}
// ── Utils ───────────────────────────────────────────────────────────────
export const clearBooksCache = () => {
  booksCache.clear();
  console.log("[books.ts] Cache cleared");
};