import React, { createContext, useContext, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import type { DbUser, UserSubscriptionInfo } from "@/lib/types";

interface AuthContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
  signOut: () => Promise<void>;
  login: (token: string, user: DbUser) => Promise<void>;
  dbUser: DbUser | null;
  refreshProfile: () => Promise<void>;
  subscriptionInfo: UserSubscriptionInfo | null;
  refreshSubscriptionInfo: () => Promise<void>;
  isSubscribed: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const store = useAuthStore();

  useEffect(() => {
    store.initialize();
  }, []);

  const value: AuthContextValue = {
    isSignedIn: store.isSignedIn,
    isLoaded: store.isLoaded,
    userId: store.userId,
    signOut: store.signOut,
    login: store.login,
    dbUser: store.dbUser,
    refreshProfile: store.refreshProfile,
    subscriptionInfo: store.subscriptionInfo,
    refreshSubscriptionInfo: store.refreshSubscriptionInfo,
    isSubscribed: store.isSubscribed,
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
