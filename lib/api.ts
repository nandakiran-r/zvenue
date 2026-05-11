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
} from './types';

// Assuming Android emulator connects to 10.0.2.2 or similar. 
// Adjust URL accordingly if testing on physical device.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
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

export async function updateUser(userId: string, updates: any): Promise<DbUser> {
  const { data } = await api.put(`/api/users/${userId}`, updates);
  return data;
}
