import axios from "axios";
import { MD5 } from "crypto-js";
import toast from "react-hot-toast";

// ── Shared types ─────────────────────────────────────────────────────────────
export interface Book {
  id: string;
  _id?: string;
  title: string;
  author: string;
  price: number;
  discountedPrice?: number | null;
  imageUrl: string;
  category: string;
  subcategory?: string;
  condition?: string;
  description?: string;
  stock: number;
  views?: number;
  purchases?: number;
  listedAt?: Date | null;
  updatedAt?: Date | null;
  isbn?: string;
  rating?: number;
  reviews?: number;
  pages?: number;
  releaseDate?: string | Date | null;
  totalSold?: number;
  revenue?: number;
}

export interface CategoryNode {
  _id: string;
  name: string;
  slug: string;
  count: number;
  children: Omit<CategoryNode, "children">[];
}

// ── Placeholder images ───────────────────────────────────────────────────
export const generatePlaceholderImage = (book) => {
  const input = book.isbn || book.title || `book-${Date.now()}`;
  const hash = MD5(input).toString().slice(0, 8);

  const seeds = {
    "Children's Books": "children",
    Fiction: "fiction",
    "Non-fiction": "nonfiction",
    "Self-Help": "selfhelp",
    default: "book",
  };

  const seed = book.category && seeds[book.category] ? seeds[book.category] : seeds.default;
  return `https://picsum.photos/seed/${hash}-${seed}/300/450`;
};

// ── Cache ────────────────────────────────────────────────────────────────
const booksCache = new Map<string, { response: any; timestamp: number }>();

const CACHE_DURATIONS = {
  default: 5 * 60 * 1000,          // 5 min
  popular: 30 * 60 * 1000,         // 30 min — best sellers, popular change slowly
  static:  60 * 60 * 1000,         // 1 hour — categories, children books, clearance
};

function fastCacheKey(body: any): string {
  return [
    body.shelf        ?? "",
    body.category     ?? "",
    body.subcategory  ?? "",
    body.search       ?? "",
    body.sort         ?? "",
    body.order        ?? "",
    String(body.page  ?? 1),
    String(body.limit ?? 20),
    JSON.stringify(body.filters ?? {}),
  ].join("|");
}

// ── Shelf definitions ────────────────────────────────────────────────────
// Backend overrides sort for every shelf:
//   newArrivals    → listedAt:-1, _id:-1          (stock > 0 required)
//   popularBooks   → purchases:-1, views:-1, listedAt:1
//   bestSellers    → Order aggregate by totalSold  (sort param ignored; limited fields returned)
//   childrensBooks → listedAt:-1                   (filters by category/tags)
//   clearanceItems → discount.value:-1             (discount.isActive=true, discount.value≥10)
export const SHELVES = [
  { key: "newArrivals",     label: "New Arrivals"     },
  { key: "popularBooks",    label: "Popular Books"    },
  { key: "bestSellers",     label: "Best Sellers"     },
  { key: "childrensBooks",  label: "Children's Books" },
  { key: "clearanceItems",  label: "Clearance Items"  },
  { key: "recentlyViewed",  label: "Recently Viewed"  },
] as const;

// Valid sort fields for non-shelf queries (actual MongoDB field names):
// "listedAt" | "price" | "purchases" | "views" | "stock"
// Do NOT use: "rating", "createdAt", "salesCount", "totalSold", "discountPercentage"
export const VALID_SORT_FIELDS = ["listedAt", "price", "purchases", "views", "stock"] as const;

// ── Fetch Books ──────────────────────────────────────────────────────────
export const fetchBooks = async (reqBody: any = {}, signal?: AbortSignal) => {
  const effectiveBody: any = {
    page: reqBody.page ?? 1,
    limit: reqBody.limit ?? 20,
    shelf: reqBody.shelf ?? null,
    category: reqBody.category ?? null,
    subcategory: reqBody.subcategory ?? null,
    includeArchived: reqBody.includeArchived ?? false,
    sort: reqBody.sort ?? "listedAt",
    order: reqBody.order ?? "desc",
    // Optional filters
    ...(reqBody.condition  && { condition:  reqBody.condition  }),
    ...(reqBody.priceMin   !== undefined && { priceMin: reqBody.priceMin }),
    ...(reqBody.priceMax   !== undefined && { priceMax: reqBody.priceMax }),
    ...(reqBody.skipCount  && { skipCount:  reqBody.skipCount  }),
    ...(reqBody.search     && { search:     reqBody.search     }),
  };

  const cacheKey = fastCacheKey(effectiveBody);
  const cached = booksCache.get(cacheKey);

  let cacheMs = CACHE_DURATIONS.default;
  if (["popularBooks", "bestSellers"].includes(effectiveBody.shelf ?? "")) cacheMs = CACHE_DURATIONS.popular;
  else if (["childrensBooks", "clearanceItems", "newArrivals"].includes(effectiveBody.shelf ?? "")) cacheMs = CACHE_DURATIONS.static;

  if (cached && Date.now() - cached.timestamp < cacheMs) return cached.response;

  try {
    const response = await axios.post(
      "https://britbooks-api-production-8ebd.up.railway.app/api/market/admin/listings",
      effectiveBody,
      { signal }
    );

    if (!response.data?.success || !Array.isArray(response.data.listings)) throw new Error("Invalid API response");

    const listings = response.data.listings.map((raw: any) => {
      const categoryName = raw.category ?? raw.subcategory ?? "Uncategorized";
      const originalTitle = raw.title?.trim() || "Untitled";

      let cleanedTitle = originalTitle;
      const skuMatch = originalTitle.match(/\((\d+)\)$/);
      if (skuMatch) cleanedTitle = originalTitle.replace(/\s*\(\d+\)$/, '').trim();

      const baseListing: any = {
        id: String(raw._id),
        title: cleanedTitle || "Untitled",
        author: raw.author?.trim() || "Unknown Author",
        price: Number(raw.price) || 0,
        discountedPrice: raw.discount?.isActive ? Number(raw.discountedPrice ?? raw.price) : null,
        imageUrl: raw.coverImageUrl?.trim()
          ? raw.coverImageUrl.replace(/^http:\/\//, "https://")
          : generatePlaceholderImage({ title: raw.title, isbn: raw.isbn, category: categoryName }),
        category: categoryName,
        subcategory: raw.subcategory ?? "",
        condition: String(raw.condition ?? "good").toLowerCase(),
        description: raw.notes ?? raw.description ?? "",
        stock: Number(raw.stock ?? 0),
        views: Number(raw.views ?? 0),
        purchases: Number(raw.purchases ?? 0),
        listedAt: raw.listedAt ? new Date(raw.listedAt) : null,
        updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
        isbn: raw.isbn ?? "",
      };

      // Add these for bestSellers only
      if (effectiveBody.shelf === "bestSellers") {
        baseListing.totalSold = Number(raw.totalSold ?? 0);
        baseListing.revenue = Number(raw.revenue ?? 0);
      }

      return baseListing;
    });

    const totalCount = response.data.meta?.count ?? listings.length;

    const result = {
      success: true,
      listings,
      meta: {
        ...response.data.meta,
        count: totalCount,
        page: effectiveBody.page,
        limit: effectiveBody.limit,
        pages: Math.ceil(totalCount / effectiveBody.limit) || 1,
      },
      shelves: SHELVES,
    };

    booksCache.set(cacheKey, { response: result, timestamp: Date.now() });
    return result;
  } catch (err: any) {
    if (axios.isCancel(err)) return null;

    console.error("[fetchBooks] Failed:", err.response?.data || err.message);
    toast.error("Failed to load books – please try again");
    throw err;
  }
};






// ── Fetch Categories ─────────────────────────────────────────────────────
export async function fetchCategories(signal?: AbortSignal) {
  try {
    const response = await axios.get(
      "https://britbooks-api-production-8ebd.up.railway.app/api/market/categories",
      { signal }
    );

    if (!response.data?.success || !Array.isArray(response.data.categories)) {
      throw new Error("Invalid categories response");
    }

    const mapped = response.data.categories
      .filter((cat: any) => (cat?.name ?? "").trim() && Number(cat?.count ?? 0) > 0)
      .map((cat: any) => {
        const name = (cat.name ?? "").trim();
        const slug = cat.slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        const children = (cat.subcategories ?? [])
          .filter((sub: any) => (sub?.name ?? "").trim() && Number(sub?.count ?? 0) > 0)
          .map((sub: any) => {
            const sName = (sub.name ?? "").trim();
            const sSlug = sub.slug || sName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

            return {
              _id:   String(sub._id ?? sub.slug ?? sName ?? `sub-${Math.random().toString(36).slice(2,8)}`),
              name:  sName,
              slug:  sSlug,
              count: Number(sub.count) || 0,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        return {
          _id:     String(cat._id ?? cat.slug ?? name ?? `cat-${Math.random().toString(36).slice(2,8)}`),
          name,
          slug,
          count:   Number(cat.count) || 0,
          children,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return mapped;

  } catch (err: any) {
    if (axios.isCancel(err)) return [];

    console.error("[fetchCategories] Failed:", err.message);
    toast.error("Failed to load categories");
    return [];
  }
}

// ── Utils ────────────────────────────────────────────────────────────────
export const clearBooksCache = () => {
  booksCache.clear();
};