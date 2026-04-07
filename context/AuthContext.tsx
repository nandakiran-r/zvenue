import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  useAuth as useClerkAuth,
  useUser,
  useSession,
} from "@clerk/clerk-expo";
import { createClerkSupabaseClient } from "@/lib/supabase";
import { upsertUser, fetchUser } from "@/lib/api";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbUser } from "@/lib/types";

interface AuthContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null | undefined;
  user: ReturnType<typeof useUser>["user"];
  signOut: () => Promise<void>;
  supabase: SupabaseClient;
  /** The user row from the Supabase `users` table */
  dbUser: DbUser | null;
  /** Re-fetch the DB user profile (call after edits) */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, userId, signOut } = useClerkAuth();
  const { user } = useUser();
  const { session } = useSession();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);

  const supabase = useMemo(
    () =>
      createClerkSupabaseClient(
        () => session?.getToken() ?? Promise.resolve(null)
      ),
    [session]
  );

  // Sync Clerk user → Supabase users table
  useEffect(() => {
    if (!isSignedIn || !user || !userId) {
      setDbUser(null);
      return;
    }

    const syncUser = async () => {
      try {
        const synced = await upsertUser(supabase, {
          clerk_id: userId,
          full_name: user.fullName ?? user.firstName ?? null,
          email: user.emailAddresses?.[0]?.emailAddress ?? null,
          avatar_url: user.imageUrl ?? null,
        });
        setDbUser(synced);
      } catch (err) {
        console.error("Failed to sync user to Supabase:", err);
        // Try to just fetch existing user if upsert fails
        try {
          const existing = await fetchUser(supabase, userId);
          if (existing) setDbUser(existing);
        } catch {
          // silently ignore
        }
      }
    };

    syncUser();
  }, [isSignedIn, user, userId, supabase]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const profile = await fetchUser(supabase, userId);
      if (profile) setDbUser(profile);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  }, [userId, supabase]);

  const value: AuthContextValue = {
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    userId,
    user,
    signOut: async () => {
      setDbUser(null);
      await signOut();
    },
    supabase,
    dbUser,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
