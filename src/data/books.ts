import axios from "axios";
import { MD5 } from "crypto-js";
import toast from "react-hot-toast";

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
    String(body.page  ?? 1),
    String(body.limit ?? 20),
  ].join("|");
}

// ── Shelf definitions ────────────────────────────────────────────────────
export const SHELVES = [
  { key: "newArrivals",     label: "New Arrivals"     },
  { key: "popularBooks",    label: "Popular Books"    },
  { key: "bestSellers",     label: "Best Sellers"     },
  { key: "childrensBooks",  label: "Children's Books" },
  { key: "clearanceItems",  label: "Clearance Items"  },
  { key: "recentlyViewed",  label: "Recently Viewed"  },
] as const;

// ── Fetch Books ──────────────────────────────────────────────────────────
// ── Fetch Books ──────────────────────────────────────────────────────────
export const fetchBooks = async (reqBody: any = {}, signal?: AbortSignal) => {
  const effectiveBody = {
    page: reqBody.page ?? 1,
    limit: reqBody.limit ?? 20,
    shelf: reqBody.shelf ?? null,
    category: reqBody.category ?? null,
    subcategory: reqBody.subcategory ?? null,
    filters: reqBody.filters ?? {},
    includeArchived: reqBody.includeArchived ?? false,
    sort: reqBody.sort ?? "listedAt",
    order: reqBody.order ?? "desc",
  };

  // Remove special overrides; let backend handle shelves internally
  // Shelf should not nullify category/subcategory unless backend requires it

  const cacheKey = fastCacheKey(effectiveBody);
  const cached = booksCache.get(cacheKey);

  let cacheMs = CACHE_DURATIONS.default;
  if (["popularBooks", "bestSellers"].includes(effectiveBody.shelf ?? "")) cacheMs = CACHE_DURATIONS.popular;
  else if (!effectiveBody.shelf?.includes("viewed")) cacheMs = CACHE_DURATIONS.static;

  if (cached && Date.now() - cached.timestamp < cacheMs) return cached.response;

  try {
    const response = await axios.post(
      "https://britbooks-api-production.up.railway.app/api/market/admin/listings",
      effectiveBody,
      { signal }
    );

    if (!response.data?.success || !Array.isArray(response.data.listings)) throw new Error("Invalid API response");

    const listings = response.data.listings.map((raw: any) => {
      const categoryName = raw.category ?? raw.subcategory ?? "Uncategorized";
      const originalTitle = raw.title?.trim() || "Untitled";

      let cleanedTitle = originalTitle;
      const skuMatch = originalTitle.match(/\((\d+)\)$/);
      if (skuMatch) {
        cleanedTitle = originalTitle.replace(/\s*\(\d+\)$/, '').trim();
      }

      return {
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
    });

    const result = {
      success: true,
      listings,
      meta: response.data.meta ?? {
        count: listings.length,
        page: effectiveBody.page,
        limit: effectiveBody.limit,
        pages: Math.ceil(listings.length / effectiveBody.limit) || 1,
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
      "https://britbooks-api-production.up.railway.app/api/market/categories",
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