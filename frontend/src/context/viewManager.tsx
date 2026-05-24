import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Book, generatePlaceholderImage } from '../data/books';

interface BookCardProps {
  id: string;
  img: string;
  title: string;
  author: string;
  price: string;
}

type ViewedBook = BookCardProps & { viewedAt: string };

interface RecentlyViewedContextType {
  recentlyViewed: ViewedBook[];
  addToRecentlyViewed: (book: BookCardProps) => void;
  clearRecentlyViewed: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [recentlyViewed, setRecentlyViewed] = useState<ViewedBook[]>(() => {
    const saved = localStorage.getItem('recently-viewed');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('recently-viewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

// In viewManager.tsx

const addToRecentlyViewed = useCallback((input: BookCardProps | Book) => {
  setRecentlyViewed(prev => {
    let book: BookCardProps;

    // Normalize input
    if ('imageUrl' in input) {
      // It's a raw Book
      book = {
        id: String((input as any)._id || input.id || 'unknown'),
        img: input.imageUrl?.trim() || generatePlaceholderImage(input),
        title: input.title || "Untitled",
        author: input.author || "Unknown",
        price: `£${Number(input.price || 0).toFixed(2)}`,
      };
    } else {
      // Already BookCardProps
      book = {
        ...input,
        img: input.img?.trim() || generatePlaceholderImage(input),
      };
    }

    const bookId = book.id;

    const filtered = prev.filter(b => b.id !== bookId);

    const newEntry: ViewedBook = {
      ...book,
      viewedAt: new Date().toISOString(),
    };

    return [newEntry, ...filtered].slice(0, 16);
  });
}, []);
  
  const clearRecentlyViewed = () => setRecentlyViewed([]);

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewed, addToRecentlyViewed, clearRecentlyViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  return context;
};