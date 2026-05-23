export const API_BASE = 'https://britbooks-api-production-8ebd.up.railway.app/api';

export const ENDPOINTS = {
  auth: {
    register: `${API_BASE}/auth/register`,
    login: `${API_BASE}/auth/login`,
    verifyRegister: `${API_BASE}/auth/verify-register`,
    verifyLogin: `${API_BASE}/auth/verify-login`,
  },
  users: {
    profile: (userId: string) => `${API_BASE}/users/${userId}`,
    addresses: (userId: string) => `${API_BASE}/users/${userId}/address`,
  },
  market: {
    listings: `${API_BASE}/market/admin/listings`,
    listing: (id: string) => `${API_BASE}/market/${id}`,
    categories: `${API_BASE}/market/categories`,
    subcategories: (parentSlug: string) => `${API_BASE}/market/categories/${parentSlug}/subcategories`,
    search: `${API_BASE}/market/search`,
  },
  reviews: {
    byListing: (listingId: string) => `${API_BASE}/reviews/listing/${listingId}`,
    summary: (listingId: string) => `${API_BASE}/reviews/listing/${listingId}/summary`,
    submit: `${API_BASE}/reviews`,
    byUser: (userId: string) => `${API_BASE}/reviews/user/${userId}`,
    delete: (reviewId: string) => `${API_BASE}/reviews/${reviewId}`,
  },
  payments: {
    create: `${API_BASE}/payments/create-payment`,
    success: (ref: string) => `${API_BASE}/payments/success/${ref}`,
  },
  campaigns: {
    validate: `${API_BASE}/campaigns/validate`,
  },
  orders: {
    byId: (orderId: string) => `${API_BASE}/orders/${orderId}`,
    byUser: (userId: string) => `${API_BASE}/orders/user/${userId}`,
  },
};
