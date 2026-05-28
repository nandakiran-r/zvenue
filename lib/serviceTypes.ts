/** Service Marketplace Types */

export interface DbServiceCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DbServiceListing {
  id: string;
  service_category_id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  images: string[];
  video_url: string | null;
  price: number;
  quantity_available: number;
  city: string;
  area: string | null;
  subscriber_discount_percent: number;
  subscriber_benefits: string[];
  rating: number;
  review_count: number;
  is_active: boolean;
  approval_status: string;
  pending_changes: Record<string, unknown> | null;
  owner_name: string | null;
  owner_image: string | null;
  created_at: string;
  /** Joined */
  category?: DbServiceCategory;
  owner?: { id: string; full_name: string; email?: string };
}

export interface DbServiceBooking {
  id: string;
  booking_id_display: string | null;
  service_listing_id: string | null;
  user_id: string;
  quantity: number;
  unit_price: number;
  discount_applied: number;
  total_amount: number;
  payment_method: string;
  order_id: string | null;
  payment_id: string | null;
  signature: string | null;
  status: string; // pending, confirmed, cancelled, refunded, payment_failed
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  cancellation_reason: string | null;
  refunded_at: string | null;
  created_at: string;
  /** Joined */
  listing?: {
    id: string;
    name: string;
    city: string;
    images: string[];
    owner_name?: string | null;
    category?: DbServiceCategory;
  };
  user?: { id: string; full_name: string | null; email: string | null; phone_number: string | null };
}

export interface DbServiceReview {
  id: string;
  service_listing_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: string; full_name: string | null; avatar_url: string | null };
  listing?: { id: string; name: string; city: string | null };
}

export interface ServiceBookedDateEntry {
  booking_date: string;
  start_time: string;
  end_time: string;
}

export interface ServiceCreateOrderInput {
  service_listing_id: string;
  quantity: number;
  booking_date: string;
  start_time: string;
  end_time: string;
}

export interface ServiceCreateOrderResponse {
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
  };
  booking: DbServiceBooking;
  listing: { name: string; city: string; images: string[] };
}

export interface ServiceVerifyPaymentInput {
  order_id: string;
  payment_id: string;
  signature: string;
  booking_id: string;
}

export interface ServiceVerifyPaymentResponse {
  success: boolean;
  booking: DbServiceBooking;
}

export interface ServiceReviewEligibility {
  eligible: boolean;
  existing_review: DbServiceReview | null;
}

export interface ServiceReviewsResponse {
  reviews: DbServiceReview[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface SearchResults {
  venues: Array<{ id: string; name: string; city: string; image_url: string | null; rating: number; price_per_day: number; type: 'venue' }>;
  services: Array<{ id: string; name: string; city: string; image_url: string | null; images?: string[]; rating: number; price: number; type: 'service'; category?: { name: string } }>;
}
