import { api } from './api';
import type {
  DbServiceCategory,
  DbServiceListing,
  DbServiceBooking,
  DbServiceReview,
  ServiceCreateOrderInput,
  ServiceCreateOrderResponse,
  ServiceVerifyPaymentInput,
  ServiceVerifyPaymentResponse,
  ServiceReviewEligibility,
  ServiceReviewsResponse,
  SearchResults,
} from './serviceTypes';

// ─── Service Categories ────────────────────────────────────────────────────

export async function fetchServiceCategories(): Promise<DbServiceCategory[]> {
  const { data } = await api.get('/api/service-categories');
  return data;
}

// ─── Service Listings ──────────────────────────────────────────────────────

export async function fetchServiceListings(params?: {
  category_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<DbServiceListing[]> {
  const { data } = await api.get('/api/service-listings', { params });
  return data;
}

export async function fetchServiceListingById(id: string): Promise<DbServiceListing | null> {
  try {
    const { data } = await api.get(`/api/service-listings/${id}`);
    return data;
  } catch {
    return null;
  }
}

// ─── Service Bookings ──────────────────────────────────────────────────────

export async function fetchServiceBookings(userId: string): Promise<DbServiceBooking[]> {
  const { data } = await api.get('/api/service-bookings', { params: { user_id: userId } });
  return data;
}

export async function fetchServiceBookingById(id: string): Promise<DbServiceBooking | null> {
  try {
    const { data } = await api.get(`/api/service-bookings/${id}`);
    return data;
  } catch {
    return null;
  }
}

export async function createServiceOrder(input: ServiceCreateOrderInput): Promise<ServiceCreateOrderResponse> {
  const { data } = await api.post('/api/service-bookings/create-order', input);
  return data;
}

export async function verifyServicePayment(input: ServiceVerifyPaymentInput): Promise<ServiceVerifyPaymentResponse> {
  const { data } = await api.post('/api/service-bookings/verify-payment', input);
  return data;
}

export async function cancelServiceBooking(bookingId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post(`/api/service-bookings/${bookingId}/cancel`, { reason });
  return data;
}

// ─── Service Reviews ───────────────────────────────────────────────────────

export async function fetchServiceReviews(
  listingId: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceReviewsResponse> {
  const { data } = await api.get(`/api/service-listings/${listingId}/reviews`, { params: { page, limit } });
  return data;
}

export async function checkServiceReviewEligibility(listingId: string): Promise<ServiceReviewEligibility> {
  const { data } = await api.get(`/api/service-reviews/eligibility/${listingId}`);
  return data;
}

export async function submitServiceReview(
  listingId: string,
  rating: number,
  comment?: string
): Promise<DbServiceReview> {
  const { data } = await api.post('/api/service-reviews', {
    service_listing_id: listingId,
    rating,
    comment: comment || null,
  });
  return data;
}

export async function updateServiceReview(
  reviewId: string,
  rating: number,
  comment?: string
): Promise<DbServiceReview> {
  const { data } = await api.put(`/api/service-reviews/${reviewId}`, {
    rating,
    comment: comment || null,
  });
  return data;
}

export async function deleteServiceReview(reviewId: string): Promise<{ success: boolean }> {
  const { data } = await api.delete(`/api/service-reviews/${reviewId}`);
  return data;
}

// ─── Service Favorites ─────────────────────────────────────────────────────

export async function fetchServiceFavorites(): Promise<DbServiceListing[]> {
  const { data } = await api.get('/api/service-favorites');
  return data;
}

export async function addServiceFavorite(listingId: string): Promise<{ success: boolean }> {
  const { data } = await api.post('/api/service-favorites', { service_listing_id: listingId });
  return data;
}

export async function removeServiceFavorite(listingId: string): Promise<{ success: boolean }> {
  const { data } = await api.delete(`/api/service-favorites/${listingId}`);
  return data;
}

// ─── Unified Search ────────────────────────────────────────────────────────

export async function searchAll(query: string, type: 'all' | 'venues' | 'services' = 'all'): Promise<SearchResults> {
  const { data } = await api.get('/api/search', { params: { q: query, type } });
  return data;
}
