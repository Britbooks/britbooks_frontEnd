import { useEffect, useRef, useState } from 'react';
import { fetchBooks, getCached } from '../services/books';
import { Book, ListingsRequest } from '../types';

export function useShelf(params: ListingsRequest) {
  // Stable key — deterministic regardless of object property order
  const key = JSON.stringify(
    Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)))
  );

  // Lazy initializers: run once at mount time, read from in-memory cache
  // synchronously so there is never a loading flash on revisits.
  const [books, setBooks] = useState<Book[]>(() => getCached(params)?.data.books ?? []);
  const [loading, setLoading] = useState<boolean>(() => !getCached(params));
  const [error, setError] = useState<string | null>(null);

  const fetchedKey = useRef('');   // tracks the last key we actually fetched

  useEffect(() => {
    // Same params as last fetch — nothing to do
    if (fetchedKey.current === key) return;
    fetchedKey.current = key;

    const hit = getCached(params);

    if (hit && !hit.stale) {
      // Cache is fresh — update state in case params changed, no network call
      setBooks(hit.data.books);
      setLoading(false);
      return;
    }

    // Stale-while-revalidate: show stale data immediately without a spinner
    if (hit?.stale) {
      setBooks(hit.data.books);
      setLoading(false);
    } else {
      // No cache at all — only show skeleton if we don't have books yet
      setLoading(prev => books.length === 0 ? true : prev);
    }

    let cancelled = false;
    fetchBooks(params)
      .then(({ books: b }) => {
        if (!cancelled) { setBooks(b); setLoading(false); }
      })
      .catch((e) => {
        if (!cancelled) { setError(e.message); setLoading(false); }
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { books, loading, error };
}
