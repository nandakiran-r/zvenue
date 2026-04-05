import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client using Clerk's native integration.
 * Uses Supabase's built-in `accessToken` option instead of a custom fetch wrapper.
 *
 * Usage:
 *   const { session } = useSession();
 *   const supabase = createClerkSupabaseClient(() => session?.getToken() ?? Promise.resolve(null));
 */
export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>
) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => (await getToken()) ?? null,
  });
}

/**
 * A plain (unauthenticated) Supabase client for public data access.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
