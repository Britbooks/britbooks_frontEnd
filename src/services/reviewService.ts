import axios from "axios";

const BASE = "https://britbooks-api-production-8ebd.up.railway.app/api/reviews";

export interface Review {
  _id: string;
  listingId: string;
  userId: { _id: string; name?: string; firstName?: string; lastName?: string; email?: string };
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
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
  token: string
): Promise<Review> {
  const { data } = await axios.post(
    BASE,
    { listingId, rating, comment },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.review ?? data;
}

/** DELETE /api/reviews/:id  (requires auth token) */
export async function deleteReview(reviewId: string, token: string): Promise<void> {
  await axios.delete(`${BASE}/${reviewId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
