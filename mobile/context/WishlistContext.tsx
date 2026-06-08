import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { storage } from '../utils/storage';
import { WishlistItem } from '../types';
import { emitWishlistToast } from '../utils/wishlistToast';
import { apiClient } from '../services/api';
import { ENDPOINTS } from '../constants/Api';
import { useAuth } from './AuthContext';

interface WishlistContextValue {
  items: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);

  const authRef = useRef({ user, token });
  authRef.current = { user, token };

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const syncedRef = useRef(false);

  // ── Load from local storage on mount ─────────────────────────────────────
  useEffect(() => {
    storage.getWishlist<WishlistItem[]>().then((saved) => {
      if (saved && saved.length > 0) setItems(saved);
    });
  }, []);

  // ── Persist locally on every change ──────────────────────────────────────
  useEffect(() => {
    storage.saveWishlist(items);
  }, [items]);

  // ── Push to server (debounced) on every change while logged in ────────────
  useEffect(() => {
    const { user: u, token: t } = authRef.current;
    if (!u || !t) return;

    const timer = setTimeout(() => {
      apiClient
        .put(ENDPOINTS.users.wishlist(u.userId), { wishlist: itemsRef.current })
        .catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [items]);

  // ── On login: pull server wishlist; on logout: reset sync flag ────────────
  useEffect(() => {
    if (token && user) {
      if (syncedRef.current) return;
      syncedRef.current = true;

      (async () => {
        try {
          const res = await apiClient.get(ENDPOINTS.users.wishlist(user.userId));
          const serverList: WishlistItem[] = res.data.wishlist ?? [];

          if (serverList.length > 0) {
            setItems(serverList);
          } else {
            const local = await storage.getWishlist<WishlistItem[]>();
            if (local && local.length > 0) {
              await apiClient.put(ENDPOINTS.users.wishlist(user.userId), { wishlist: local });
            }
          }
        } catch {
          // Keep using local wishlist on network error.
        }
      })();
    } else {
      syncedRef.current = false;
    }
  }, [token, user?.userId]);

  // ── Mutators ──────────────────────────────────────────────────────────────
  function addToWishlist(item: WishlistItem) {
    setItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      emitWishlistToast({ title: item.title, img: item.img });
      return [...prev, item];
    });
  }

  function removeFromWishlist(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function isInWishlist(id: string) {
    return items.some((i) => i.id === id);
  }

  function clearWishlist() {
    setItems([]);
    const { user: u, token: t } = authRef.current;
    if (u && t) {
      apiClient.put(ENDPOINTS.users.wishlist(u.userId), { wishlist: [] }).catch(() => {});
    }
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
