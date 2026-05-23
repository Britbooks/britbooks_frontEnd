import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

   export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
     const [cartItems, setCartItems] = useState<CartItem[]>(() => {
       const savedCart = localStorage.getItem('cartItems');
       return savedCart ? JSON.parse(savedCart) : [];
     });

     useEffect(() => {
       localStorage.setItem('cartItems', JSON.stringify(cartItems));
       console.log('Cart updated in localStorage:', cartItems);
     }, [cartItems]);

     const addToCart = (item: CartItem) => {
      setCartItems((prev) => {
        const existingItem = prev.find((cartItem) => cartItem.id === item.id);
    
        if (existingItem) {
          return prev.map((cartItem) =>
            cartItem.id === item.id
              ? {
                  ...cartItem,
                  quantity: cartItem.quantity + item.quantity,
                }
              : cartItem
          );
        }
    
        return [...prev, item];
      });
    
      console.log(`Added ${item.quantity} x ${item.title} to cart`);
    };

     const removeFromCart = (id: string) => {
       setCartItems((prev) => prev.filter((item) => item.id !== id));
       console.log(`Removed item with id ${id} from cart`);
     };

     const updateQuantity = (id: string, quantity: number) => {
       console.log(`Attempting to update quantity for item ${id} to ${quantity}`);
       if (quantity < 1) {
         console.log(`Quantity < 1, removing item ${id}`);
         removeFromCart(id);
         return;
       }
       setCartItems((prev) => [
         ...prev.map((item) =>
           item.id === id ? { ...item, quantity } : item
         ),
       ]);
       console.log(`Updated quantity for item ${id} to ${quantity}`);
     };

     const clearCart = () => {
       setCartItems([]);
       localStorage.removeItem('cartItems');
       console.log('Cleared cart');
     };

     const cartCount = cartItems.length; // Counts unique items

     return (
       <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount }}>
         {children}
       </CartContext.Provider>
     );
   };

   export const useCart = () => {
     const context = useContext(CartContext);
     if (!context) {
       throw new Error('useCart must be used within a CartProvider');
     }
     return context;
   };