import React, { createContext, useContext, useMemo } from "react";
import {
  useAuth as useClerkAuth,
  useUser,
  useSession,
} from "@clerk/clerk-expo";
import { createClerkSupabaseClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

interface AuthContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null | undefined;
  user: ReturnType<typeof useUser>["user"];
  signOut: () => Promise<void>;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, userId, signOut } = useClerkAuth();
  const { user } = useUser();
  const { session } = useSession();

  const supabase = useMemo(
    () =>
      createClerkSupabaseClient(
        () => session?.getToken() ?? Promise.resolve(null)
      ),
    [session]
  );

  const value: AuthContextValue = {
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    userId,
    user,
    signOut: async () => {
      await signOut();
    },
    supabase,
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
