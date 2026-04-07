import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DbCategory,
  DbVenue,
  DbBooking,
  DbNotification,
  DbUser,
  VenueFilters,
  CreateBookingInput,
} from "./types";

// ─── Categories ────────────────────────────────────────────────────────────

export async function fetchCategories(
  supabase: SupabaseClient
): Promise<DbCategory[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

// ─── Venues ────────────────────────────────────────────────────────────────

export async function fetchVenues(
  supabase: SupabaseClient,
  filters?: VenueFilters
): Promise<DbVenue[]> {
  let query = supabase
    .from("venues")
    .select("*, category:categories(*)");

  if (filters?.categoryName) {
    // Filter by joined category name
    query = query.eq("category.name", filters.categoryName);
  }
  if (filters?.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters?.minCapacity) {
    query = query.gte("capacity", filters.minCapacity);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  // When filtering by category name, the join returns null for non-matching rows
  // Remove those rows
  let venues = (data ?? []) as DbVenue[];
  if (filters?.categoryName) {
    venues = venues.filter((v) => v.category !== null);
  }

  return venues;
}

export async function fetchVenueById(
  supabase: SupabaseClient,
  id: string
): Promise<DbVenue | null> {
  const { data, error } = await supabase
    .from("venues")
    .select("*, category:categories(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as DbVenue | null;
}

export async function fetchVenuesByCategory(
  supabase: SupabaseClient,
  categoryName: string
): Promise<DbVenue[]> {
  const { data, error } = await supabase
    .from("venues")
    .select("*, category:categories!inner(*)")
    .eq("category.name", categoryName)
    .order("rating", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbVenue[];
}

// ─── Favorites ─────────────────────────────────────────────────────────────

export async function fetchFavoriteVenueIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("venue_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((f) => f.venue_id);
}

export async function fetchFavoriteVenues(
  supabase: SupabaseClient,
  userId: string
): Promise<DbVenue[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("venue:venues(*, category:categories(*))")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((f: any) => f.venue).filter(Boolean) as DbVenue[];
}

export async function addFavorite(
  supabase: SupabaseClient,
  userId: string,
  venueId: string
): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, venue_id: venueId });
  if (error && error.code !== "23505") throw error; // Ignore unique constraint
}

export async function removeFavorite(
  supabase: SupabaseClient,
  userId: string,
  venueId: string
): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("venue_id", venueId);
  if (error) throw error;
}

// ─── Bookings ──────────────────────────────────────────────────────────────

export async function fetchBookings(
  supabase: SupabaseClient,
  userId: string
): Promise<DbBooking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, venue:venues(*, category:categories(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbBooking[];
}

export async function fetchBookingById(
  supabase: SupabaseClient,
  id: string
): Promise<DbBooking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, venue:venues(*, category:categories(*))")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as DbBooking | null;
}

export async function createBooking(
  supabase: SupabaseClient,
  input: CreateBookingInput
): Promise<DbBooking> {
  const { data, error } = await supabase
    .from("bookings")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as DbBooking;
}

// ─── Notifications ─────────────────────────────────────────────────────────

export async function fetchNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<DbNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbNotification[];
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) throw error;
}

// ─── Users ─────────────────────────────────────────────────────────────────

export async function upsertUser(
  supabase: SupabaseClient,
  data: {
    clerk_id: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  }
): Promise<DbUser> {
  const { data: user, error } = await supabase
    .from("users")
    .upsert(data, { onConflict: "clerk_id" })
    .select()
    .single();
  if (error) throw error;
  return user as DbUser;
}

export async function fetchUser(
  supabase: SupabaseClient,
  clerkId: string
): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .single();
  if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
  return (data as DbUser) ?? null;
}

export async function updateUser(
  supabase: SupabaseClient,
  clerkId: string,
  updates: Partial<Pick<DbUser, "full_name" | "email" | "phone" | "avatar_url" | "dob">>
): Promise<DbUser> {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("clerk_id", clerkId)
    .select()
    .single();
  if (error) throw error;
  return data as DbUser;
}
