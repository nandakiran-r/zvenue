import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  DbCategory,
  DbVenue,
  DbBooking,
  DbNotification,
  DbUser,
  VenueFilters,
  CreateBookingInput,
  SubscriptionStatus,
  UserSubscriptionInfo,
  RazorpaySubscription,
  CreateOrderInput,
  VerifyPaymentInput,
  RazorpayOrderResponse,
  VerifyPaymentResponse,
} from './types';

// Use environment variable for API URL (EXPO_PUBLIC_API_URL must be defined in .env)
// For local development, the backend runs on http://localhost:3001
// On physical device/emulator, use your machine's local IP (e.g., http://192.168.1.XXX:3001)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Categories ────────────────────────────────────────────────────────────
export async function fetchCategories(): Promise<DbCategory[]> {
  const { data } = await api.get('/api/categories');
  return data;
}

// ─── Venues ────────────────────────────────────────────────────────────────
export async function fetchVenues(filters?: VenueFilters): Promise<DbVenue[]> {
  const params: Record<string, any> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.lat != null) params.lat = filters.lat;
  if (filters?.lng != null) params.lng = filters.lng;
  if (filters?.radius != null) params.radius = filters.radius;

  const { data } = await api.get('/api/venues', { params });
  let venues = data as DbVenue[];

  if (filters?.categoryName) {
    venues = venues.filter((v) => v.category?.name === filters.categoryName);
  }
  if (filters?.city) {
    venues = venues.filter((v) => v.city?.toLowerCase().includes(filters.city!.toLowerCase()));
  }
  if (filters?.minCapacity) {
    venues = venues.filter((v) => v.capacity >= filters.minCapacity!);
  }

  return venues;
}

export async function fetchVenueById(id: string): Promise<DbVenue | null> {
  try {
    const { data } = await api.get(`/api/venues/${id}`);
    return data;
  } catch {
    return null;
  }
}

export async function fetchVenueBookedDates(venueId: string): Promise<{ bookings: { booking_date: string; start_time: string; end_time: string }[]; blocked_dates: string[] }> {
  const { data } = await api.get(`/api/venues/${venueId}/booked-dates`);
  // Handle both old format (array) and new format (object with bookings + blocked_dates)
  if (Array.isArray(data)) {
    return { bookings: data, blocked_dates: [] };
  }
  return data;
}

export async function fetchVenuesByCategory(categoryName: string): Promise<DbVenue[]> {
  const { data } = await api.get('/api/venues');
  return (data as DbVenue[]).filter(v => v.category?.name === categoryName);
}

// ─── Bookings ──────────────────────────────────────────────────────────────
export async function fetchBookings(userId: string): Promise<DbBooking[]> {
  const { data } = await api.get('/api/bookings', { params: { user_id: userId } });
  return data;
}

export async function fetchBookingById(id: string): Promise<DbBooking | null> {
  try {
    const { data } = await api.get(`/api/bookings/${id}`);
    return data;
  } catch {
    return null;
  }
}

export async function createBooking(input: CreateBookingInput): Promise<DbBooking> {
  const { data } = await api.post('/api/bookings', input);
  return data;
}

// ─── BOOKING PAYMENTS ───────────────────────────────────────────────────────

export async function createBookingOrder(input: CreateOrderInput): Promise<RazorpayOrderResponse> {
  const { data } = await api.post('/api/bookings/create-order', input);
  return data;
}

export async function verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResponse> {
  const { data } = await api.post('/api/bookings/verify-payment', input);
  return data;
}

// ─── PRE-BOOKING ────────────────────────────────────────────────────────────

// ─── ACCOUNT ────────────────────────────────────────────────────────────────

export async function deleteMyAccount(): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete('/api/auth/delete-account');
  return data;
}

// ─── Notifications ─────────────────────────────────────────────────────────
export async function fetchNotifications(userId: string): Promise<DbNotification[]> {
  const { data } = await api.get(`/api/notifications`, { params: { user_id: userId } });
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await api.patch(`/api/notifications/read-all`, { user_id: userId });
}

// ─── Users ─────────────────────────────────────────────────────────────────
// No longer using clerk_id, we use user id
export async function fetchUser(userId: string): Promise<DbUser | null> {
  try {
    const { data } = await api.get(`/api/users/${userId}`);
    return data;
  } catch {
    return null;
  }
}

// Fetch user with subscription info (used after login)
export async function fetchUserWithSubscription(userId: string): Promise<DbUser | null> {
  try {
    // The /api/auth/me endpoint already includes subscription fields from the JWT payload
    const { data } = await api.get(`/api/auth/me`);
    return data;
  } catch {
    return null;
  }
}

export async function updateUser(userId: string, updates: any): Promise<DbUser> {
  const { data } = await api.put(`/api/users/${userId}`, updates);
  return data;
}

// ─── SUBSCRIPTION ─────────────────────────────────────────────────────────────

export async function createSubscription(plan_id: string, quantity?: number, total_count?: number): Promise<RazorpaySubscription> {
  const { data } = await api.post('/api/subscriptions/create', {
    plan_id,
    quantity: quantity || 1,
    total_count: total_count || 12,
  });
  return data.subscription;
}

export async function getSubscriptionStatus(): Promise<UserSubscriptionInfo> {
  const { data } = await api.get('/api/subscription/status');
  return data;
}

export async function cancelSubscription(): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post('/api/subscriptions/cancel');
  return data;
}

export async function confirmSubscription(): Promise<{ success: boolean; subscription_status: string; has_access: boolean }> {
  const { data } = await api.post('/api/subscriptions/confirm');
  return data;
}

export async function getCheckoutOptions(): Promise<{ checkoutOptions: any; subscription: any }> {
  const { data } = await api.post('/api/subscriptions/checkout');
  return data;
}

// activateTrial removed — no backend endpoint exists for this feature

// ─── Invoices ──────────────────────────────────────────────────────────────

export async function fetchBookingInvoice(bookingId: string): Promise<any> {
  const { data } = await api.get(`/api/bookings/${bookingId}/invoice`);
  return data;
}

// ─── App Config ────────────────────────────────────────────────────────────

export async function fetchSubscriptionBenefits(): Promise<string[]> {
  try {
    const { data } = await api.get('/api/config/subscription-benefits');
    return data.benefits || [];
  } catch {
    return [];
  }
}
