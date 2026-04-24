import axios from "axios";

const BASE = "https://britbooks-api-production-8ebd.up.railway.app/api/reviews";

export interface Review {
  _id: string;
  /** String ID when not populated, object when populated by the list endpoint */
  user: string | { _id: string; fullName?: string; name?: string; firstName?: string; lastName?: string; email?: string };
  listing: string;
  rating: number;
  comment?: string;
  isApproved: boolean;
  isVerifiedPurchase?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
  breakdown: Array<{ star: number; count: number }>;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
}

/** GET /api/reviews/listing/:listingId */
export async function getListingReviews(
  listingId: string,
  page = 1,
  limit = 10
): Promise<ReviewsResponse> {
  const { data } = await axios.get(`${BASE}/listing/${listingId}`, {
    params: { page, limit },
  });
  return {
    reviews: data.reviews ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    pages: data.pages ?? 0,
  };
}

/** GET /api/reviews/listing/:listingId/summary */
export async function getListingReviewSummary(listingId: string): Promise<ReviewSummary> {
  const { data } = await axios.get(`${BASE}/listing/${listingId}/summary`);
  const d = data.data ?? {};
  return {
    averageRating: d.averageRating ?? 0,
    reviewCount: d.reviewCount ?? 0,
    breakdown: d.breakdown ?? [],
  };
}

/** POST /api/reviews  (requires auth token) */
export async function submitReview(
  listingId: string,
  rating: number,
  comment: string,
  token: string,
  userId?: string | null
): Promise<Review> {
  const { data } = await axios.post(
    BASE,
    {
      listingId,
      rating,
      comment,
      // Send userId in body as fallback in case the middleware sets
      // req.user = { userId } (not { _id }) and the controller needs it
      ...(userId && { user: userId }),
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  // Response shape: { success, data: { ...review }, moderation }
  return data.data ?? data.review ?? data;
}

/** GET /api/reviews/user/:userId  (requires auth token) */
export async function getUserReviews(
  userId: string,
  token: string,
  page = 1,
  limit = 10
): Promise<ReviewsResponse> {
  const { data } = await axios.get(`${BASE}/user/${userId}`, {
    params: { page, limit },
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    reviews: data.reviews ?? data.data ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    pages: data.pages ?? 0,
  };
}

/** DELETE /api/reviews/:id  (requires auth token) */
export async function deleteReview(reviewId: string, token: string): Promise<void> {
  await axios.delete(`${BASE}/${reviewId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
