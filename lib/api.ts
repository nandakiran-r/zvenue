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
  
  // Notice: The previous Supabase filtering logic was slightly different. 
  // We'll pass search params and let the backend handle it, or filter here.
  const { data } = await api.get('/api/venues', { params });
  let venues = data as DbVenue[];

  if (filters?.categoryName) {
    venues = venues.filter((v) => v.category?.name === filters.categoryName);
  }
  if (filters?.city) {
    venues = venues.filter((v) => v.city?.toLowerCase().includes(filters.city!.toLowerCase()));
  }
  if (filters?.minCapacity) {
    // Currently no capacity in DB, but if there is:
    // venues = venues.filter((v) => v.capacity >= filters.minCapacity!);
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

export async function fetchVenuesByCategory(categoryName: string): Promise<DbVenue[]> {
  const { data } = await api.get('/api/venues');
  return (data as DbVenue[]).filter(v => v.category?.name === categoryName);
}

// ─── Bookings ──────────────────────────────────────────────────────────────
export async function fetchBookings(userId: string): Promise<DbBooking[]> {
  // We fetch all bookings, but the backend currently returns all bookings if admin, 
  // or maybe it doesn't filter by user. The Fastify backend doesn't filter by user yet,
  // but let's assume we do it client side for now, or you can update the backend to filter.
  // Actually, wait, let's filter client side since backend returns all.
  const { data } = await api.get('/api/bookings');
  return (data as DbBooking[]).filter(b => b.user_id === userId);
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

// ─── Notifications ─────────────────────────────────────────────────────────
export async function fetchNotifications(userId: string): Promise<DbNotification[]> {
  const { data } = await api.get(`/api/notifications`, { params: { user_id: userId } });
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.delete(`/api/notifications/${id}`); // or mark as read if endpoint exists
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

export async function getCheckoutOptions(): Promise<{ checkoutOptions: any; subscription: any }> {
  const { data } = await api.post('/api/subscriptions/checkout');
  return data;
}

export async function activateTrial(): Promise<{ success: boolean; message: string; trial_ends_at: string }> {
  const { data } = await api.post('/api/subscription/activate-trial');
  return data;
}
