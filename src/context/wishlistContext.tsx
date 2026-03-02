"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export interface WishlistItem {
  id: string;
  img: string;
  title: string;
  author: string;
  price: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  // Persist wishlist to localStorage
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = useCallback((input: WishlistItem) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === input.id);
      if (exists) {
        toast("Already in wishlist 💙");
        return prev;
      }

      const item: WishlistItem = {
        id: String(input.id),
        img: input.img?.trim() || `https://picsum.photos/seed/${input.id}/200/300`,
        title: input.title || "Untitled",
        author: input.author || "Unknown",
        price: input.price || "£0.00",
      };

      toast.success(`${item.title} added to wishlist!`);
      return [item, ...prev];
    });
  }, []);

  const removeFromWishlist = useCallback((id: string) => {
    setWishlist(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      toast.success(`${item.title} removed from wishlist`);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    toast.success("Wishlist cleared");
  }, []);

  const isInWishlist = useCallback((id: string) => {
    return wishlist.some(item => item.id === id);
  }, [wishlist]);

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};