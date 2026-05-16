import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, fetchUser, fetchUserWithSubscription, getSubscriptionStatus } from "@/lib/api";
import type { DbUser, UserSubscriptionInfo } from "@/lib/types";

interface AuthContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
  signOut: () => Promise<void>;
  login: (token: string, user: DbUser) => Promise<void>;
  /** The user row from the DB */
  dbUser: DbUser | null;
  /** Re-fetch the DB user profile (call after edits) */
  refreshProfile: () => Promise<void>;
  /** Subscription info */
  subscriptionInfo: UserSubscriptionInfo | null;
  refreshSubscriptionInfo: () => Promise<void>;
  /** Check if user has access (trial or subscription active) */
  hasAccess: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<UserSubscriptionInfo | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          setToken(storedToken);
          const response = await api.get("/api/auth/me");
          setDbUser(response.data);
        }
      } catch (error) {
        console.log("Failed to load session:", error);
        await AsyncStorage.removeItem("token");
      } finally {
        setIsLoaded(true);
      }
    };
    loadToken();
  }, []);

  const login = async (newToken: string, newUser: DbUser) => {
    try {
      await AsyncStorage.setItem("token", newToken);
      setToken(newToken);
      setDbUser(newUser);
    } catch (e) {
      console.log("Failed to save token");
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem("token");
      setToken(null);
      setDbUser(null);
    } catch (e) {
      console.log("Failed to remove token");
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!dbUser?.id) return;
    try {
      const profile = await fetchUser(dbUser.id);
      if (profile) setDbUser(profile);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  }, [dbUser?.id]);

  const refreshSubscriptionInfo = useCallback(async () => {
    if (!dbUser?.id) return;
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionInfo(status);
    } catch (err) {
      console.error("Failed to refresh subscription info:", err);
    }
  }, [dbUser?.id]);

  useEffect(() => {
    if (dbUser?.id) {
      refreshSubscriptionInfo();
    }
  }, [dbUser?.id, refreshSubscriptionInfo]);

  const value: AuthContextValue = {
    isSignedIn: !!token,
    isLoaded,
    userId: dbUser?.id || null,
    signOut,
    login,
    dbUser,
    refreshProfile,
    subscriptionInfo,
    refreshSubscriptionInfo,
    hasAccess: subscriptionInfo?.has_access || false,
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
