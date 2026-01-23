import axios from "axios";
import { MD5 } from "crypto-js";
import toast from "react-hot-toast";

// ── Placeholder images ───────────────────────────────────────────────────
export const generatePlaceholderImage = (book) => {
  const input = book.isbn || book.title || "unknown-book";
  const hash = MD5(input).toString().slice(0, 8);

  const categorySeeds = {
    "Children's Books": "children",
    Fiction: "fiction",
    "Non-fiction": "nonfiction",
    "Self-Help": "selfhelp",
    default: "book",
  };

  const seed =
    book.category && categorySeeds[book.category]
      ? categorySeeds[book.category]
      : categorySeeds.default;

  return `https://picsum.photos/seed/${hash}-${seed}/300/450`;
};

// ── Cache ────────────────────────────────────────────────────────────────
const booksCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const generateCacheKey = (body) => JSON.stringify(body, Object.keys(body).sort());

// ── Shelf definitions for frontend UI (only special/algorithmic ones) ─────
export const SHELVES = [
  { key: "newArrivals",     label: "New Arrivals"     },
  { key: "popularBooks",    label: "Popular Books"    },
  { key: "bestSellers",     label: "Best Sellers"     },
  { key: "childrensBooks",  label: "Children's Books" },
  { key: "clearanceItems",  label: "Clearance Items"  },
  { key: "recentlyViewed",  label: "Recently Viewed"  },
];

// ── Fetch Books ──────────────────────────────────────────────────────────
export const fetchBooks = async (reqBody = {}) => {
  const cacheKey = generateCacheKey(reqBody);
  const cached = booksCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(
      "[fetchBooks] Cache HIT →",
      reqBody.shelf || reqBody.category || reqBody.subcategory || "general"
    );
    return cached.response;
  }

  try {
    console.log("[fetchBooks] Sending request:", JSON.stringify(reqBody, null, 2));

    const response = await axios.post(
      "https://britbooks-api-production.up.railway.app/api/market/admin/listings",
      reqBody,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.data?.success || !Array.isArray(response.data.listings)) {
      throw new Error(
        `Invalid response: success=${response.data?.success}, listings=${Array.isArray(response.data?.listings) ? 'array' : 'NOT array'}`
      );
    }

    const listings = response.data.listings.map((raw: any) => {
      // Prefer category for placeholder image seed, fallback to subcategory
      const primaryCategory = raw.category ?? raw.subcategory ?? "Uncategorized";
      const subcategory = raw.subcategory ?? "";

      return {
        id:          String(raw._id ?? raw.id ?? ""),
        title:       raw.title ?? "Untitled",
        author:      raw.author ?? "Unknown Author",
        price:       Number(raw.price) || 0,
        imageUrl:
          typeof raw.coverImageUrl === "string" && raw.coverImageUrl.trim()
            ? raw.coverImageUrl.replace(/^http:\/\//, "https://")
            : generatePlaceholderImage({
                title:    raw.title,
                isbn:     raw.isbn,
                category: primaryCategory,
              }),
        category:    primaryCategory,
        subcategory,
        condition:   String(raw.condition ?? "good").toLowerCase(),
        description: raw.notes ?? raw.description ?? "",
        stock:       Number(raw.stock ?? 0),
        rating:      raw.rating ?? undefined,
        isbn:        raw.isbn ?? "",
        pages:       raw.pages ?? undefined,
        releaseDate: raw.publicationDate ?? raw.listedAt ?? null,
      };
    });

    const result = {
      success: true,
      listings,
      meta: response.data.meta ?? {
        count: listings.length,
        page:  1,
        limit: listings.length,
        pages: 1,
      },
      shelves: SHELVES,
    };

    console.log(
      "[fetchBooks] Success - received",
      listings.length,
      "listings (meta total:",
      result.meta?.count ?? "unknown",
      ")"
    );

    booksCache.set(cacheKey, {
      response: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (err: any) {
    let msg = err.message || "Unknown error";

    if (err.response) {
      msg = `${err.response.status} - ${JSON.stringify(err.response.data || "No data")}`;
    } else if (err.request) {
      msg = "Network error - no response from server";
    }

    console.error("[fetchBooks] Failed:", msg, err.stack || "");
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
      throw new Error(
        `Invalid categories response: success=${response.data?.success}, categories is array=${Array.isArray(response.data?.categories)}`
      );
    }

    const rawCategories = response.data.categories;

    const mapped = rawCategories
      .filter((cat: any) => {
        const name = (cat?.name || "").trim();
        const count = Number(cat?.count ?? 0);
        return name && count > 0;
      })
      .map((cat: any) => {
        const name = (cat.name || "").trim();
        const slug = cat.slug || name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

        const children = (cat.subcategories || [])
          .filter((sub: any) => {
            const subName = (sub?.name || "").trim();
            const subCount = Number(sub?.count ?? 0);
            return subName && subCount > 0;
          })
          .map((sub: any) => {
            const subName = (sub.name || "").trim();
            const subSlug = sub.slug || subName
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "");

            return {
              _id: String(sub._id || sub.slug || subName || `sub-${Math.random().toString(36).slice(2, 8)}`),
              name: subName,
              slug: subSlug,
              count: Number(sub.count) || 0,
              children: [], // keep flat (no deeper nesting unless backend adds it)
            };
          })
          // Sort subcategories alphabetically (or change to .sort((a,b) => b.count - a.count) for popularity)
          .sort((a: any, b: any) => a.name.localeCompare(b.name));

        return {
          _id: String(cat._id || cat.slug || name || `cat-${Math.random().toString(36).slice(2, 8)}`),
          name,
          slug,
          count: Number(cat.count) || 0,
          children,
        };
      })
      // Sort main categories alphabetically
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    // Debug: show what actually arrived
    console.log(`[fetchCategories] Loaded ${mapped.length} categories`);
    mapped.forEach((cat, idx) => {
      console.log(`  ${idx + 1}. ${cat.name} (${cat.count})`);
      if (cat.children.length > 0) {
        console.log(`     → ${cat.children.length} subcategories`);
        cat.children.forEach((sub: any) =>
          console.log(`       - ${sub.name} (${sub.count})`)
        );
      }
    });

    return mapped;

  } catch (err: any) {
    const msg = err.response
      ? `${err.response.status} - ${JSON.stringify(err.response.data)}`
      : err.message || "Unknown error";

    console.error("[fetchCategories] Failed:", msg, err.stack);
    toast.error("Failed to load categories. Please try again later.");

    return [];
  }
}

// ── Utils ────────────────────────────────────────────────────────────────
export const clearBooksCache = () => {
  booksCache.clear();
  console.log("[books.js] Cache cleared");
};