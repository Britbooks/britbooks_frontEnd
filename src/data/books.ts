import axios from "axios";
import { MD5 } from "crypto-js";

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  imageUrl?: string;
  genre: string;
  condition: string;
  description?: string;
  stock: number;
  rating?: number;
  isbn: string;
  pages?: number;
  releaseDate?: string;
}

interface FetchBooksParams {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
  filters?: Record<string, any>;
}

export interface Category {
  name: string;
  imageUrl: string;
}

/* ----------------------------------------------------------
   PLACEHOLDER IMAGES
---------------------------------------------------------- */
export const generatePlaceholderImage = (book: {
  title: string;
  isbn: string;
  genre: string;
}): string => {
  const input = book.isbn || book.title || "unknown";
  const hash = MD5(input).toString().slice(0, 8);

  const genreColors: Record<string, string> = {
    Mindfulness: "zen",
    Technology: "tech",
    Psychology: "psych",
    "Self-Help": "selfhelp",
    Mystery: "mystery",
    "Contemporary Fiction": "fiction",
    Drama: "drama",
    Biography: "bio",
    Leadership: "lead",
    "Asian Literature": "asianlit",
    Entrepreneurship: "entrepreneur",
    Poetry: "poetry",
    Humor: "humor",
    History: "history",
    Cookbooks: "cook",
    Art: "art",
    Comics: "comics",
    childrensBooks: "children",
    "Children's Books": "children",
    default: "book",
  };

  const genreKey = genreColors[book.genre] || genreColors.default;
  return `https://picsum.photos/seed/${hash}-${genreKey}/300/450`;
};

const generateCategoryPlaceholder = (name: string) =>
  `https://picsum.photos/seed/category-${MD5(name).toString().slice(0, 8)}/300/200`;

/* ----------------------------------------------------------
   CACHING FOR fetchBooks
---------------------------------------------------------- */
interface CacheEntry {
  books: Book[];
  total: number;
  timestamp: number;
}

const booksCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const generateCacheKey = (params: FetchBooksParams): string => {
  const normalizedFilters = params.filters
    ? JSON.stringify(params.filters, Object.keys(params.filters).sort())
    : null;

  return JSON.stringify({
    page: params.page,
    limit: params.limit,
    sort: params.sort || "createdAt",
    order: params.order || "desc",
    filters: normalizedFilters,
  });
};

/* ----------------------------------------------------------
   FETCH BOOKS — Now with Smart Caching
---------------------------------------------------------- */
export const fetchBooks = async ({
  page = 1,
  limit = 20,
  sort = "createdAt",
  order = "desc",
  filters,
}: FetchBooksParams): Promise<{ books: Book[]; total: number }> => {
  const cacheKey = generateCacheKey({ page, limit, sort, order, filters });
  const now = Date.now();

  // Return cached data if still fresh
  const cached = booksCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log(`Cache HIT: ${cacheKey.substring(0, 60)}...`);
    return { books: cached.books, total: cached.total };
  }

  console.log(`Cache MISS → Fetching from API: ${cacheKey.substring(0, 60)}...`);

  try {
    const params: Record<string, any> = { page, limit, sort, order };

    if (filters) {
      if (filters.genre) params.category = filters.genre;
      if (filters.condition) params.condition = filters.condition;
      if (filters.priceMin != null) params.priceMin = filters.priceMin;
      if (filters.priceMax != null) params.priceMax = filters.priceMax;
      if (filters.rating != null) params.rating = filters.rating;
      if (filters.stock != null) params.stock = filters.stock;
      if (filters["discount.isActive"] != null)
        params["discount.isActive"] = filters["discount.isActive"];
      if (filters["discount.value"] != null)
        params["discount.value"] = filters["discount.value"];
    }

    const response = await axios.get(
      "https://britbooks-api-production.up.railway.app/api/market/admin/listings",
      { params }
    );

    const books: Book[] = response.data.listings.map((listing: any) => {
      const imageUrl = generatePlaceholderImage({
        title: listing.title || "Unknown",
        isbn: listing.isbn || listing.title || "unknown",
        genre: listing.category || "default",
      });

      return {
        id: String(listing._id || listing.id),
        title: listing.title || "Untitled",
        author: listing.author || "Unknown Author",
        price: listing.price ?? 0,
        imageUrl,
        genre: listing.category || "Unknown",
        condition: listing.condition || "Good",
        description: listing.notes || listing.description || "",
        stock: listing.stock ?? 0,
        rating: listing.rating ?? 4.5,
        isbn: listing.isbn || "",
        pages: listing.pages || 300,
        releaseDate: listing.listedAt || new Date().toISOString(),
      };
    });

    const result = {
      books,
      total: response.data.meta?.count ?? books.length,
    };

    // Cache the result
    booksCache.set(cacheKey, {
      books,
      total: result.total,
      timestamp: now,
    });

    return result;
  } catch (error) {
    console.error("Error fetching books:", error instanceof Error ? error.message : error);
    throw error;
  }
};

/* ----------------------------------------------------------
   CATEGORIES — Cached
---------------------------------------------------------- */
let cachedCategories: string[] | null = null;
let categoriesPromise: Promise<string[]> | null = null;

export const fetchCategories = async (): Promise<string[]> => {
  if (cachedCategories) return cachedCategories;
  if (categoriesPromise) return categoriesPromise;

  categoriesPromise = (async () => {
    let categoryNames: string[] = [];

    try {
      const response = await axios.get(
        "https://britbooks-api-production.up.railway.app/api/market/categories"
      );

      if (response.data?.success && Array.isArray(response.data.categories)) {
        categoryNames = response.data.categories
          .map((c: any) => String(c.name || c).trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
      }
    } catch (err) {
      console.warn("Categories endpoint failed, scanning listings...");
    }

    if (categoryNames.length === 0) {
      try {
        const response = await axios.get(
          "https://britbooks-api-production.up.railway.app/api/market/admin/listings",
          { params: { limit: 5000 } }
        );

        const categories = response.data.listings
          .map((l: any) => l.category)
          .filter((cat: string) => cat?.trim())
          .map((cat: string) => cat.trim());

        categoryNames = Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b));
      } catch (err) {
        console.error("Failed to extract categories from listings:", err);
      }
    }

    cachedCategories = categoryNames.length > 0 ? categoryNames : ["Fiction", "Non-Fiction"];
    return cachedCategories;
  })();

  return categoriesPromise;
};

/* ----------------------------------------------------------
   UTILS
---------------------------------------------------------- */
export const clearBooksCache = () => {
  booksCache.clear();
  console.log("Books cache cleared");
};

export const fetchAllBooks = async (
  customParams: Omit<FetchBooksParams, "page" | "limit"> = {},
  batchLimit = 100
): Promise<Book[]> => {
  let allBooks: Book[] = [];
  let page = 1;
  let total = 0;

  do {
    const { books, total: responseTotal } = await fetchBooks({
      ...customParams,
      page,
      limit: batchLimit,
    });

    allBooks.push(...books);
    total = responseTotal || total;

    console.log(`Fetched page ${page}: ${books.length} books (total: ${allBooks.length}/${total})`);

    if (books.length === 0) break;
    page++;
    await new Promise((r) => setTimeout(r, 300)); // Be gentle
  } while (allBooks.length < total);

  console.log(`Fetched all ${allBooks.length} books.`);
  return allBooks;
};