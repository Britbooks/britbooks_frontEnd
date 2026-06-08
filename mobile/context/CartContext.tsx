import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { storage } from '../utils/storage';
import { CartItem } from '../types';
import { emitCartToast } from '../utils/cartToast';
import { apiClient } from '../services/api';
import { ENDPOINTS } from '../constants/Api';
import { useAuth } from './AuthContext';

type CartAction =
  | { type: 'LOAD'; items: CartItem[] }
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE_QTY'; id: string; quantity: number }
  | { type: 'CLEAR' };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'LOAD':
      return action.items;
    case 'ADD': {
      const existing = state.find((i) => i.id === action.item.id);
      if (existing) {
        return state.map((i) =>
          i.id === action.item.id
            ? { ...i, quantity: Math.min(i.quantity + action.item.quantity, i.stock) }
            : i
        );
      }
      return [...state, action.item];
    }
    case 'REMOVE':
      return state.filter((i) => i.id !== action.id);
    case 'UPDATE_QTY':
      return state.map((i) =>
        i.id === action.id ? { ...i, quantity: Math.max(1, Math.min(action.quantity, i.stock)) } : i
      );
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [items, dispatch] = useReducer(cartReducer, []);

  // Keep a ref so async callbacks always see the latest values.
  const authRef = useRef({ user, token });
  authRef.current = { user, token };

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const syncedRef = useRef(false);

  // ── Load from local storage on mount ─────────────────────────────────────
  useEffect(() => {
    storage.getCart<CartItem[]>().then((saved) => {
      if (saved && saved.length > 0) dispatch({ type: 'LOAD', items: saved });
    });
  }, []);

  // ── Persist locally on every change ──────────────────────────────────────
  useEffect(() => {
    storage.saveCart(items);
  }, [items]);

  // ── Push to server (debounced) on every change while logged in ────────────
  useEffect(() => {
    const { user: u, token: t } = authRef.current;
    if (!u || !t) return;

    const timer = setTimeout(() => {
      apiClient
        .put(ENDPOINTS.users.cart(u.userId), { cart: itemsRef.current })
        .catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [items]);

  // ── On login: pull server cart; on logout: reset sync flag ───────────────
  useEffect(() => {
    if (token && user) {
      if (syncedRef.current) return;
      syncedRef.current = true;

      (async () => {
        try {
          const res = await apiClient.get(ENDPOINTS.users.cart(user.userId));
          const serverCart: CartItem[] = res.data.cart ?? [];

          if (serverCart.length > 0) {
            dispatch({ type: 'LOAD', items: serverCart });
          } else {
            // Push local cart if server is empty.
            const local = await storage.getCart<CartItem[]>();
            if (local && local.length > 0) {
              await apiClient.put(ENDPOINTS.users.cart(user.userId), { cart: local });
            }
          }
        } catch {
          // Keep using local cart on network error.
        }
      })();
    } else {
      syncedRef.current = false;
    }
  }, [token, user?.userId]);

  // ── Derived values ────────────────────────────────────────────────────────
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ── Mutators ──────────────────────────────────────────────────────────────
  function addToCart(item: Omit<CartItem, 'quantity'>, qty = 1) {
    dispatch({ type: 'ADD', item: { ...item, quantity: qty } });
    emitCartToast({ title: item.title, img: item.img, price: item.price });
  }

  function removeFromCart(id: string) {
    dispatch({ type: 'REMOVE', id });
  }

  function updateQuantity(id: string, quantity: number) {
    dispatch({ type: 'UPDATE_QTY', id, quantity });
  }

  function clearCart() {
    dispatch({ type: 'CLEAR' });
    const { user: u, token: t } = authRef.current;
    if (u && t) {
      apiClient.put(ENDPOINTS.users.cart(u.userId), { cart: [] }).catch(() => {});
    }
  }

  function isInCart(id: string) {
    return items.some((i) => i.id === id);
  }

  return (
    <CartContext.Provider
      value={{ items, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart, isInCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
