import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../utils/storage';
import { WishlistItem } from '../types';
import { emitWishlistToast } from '../utils/wishlistToast';

interface WishlistContextValue {
  items: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    storage.getWishlist<WishlistItem[]>().then((saved) => {
      if (saved) setItems(saved);
    });
  }, []);

  useEffect(() => {
    storage.saveWishlist(items);
  }, [items]);

  function addToWishlist(item: WishlistItem) {
    setItems((prev) => (prev.find((i) => i.id === item.id) ? prev : [...prev, item]));
    emitWishlistToast({ title: item.title, img: item.img });
  }

  function removeFromWishlist(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function isInWishlist(id: string) {
    return items.some((i) => i.id === id);
  }

  function clearWishlist() {
    setItems([]);
  }

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
