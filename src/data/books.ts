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

/* ----------------------------------------------------------
   PLACEHOLDER IMAGES
---------------------------------------------------------- */
const generatePlaceholderImage = (book: {
  title: string;
  isbn: string;
  genre: string;
}): string => {
  const input = book.isbn || book.title;
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

/* ----------------------------------------------------------
   FETCH BOOKS (Now Exactly Matches Backend Structure)
---------------------------------------------------------- */
export const fetchBooks = async ({
  page = 1,
  limit = 20,
  sort = "createdAt",
  order = "desc",
  filters,
}: FetchBooksParams): Promise<{ books: Book[]; total: number }> => {
  try {
    const params: Record<string, any> = {
      page,
      limit,
      sort,
      order,
    };

    // Correct query keys for backend
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
      let imageUrl = listing.coverImageUrl?.trim();
      if (!imageUrl && listing.samplePageUrls?.[0]?.trim()) {
        imageUrl = listing.samplePageUrls[0];
      }
      if (!imageUrl) {
        imageUrl = generatePlaceholderImage({
          title: listing.title,
          isbn: listing.isbn,
          genre: listing.category || "default",
        });
      }

      return {
        id: listing._id,
        title: listing.title,
        author: listing.author,
        price: listing.price,
        imageUrl,
        genre: listing.category || "Unknown",
        condition: listing.condition || "Good",
        description: listing.notes || "",
        stock: listing.stock || 0,
        rating: listing.rating || 4.5,
        isbn: listing.isbn || "",
        pages: listing.pages || 300,
        releaseDate: listing.listedAt || new Date().toISOString(),
      };
    });

    return {
      books,
      total: response.data.meta?.count || books.length,
    };
  } catch (error) {
    console.error("Error fetching books:", error instanceof Error ? error.message : error);
    throw error;
  }
};

/* ----------------------------------------------------------
   CATEGORIES — Cached + Background Refresh
---------------------------------------------------------- */
let cachedCategories: string[] | null = null;



/* ----------------------------------------------------------
   CATEGORIES — Real Only, No Fallbacks, Proper Loading State
---------------------------------------------------------- */

let categoriesPromise: Promise<string[]> | null = null;

export const fetchCategories = async (): Promise<string[]> => {
  // Return cached if already loaded
  if (cachedCategories) {
    return cachedCategories;
  }

  // Return same promise if already fetching (prevents duplicate requests)
  if (categoriesPromise) {
    return categoriesPromise;
  }

  // Start actual fetch
  categoriesPromise = (async () => {
    try {
      // 1. Try dedicated categories endpoint
      const response = await axios.get(
        "https://britbooks-api-production.up.railway.app/api/market/categories"
      );

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const cats = response.data
          .map((c: any) => String(c).trim())
          .filter((c: string) => c.length > 0);

        if (cats.length > 0) {
          cachedCategories = cats.sort((a, b) => a.localeCompare(b));
          return cachedCategories;
        }
      }
    } catch (error) {
      console.warn("Categories endpoint failed, falling back to listings scan");
    }

    // 2. Fallback: Scan listings to extract real categories
    try {
      const response = await axios.get(
        "https://britbooks-api-production.up.railway.app/api/market/admin/listings",
        { params: { limit: 500 } } // Get enough to discover all categories
      );

      const uniqueCategories = Array.from(
        new Set(
          response.data.listings
            .map((l: any) => l.category)
            .filter((cat: string | null) => cat?.trim())
            .map((cat: string) => cat.trim())
        )
      ).sort((a: string, b: string) => a.localeCompare(b));

      if (uniqueCategories.length > 0) {
        cachedCategories = uniqueCategories;
        return cachedCategories;
      }
    } catch (error) {
      console.error("Failed to extract categories from listings:", error);
    }

    // 3. Final fallback: return empty array (never fake data)
    console.error("No real categories could be loaded from backend");
    cachedCategories = [];
    return [];
  })();

  return categoriesPromise;
};

const refreshCategoriesInBackground = async () => {
  try {
    const response = await axios.get(
      "https://britbooks-api-production.up.railway.app/api/market/categories"
    );

    if (response.data && Array.isArray(response.data)) {
      cachedCategories = response.data.sort();
      return;
    }
  } catch {}

  try {
    const response = await axios.get(
      "https://britbooks-api-production.up.railway.app/api/market/admin/listings",
      { params: { page: 1, limit: 100 } }
    );

    const unique = Array.from(
      new Set(
        response.data.listings
          .map((l: any) => l.category)
          .filter((cat: string) => cat?.trim())
      )
    ).sort();

    if (unique.length > 0) cachedCategories = unique;
  } catch {}
};
