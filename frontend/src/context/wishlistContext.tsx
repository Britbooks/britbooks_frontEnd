"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "./authContext";

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

const API_BASE = 'https://britbooks-api-production-8ebd.up.railway.app/api';

function toNumber(price: string | number): number {
  if (typeof price === 'number') return price;
  return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
}

function toString(price: number | string): string {
  if (typeof price === 'string' && price.startsWith('£')) return price;
  return `£${Number(price).toFixed(2)}`;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const authRef = useRef(auth);
  authRef.current = auth;

  const syncedRef = useRef(false);

  // ── Persist locally ───────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // ── Push to server (debounced) on every change while logged in ────────────
  useEffect(() => {
    const { token, userId } = authRef.current;
    if (!token || !userId) return;

    const timer = setTimeout(() => {
      const normalized = wishlist.map(item => ({ ...item, price: toNumber(item.price) }));
      axios
        .put(`${API_BASE}/users/${userId}/wishlist`, { wishlist: normalized }, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [wishlist]);

  // ── On login: pull server wishlist; on logout: reset sync flag ────────────
  useEffect(() => {
    if (auth.loading) return;

    if (auth.token && auth.userId) {
      if (syncedRef.current) return;
      syncedRef.current = true;

      (async () => {
        try {
          const res = await axios.get(`${API_BASE}/users/${auth.userId}/wishlist`, {
            headers: { Authorization: `Bearer ${auth.token}` },
          });
          const serverList: any[] = res.data.wishlist ?? [];

          if (serverList.length > 0) {
            setWishlist(serverList.map(item => ({ ...item, price: toString(item.price) })));
          } else {
            const local: WishlistItem[] = JSON.parse(localStorage.getItem('wishlist') || '[]');
            if (local.length > 0) {
              const normalized = local.map(item => ({ ...item, price: toNumber(item.price) }));
              await axios.put(
                `${API_BASE}/users/${auth.userId}/wishlist`,
                { wishlist: normalized },
                { headers: { Authorization: `Bearer ${auth.token}` } }
              );
            }
          }
        } catch {
          // Keep local wishlist on error.
        }
      })();
    } else {
      syncedRef.current = false;
    }
  }, [auth.token, auth.userId, auth.loading]);

  // ── Mutators ──────────────────────────────────────────────────────────────

  const addToWishlist = useCallback((input: WishlistItem) => {
    setWishlist(prev => {
      if (prev.find(item => item.id === input.id)) {
        toast("Already in wishlist 💙");
        return prev;
      }
      const item: WishlistItem = {
        id: String(input.id),
        img: input.img?.trim() || `https://picsum.photos/seed/${input.id}/200/300`,
        title: input.title || 'Untitled',
        author: input.author || 'Unknown',
        price: input.price || '£0.00',
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
    toast.success('Wishlist cleared');
    const { token, userId } = authRef.current;
    if (token && userId) {
      axios
        .put(`${API_BASE}/users/${userId}/wishlist`, { wishlist: [] }, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {});
    }
  }, []);

  const isInWishlist = useCallback((id: string) => {
    return wishlist.some(item => item.id === id);
  }, [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
