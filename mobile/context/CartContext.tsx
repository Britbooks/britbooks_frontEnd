import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { storage } from '../utils/storage';
import { CartItem } from '../types';
import { emitCartToast } from '../utils/cartToast';

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
  const [items, dispatch] = useReducer(cartReducer, []);

  useEffect(() => {
    storage.getCart<CartItem[]>().then((saved) => {
      if (saved) dispatch({ type: 'LOAD', items: saved });
    });
  }, []);

  useEffect(() => {
    storage.saveCart(items);
  }, [items]);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

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
