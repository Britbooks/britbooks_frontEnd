import { apiClient } from './api';
import { ENDPOINTS } from '../constants/Api';
import { Review, ReviewSummary } from '../types';

export async function getReviews(listingId: string, page = 1, limit = 10): Promise<{ reviews: Review[]; meta: { page: number; pages: number; total: number } }> {
  const res = await apiClient.get(`${ENDPOINTS.reviews.byListing(listingId)}?page=${page}&limit=${limit}`);
  const d = res.data;
  return {
    reviews: d.reviews ?? [],
    meta: {
      page: d.page ?? page,
      pages: d.pages ?? d.totalPages ?? 1,
      total: d.total ?? d.totalReviews ?? 0,
    },
  };
}

export async function getReviewSummary(listingId: string): Promise<ReviewSummary> {
  const res = await apiClient.get(ENDPOINTS.reviews.summary(listingId));
  const d = res.data.data ?? res.data;
  return {
    averageRating: d.averageRating ?? 0,
    reviewCount: d.reviewCount ?? 0,
    breakdown: d.breakdown ?? [],
  };
}

export async function submitReview(data: {
  listing: string;
  rating: number;
  title?: string;
  body?: string;
}): Promise<Review> {
  const res = await apiClient.post(ENDPOINTS.reviews.submit, {
    listingId: data.listing,
    rating: data.rating,
    title: data.title,
    body: data.body,
  });
  return res.data.data ?? res.data.review ?? res.data;
}

export async function deleteReview(reviewId: string): Promise<void> {
  await apiClient.delete(ENDPOINTS.reviews.delete(reviewId));
}

export function getReviewerName(review: Review): string {
  if (typeof review.user === 'string') return 'Customer';
  return review.user.fullName || review.user.name || 'Customer';
}
