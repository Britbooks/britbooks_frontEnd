import axios from 'axios';
import { storage } from '../utils/storage';
import { API_BASE } from '../constants/Api';

// ── In-memory token cache ─────────────────────────────────────────
// Avoids a SecureStore (Keychain) read on every request.
// AuthContext keeps this in sync via setMemoryToken / clearMemoryToken.
let _token: string | null = null;

export function setMemoryToken(token: string | null) {
  _token = token;
}
export function clearMemoryToken() {
  _token = null;
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  // Use in-memory token first (fast, synchronous read).
  // Fall back to SecureStore only on cold start before AuthContext has run.
  const token = _token ?? await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Warm the in-memory cache so subsequent requests skip SecureStore
    if (!_token) _token = token;
  }
  return config;
});

let _onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRoute && _onUnauthorized) {
      _onUnauthorized();
    }
    return Promise.reject(error);
  }
);
