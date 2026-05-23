import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [
      { id: 1, title: 'The Stardust Thief', author: 'Chelsea Abdullah', price: 18.99, imageUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1631541333l/58983556.jpg', quantity: 1 },
      { id: 2, title: 'Lessons in Chemistry', author: 'Bonnie Garmus', price: 15.50, imageUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1634768234l/58065033.jpg', quantity: 1 },
    ],
  },
  reducers: {
    addToCart: (state, action) => {
      const book = action.payload;
      const existingItem = state.items.find((item) => item.id === book.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...book, quantity: 1 });
      }
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((item) => item.id === id);
      if (item && quantity >= 1) {
        item.quantity = quantity;
      }
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addToCart, updateQuantity, removeItem } = cartSlice.actions;
export default cartSlice.reducer;