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

// ----------------- PLACEHOLDER IMAGE -----------------
const generatePlaceholderImage = (book: { title: string; isbn: string; genre: string }): string => {
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

// ----------------- FETCH BOOKS (NOW SUPER FAST) -----------------
export const fetchBooks = async ({
  page = 1,
  limit = 20, // ← CHANGED from 1000 to 20 (you only show 5 per shelf!)
  sort = "createdAt",
  order = "desc",
  filters,
}: FetchBooksParams): Promise<{ books: Book[]; total: number }> => {
  try {
    const params: Record<string, any> = { page, limit, sort, order };

    if (filters) {
      if (filters.genre) params.category = filters.genre;
      if (filters.condition) params.condition = filters.condition;
      if (filters.priceMin != null) params.priceMin = filters.priceMin;
      if (filters.priceMax != null) params.priceMax = filters.priceMax;
      if (filters.rating != null) params.rating = filters.rating;
      if (filters.stock) params.stock = filters.stock;
      if (filters["discount.isActive"]) params["discount.isActive"] = filters["discount.isActive"];
      if (filters["discount.value"]) params["discount.value"] = filters["discount.value"];
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
      total: response.data.meta?.count || books.length * 10,
    };
  } catch (error) {
    console.error("Error fetching books:", error instanceof Error ? error.message : error);
    throw error;
  }
};

// ----------------- CATEGORIES – INSTANT + BACKGROUND REFRESH -----------------
let cachedCategories: string[] | null = null;

// Instant fallback (shows immediately while real ones load)
const fallbackCategories = [
  "Mindfulness", "Technology", "Psychology", "Self-Help", "Mystery",
  "Contemporary Fiction", "Drama", "Biography", "Leadership", "Poetry",
  "History", "Cookbooks", "Art", "Comics", "Children's Books", "Humor",
  "Entrepreneurship", "Asian Literature"
].sort();

export const fetchCategories = async (forceRefresh = false): Promise<string[]> => {
  // Return cached or fallback INSTANTLY
  if (!forceRefresh && cachedCategories) {
    return cachedCategories;
  }

  // First time? Return fallback immediately, then update in background
  if (!cachedCategories) {
    cachedCategories = fallbackCategories;
    // Fire and forget real fetch
    refreshCategoriesInBackground();
  }

  return cachedCategories;
};

// Background refresh – never blocks UI
const refreshCategoriesInBackground = async () => {
  try {
    // BEST CASE: You have a dedicated /categories endpoint
    const response = await axios.get(
      "https://britbooks-api-production.up.railway.app/api/market/categories"
    );
    if (response.data && Array.isArray(response.data)) {
      cachedCategories = response.data.sort();
      return;
    }
  } catch {
    // Ignore – fall back to small listings request
  }

  try {
    // WORST CASE: Still fast – only 100 books needed to get all categories
    const response = await axios.get(
      "https://britbooks-api-production.up.railway.app/api/market/admin/listings",
      { params: { page: 1, limit: 100 } } // ← Only 100, not 30,000!
    );

    const unique = Array.from(
      new Set(
        response.data.listings
          .map((l: any) => l.category)
          .filter((cat: string) => cat && cat.trim())
      )
    ).sort();

    if (unique.length > 0) {
      cachedCategories = unique;
    }
  } catch (error) {
    console.log("Background category refresh failed – using fallbacks");
  }
};