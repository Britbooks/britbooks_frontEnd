import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'britbooks_auth_token';
const USER_KEY = 'britbooks_auth_user';
const CART_KEY = 'britbooks_cart';
const WISHLIST_KEY = 'britbooks_wishlist';
const RECENTLY_VIEWED_KEY = 'britbooks_recently_viewed';

export const storage = {
  async saveToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async removeToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async saveUser(user: object) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  async getUser<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async removeUser() {
    await AsyncStorage.removeItem(USER_KEY);
  },

  async saveCart(cart: object) {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
  },
  async getCart<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  async saveWishlist(wishlist: object) {
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  },
  async getWishlist<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  async saveRecentlyViewed(items: object) {
    await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));
  },
  async getRecentlyViewed<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  async clearAuth() {
    await Promise.all([storage.removeToken(), storage.removeUser()]);
  },
};
