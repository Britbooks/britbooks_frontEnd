import { fetchBooks, fetchCategories } from '../services/books';

// Fire-and-forget: warm the in-memory cache before the home screen mounts.
// Results are stored in the books cache; useShelf reads them synchronously.
export function prefetchHomeData() {
  const shelves = [
    { shelf: 'newArrivals',    limit: 12 },
    { shelf: 'popularBooks',   limit: 12 },
    { shelf: 'bestSellers',    limit: 12 },
    { shelf: 'clearanceItems', limit: 12 },
    { shelf: 'childrensBooks', limit: 12 },
    { category: 'Fiction',     limit: 12 },
    { category: 'Non-Fiction', limit: 12 },
  ] as const;

  // All requests fire in parallel — deduplication in fetchBooks handles any
  // overlap with requests the home screen later makes.
  shelves.forEach(p => fetchBooks(p as any).catch(() => {}));
  fetchCategories().catch(() => {});
}
