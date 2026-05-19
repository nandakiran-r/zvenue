/** Database row types matching the Supabase schema */

export interface DbUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  // Subscription & Trial fields
  is_trial_used: boolean;
  trial_ends_at: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  next_billing_at: string | null;
  created_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface DbVenue {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  city: string | null;
  category_id: string | null;
  image_url: string | null;
  price_per_hour: number;
  price_per_day: number;
  capacity: number;
  rating: number;
  review_count: number;
  area: string | null;
  amenities: string[];
  owner_name: string | null;
  owner_image: string | null;
  available_dates: string[];
  created_at: string;
  /** Joined from categories table */
  category?: DbCategory;
}

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

export interface DbBooking {
  id: string;
  user_id: string;
  venue_id: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  duration_hours: number;
  guests: number;
  status: string;
  subtotal: number;
  service_fee: number;
  total: number;
  payment_method: string;
  order_id: string | null;
  payment_id: string | null;
  signature: string | null;
  paid_at: string | null;
  created_at: string;
  /** Joined from venues table */
  venue?: DbVenue;
}

export interface VenueFilters {
  search?: string;
  categoryName?: string;
  city?: string;
  minCapacity?: number;
}

export interface CreateBookingInput {
  user_id: string;
  venue_id: string;
  booking_date: string;
  start_time?: string;
  end_time?: string;
  duration_hours: number;
  guests: number;
  subtotal: number;
  service_fee: number;
  total: number;
  payment_method: string;
}

export interface CreateOrderInput {
  venue_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests: number;
  subtotal: number;
  service_fee: number;
  total: number;
}

export interface VerifyPaymentInput {
  order_id: string;
  payment_id: string;
  signature: string;
  booking_id: string;
}

export interface RazorpayOrderResponse {
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    created_at: number;
  };
  booking: DbBooking;
  venue: {
    name: string;
    city: string;
  };
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  booking: DbBooking;
}

export type SubscriptionStatus = 'none' | 'authenticated' | 'active' | 'pending' | 'cancelled' | 'halted';

export interface UserSubscriptionInfo {
  is_trial_used: boolean;
  trial_ends_at: string | null;
  subscription_id: string | null;
  subscription_status: SubscriptionStatus | null;
  next_billing_at: string | null;
  is_trial_active: boolean;
  is_subscription_active: boolean;
  has_access: boolean;
}

export interface RazorpaySubscription {
  id: string;
  status: string;
  plan_id: string;
  quantity: number;
  total_count: number;
  start_at: number;
  next_bill_at: number;
  customer_notify: number;
  notes: { user_id: string };
}
