import { useState, useEffect } from 'react';
import { fetchBooks } from '../data/books';

export const useShelf = (
  shelfKey: string,
  page: number = 1,
  limit: number = 5,
  category: string | null = null // 👈 1. Added category parameter
) => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShelf = async () => {
      setLoading(true);

      try {
        const data = await fetchBooks({ 
          shelf: shelfKey || null, 
          category: category || null, // 👈 2. Pass category to the API
          page, 
          limit 
        });

        if (data?.listings) {
          setBooks(data.listings);
        }
      } catch (err) {
        console.error(`Error loading shelf ${shelfKey || category}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadShelf();
    // 👈 3. Added category to the dependency array
  }, [shelfKey, page, limit, category]); 

  return { books, loading };
};