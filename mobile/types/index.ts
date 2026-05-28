export interface User {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: 'user' | 'admin';
  isVerified?: boolean;
}

export interface Wallet {
  userId?: string;
  balance: number;
  currency: string;
  type: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  pendingToken: string | null;
  pendingFlow: 'login' | 'register' | 'totp' | null;
  pendingTotp: boolean;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  price: number;
  discountedPrice?: number;
  discount?: { isActive: boolean; value: number; validUntil: string };
  coverImageUrl: string;
  category: string;
  subcategory?: string;
  condition: string;
  stock: number;
  views?: number;
  purchases?: number;
  listedAt?: string;
  updatedAt?: string;
  isbn?: string;
  description?: string;
  totalSold?: number;
  revenue?: number;
}

export type ShelfKey =
  | 'newArrivals'
  | 'popularBooks'
  | 'bestSellers'
  | 'childrensBooks'
  | 'clearanceItems';

export interface ListingsRequest {
  page?: number;
  limit?: number;
  shelf?: ShelfKey;
  category?: string;
  subcategory?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  condition?: string;
  priceMin?: number;
  priceMax?: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  count: number;
  subcategories?: Category[];
}

export interface Review {
  _id: string;
  user: string | { _id: string; fullName?: string; name?: string; email?: string };
  listing: string;
  rating: number;
  title?: string;
  body?: string;
  isApproved: boolean;
  isVerifiedPurchase?: boolean;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
  breakdown: Array<{ star: number; count: number }>;
}

export interface CartItem {
  id: string;
  img: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface WishlistItem {
  id: string;
  img: string;
  title: string;
  author: string;
  price: number;
}

export interface Address {
  _id: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface OrderItem {
  title: string;
  author?: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'ordered' | 'processing' | 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered';
  items: OrderItem[];
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentDetails: {
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: string;
  };
  tracking: Array<{ status: string; date: string; location: string; completed: boolean }>;
  history: Array<{ status: string; updatedAt: string }>;
}
