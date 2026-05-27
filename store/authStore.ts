import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, fetchUser, getSubscriptionStatus } from "@/lib/api";
import type { DbUser, UserSubscriptionInfo } from "@/lib/types";

interface AuthState {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
  dbUser: DbUser | null;
  subscriptionInfo: UserSubscriptionInfo | null;
  isSubscribed: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (token: string, user: DbUser) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscriptionInfo: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isSignedIn: false,
  isLoaded: false,
  userId: null,
  dbUser: null,
  subscriptionInfo: null,
  isSubscribed: false,

  initialize: async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) {
        const response = await api.get("/api/auth/me");
        const user = response.data as DbUser;
        set({
          isSignedIn: true,
          userId: user.id,
          dbUser: user,
        });
        // Fetch subscription info in background
        get().refreshSubscriptionInfo();
      }
    } catch (error) {
      console.log("Failed to load session:", error);
      await AsyncStorage.removeItem("token");
      set({ isSignedIn: false, userId: null, dbUser: null });
    } finally {
      set({ isLoaded: true });
    }
  },

  login: async (newToken: string, newUser: DbUser) => {
    try {
      await AsyncStorage.setItem("token", newToken);
      set({
        isSignedIn: true,
        userId: newUser.id,
        dbUser: newUser,
      });
      // Fetch subscription info after login
      get().refreshSubscriptionInfo();
    } catch (e) {
      console.log("Failed to save token:", e);
    }
  },

  signOut: async () => {
    try {
      await AsyncStorage.removeItem("token");
      set({
        isSignedIn: false,
        userId: null,
        dbUser: null,
        subscriptionInfo: null,
        isSubscribed: false,
      });
    } catch (e) {
      console.log("Failed to remove token:", e);
    }
  },

  refreshProfile: async () => {
    const { dbUser } = get();
    if (!dbUser?.id) return;
    try {
      const profile = await fetchUser(dbUser.id);
      if (profile) {
        set({ dbUser: profile });
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  },

  refreshSubscriptionInfo: async () => {
    const { isSignedIn } = get();
    if (!isSignedIn) return;
    try {
      const status = await getSubscriptionStatus();
      set({
        subscriptionInfo: status,
        isSubscribed: status?.is_subscribed || false,
      });
    } catch (err) {
      console.error("Failed to refresh subscription info:", err);
    }
  },
}));
