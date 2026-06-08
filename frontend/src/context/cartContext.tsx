import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './authContext';

export interface CartItem {
  id: string;
  img: string;
  title: string;
  author: string;
  price: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const API_BASE = 'https://britbooks-api-production-8ebd.up.railway.app/api';

// Price stored on server as plain number (e.g. 5.99); UI uses "£5.99" strings.
function toNumber(price: string | number): number {
  if (typeof price === 'number') return price;
  return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
}

function toString(price: number | string): string {
  if (typeof price === 'string' && price.startsWith('£')) return price;
  return `£${Number(price).toFixed(2)}`;
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { auth } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cartItems');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep a ref so async callbacks always see the latest auth without re-registering effects.
  const authRef = useRef(auth);
  authRef.current = auth;

  // Whether we have already pulled from the server for this login session.
  const syncedRef = useRef(false);

  // ── Persist locally on every change ──────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // ── Push to server (debounced) on every change while logged in ────────────
  useEffect(() => {
    const { token, userId } = authRef.current;
    if (!token || !userId) return;

    const timer = setTimeout(() => {
      const normalized = cartItems.map(item => ({ ...item, price: toNumber(item.price) }));
      axios
        .put(`${API_BASE}/users/${userId}/cart`, { cart: normalized }, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [cartItems]);

  // ── On login: pull server cart; on logout: reset sync flag ───────────────
  useEffect(() => {
    if (auth.loading) return;

    if (auth.token && auth.userId) {
      if (syncedRef.current) return;
      syncedRef.current = true;

      (async () => {
        try {
          const res = await axios.get(`${API_BASE}/users/${auth.userId}/cart`, {
            headers: { Authorization: `Bearer ${auth.token}` },
          });
          const serverCart: any[] = res.data.cart ?? [];

          if (serverCart.length > 0) {
            // Server has saved items — use them as source of truth.
            setCartItems(serverCart.map(item => ({ ...item, price: toString(item.price) })));
          } else {
            // Server cart is empty — push whatever is stored locally.
            const local: CartItem[] = JSON.parse(localStorage.getItem('cartItems') || '[]');
            if (local.length > 0) {
              const normalized = local.map(item => ({ ...item, price: toNumber(item.price) }));
              await axios.put(
                `${API_BASE}/users/${auth.userId}/cart`,
                { cart: normalized },
                { headers: { Authorization: `Bearer ${auth.token}` } }
              );
            }
          }
        } catch {
          // Network error — keep using local cart silently.
        }
      })();
    } else {
      syncedRef.current = false;
    }
  }, [auth.token, auth.userId, auth.loading]);

  // ── Mutators ──────────────────────────────────────────────────────────────

  const addToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.id === item.id ? { ...c, quantity: c.quantity + item.quantity } : c
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) { removeFromCart(id); return; }
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
    const { token, userId } = authRef.current;
    if (token && userId) {
      axios
        .put(`${API_BASE}/users/${userId}/cart`, { cart: [] }, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {});
    }
  };

  const cartCount = cartItems.length;

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
