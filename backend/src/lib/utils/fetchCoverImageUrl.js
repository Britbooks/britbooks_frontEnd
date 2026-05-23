import axios from "axios";
import Bottleneck from "bottleneck";
import axiosRetry from "axios-retry";

// ── Open Library (free, no API key, generous limits) ────────────
const OL_BOOKS_URL   = "https://openlibrary.org/api/books";
const OL_SEARCH_URL  = "https://openlibrary.org/search.json";

// ── Google Books (API key required, 1 000 free req/day) ─────────
const GOOGLE_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// Open Library: 20 concurrent, 50 ms apart (free service, be polite)
const olLimiter = new Bottleneck({ minTime: 50, maxConcurrent: 20 });

// Google Books: 5 concurrent, 200 ms apart (~5 req/s sustained)
const googleLimiter = new Bottleneck({ minTime: 200, maxConcurrent: 5 });

axiosRetry(axios, {
  retries: 3,
  retryDelay: (n) => n * 1000,
  retryCondition: (err) =>
    err.response?.status === 429 || axiosRetry.isNetworkError(err),
});

/* ─────────────────────────────────────────────────────────────────
   OPEN LIBRARY — batch ISBN lookup (up to 50 ISBNs per request)
   Returns: { [isbn]: coverUrl, ... }  — only entries that have covers
───────────────────────────────────────────────────────────────── */
export async function fetchOpenLibraryBatch(isbns) {
  if (!isbns.length) return {};

  return olLimiter.schedule(async () => {
    try {
      const bibkeys = isbns.map((i) => `ISBN:${i}`).join(",");
      const { data } = await axios.get(OL_BOOKS_URL, {
        params: { bibkeys, jscmd: "data", format: "json" },
        timeout: 15000,
      });

      const results = {};
      for (const isbn of isbns) {
        const entry = data[`ISBN:${isbn}`];
        if (!entry?.cover) continue;
        const url = entry.cover.large || entry.cover.medium || entry.cover.small;
        if (url) results[isbn] = url.replace("http://", "https://");
      }
      return results;
    } catch {
      return {};
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   OPEN LIBRARY — title + author search (no ISBN fallback)
───────────────────────────────────────────────────────────────── */
async function fetchOpenLibraryByTitle(title, author) {
  return olLimiter.schedule(async () => {
    try {
      const { data } = await axios.get(OL_SEARCH_URL, {
        params: {
          title,
          ...(author ? { author } : {}),
          limit: 5,
          fields: "cover_i,title",
        },
        timeout: 8000,
      });

      const hit = data.docs?.find((d) => d.cover_i);
      if (hit?.cover_i) {
        return `https://covers.openlibrary.org/b/id/${hit.cover_i}-L.jpg`;
      }
      return null;
    } catch {
      return null;
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   GOOGLE BOOKS — single query
───────────────────────────────────────────────────────────────── */
async function queryGoogleBooks(q) {
  return googleLimiter.schedule(async () => {
    const { data } = await axios.get(GOOGLE_BASE_URL, {
      params: { q, maxResults: 3, printType: "books", key: API_KEY },
      timeout: 5000,
    });
    return data.items || [];
  });
}

function extractGoogleCover(items) {
  for (const item of items) {
    const img = item.volumeInfo?.imageLinks;
    if (!img) continue;
    const url =
      img.extraLarge || img.large || img.medium || img.small || img.thumbnail;
    if (url)
      return url.replace("http://", "https://").replace("&edge=curl", "");
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────
   PUBLIC — single-book lookup (used by per-listing enrichment)
   Priority: OL by ISBN → OL by title → GB by ISBN → GB by title
───────────────────────────────────────────────────────────────── */
export async function fetchCoverImageUrl({ title, author, isbn }) {
  try {
    // 1. Open Library — ISBN
    if (isbn) {
      const batch = await fetchOpenLibraryBatch([isbn]);
      if (batch[isbn]) return batch[isbn];
    }

    // 2. Open Library — title + author
    if (title) {
      const url = await fetchOpenLibraryByTitle(title, author);
      if (url) return url;
    }

    // 3. Google Books — ISBN (only if OL missed)
    if (isbn && API_KEY) {
      const items = await queryGoogleBooks(`isbn:${isbn}`);
      const url = extractGoogleCover(items);
      if (url) return url;
    }

    // 4. Google Books — title + author
    if (title && API_KEY) {
      let q = `intitle:${title}`;
      if (author) q += `+inauthor:${author}`;
      const items = await queryGoogleBooks(q);
      const url = extractGoogleCover(items);
      if (url) return url;
    }

    return null;
  } catch {
    return null;
  }
}
