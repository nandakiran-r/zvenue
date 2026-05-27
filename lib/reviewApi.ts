import { api } from './api';
import type { DbReview, ReviewEligibility, ReviewsResponse } from './types';

// ─── Review API Functions ──────────────────────────────────────────────────

export async function submitReview(
  venueId: string,
  rating: number,
  comment?: string
): Promise<DbReview> {
  const { data } = await api.post('/api/reviews', {
    venue_id: venueId,
    rating,
    comment: comment || null,
  });
  return data;
}

export async function fetchVenueReviews(
  venueId: string,
  page: number = 1,
  limit: number = 10
): Promise<ReviewsResponse> {
  const { data } = await api.get(`/api/venues/${venueId}/reviews`, {
    params: { page, limit },
  });
  return data;
}

export async function checkReviewEligibility(
  venueId: string
): Promise<ReviewEligibility> {
  const { data } = await api.get(`/api/reviews/eligibility/${venueId}`);
  return data;
}

export async function updateReview(
  reviewId: string,
  rating: number,
  comment?: string
): Promise<DbReview> {
  const { data } = await api.put(`/api/reviews/${reviewId}`, {
    rating,
    comment: comment || null,
  });
  return data;
}

export async function deleteReview(reviewId: string): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete(`/api/reviews/${reviewId}`);
  return data;
}
