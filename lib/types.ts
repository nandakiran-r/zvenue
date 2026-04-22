/** Database row types matching the Supabase schema */

export interface DbUser {
  id: string;
  clerk_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  dob: string | null;
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
