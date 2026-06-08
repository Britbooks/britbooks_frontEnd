export const API_BASE = 'https://britbooks-api-production-8ebd.up.railway.app/api';

// Google OAuth — web client ID from Google Cloud Console
export const GOOGLE_WEB_CLIENT_ID = '284663628649-8p794hthuoc3ggqd1c254dq3jbk9ih4t.apps.googleusercontent.com';
// Facebook App ID — fill in from Facebook Developer Console
export const FACEBOOK_APP_ID = '';

export const ENDPOINTS = {
  auth: {
    register:       `${API_BASE}/auth/register`,
    login:          `${API_BASE}/auth/login`,
    verifyRegister: `${API_BASE}/auth/verify-register`,
    verifyLogin:    `${API_BASE}/auth/verify-login`,
    googleAuth:     `${API_BASE}/auth/google`,
    facebookAuth:   `${API_BASE}/auth/facebook`,
    logout:         `${API_BASE}/auth/logout`,
    resendOtp:      `${API_BASE}/auth/resend-otp`,
    forgotPassword: `${API_BASE}/auth/forgot-password`,
    resetPassword:  `${API_BASE}/auth/reset-password`,
    changePassword: `${API_BASE}/auth/change-password`,
    twoFa: {
      setup:   `${API_BASE}/auth/2fa/setup`,
      enable:  `${API_BASE}/auth/2fa/enable`,
      disable: `${API_BASE}/auth/2fa/disable`,
      login:   `${API_BASE}/auth/2fa/login`,
    },
  },
  users: {
    profile:   (userId: string) => `${API_BASE}/users/${userId}`,
    addresses: (userId: string) => `${API_BASE}/users/${userId}/address`,
    cart:      (userId: string) => `${API_BASE}/users/${userId}/cart`,
    wishlist:  (userId: string) => `${API_BASE}/users/${userId}/wishlist`,
  },
  market: {
    listings:      `${API_BASE}/market/admin/listings`,
    listing:       (id: string) => `${API_BASE}/market/${id}`,
    categories:    `${API_BASE}/market/categories`,
    subcategories: (parentSlug: string) => `${API_BASE}/market/categories/${parentSlug}/subcategories`,
    search:        `${API_BASE}/market/search`,
  },
  reviews: {
    byListing: (listingId: string) => `${API_BASE}/reviews/listing/${listingId}`,
    summary:   (listingId: string) => `${API_BASE}/reviews/listing/${listingId}/summary`,
    submit:    `${API_BASE}/reviews`,
    byUser:    (userId: string) => `${API_BASE}/reviews/user/${userId}`,
    delete:    (reviewId: string) => `${API_BASE}/reviews/${reviewId}`,
  },
  payments: {
    create:  `${API_BASE}/payments/create-payment`,
    success: (ref: string) => `${API_BASE}/payments/success/${ref}`,
  },
  campaigns: {
    validate:   `${API_BASE}/campaigns/validate`,
    gameStatus: `${API_BASE}/campaigns/game-status`,
    recordGame: `${API_BASE}/campaigns/record-game`,
  },
  orders: {
    byId:   (orderId: string) => `${API_BASE}/orders/${orderId}`,
    byUser: (userId: string) => `${API_BASE}/orders/user/${userId}`,
  },
};
