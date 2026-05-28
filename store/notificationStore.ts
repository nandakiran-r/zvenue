import { create } from "zustand";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import type { DbNotification } from "@/lib/types";

interface NotificationState {
  notifications: DbNotification[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  loadNotifications: (userId: string) => Promise<void>;
  fetchUnreadCount: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  incrementUnread: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  loadNotifications: async (userId: string) => {
    try {
      set({ isLoading: true });
      const data = await fetchNotifications(userId);
      const unreadCount = data.filter((n) => !n.is_read).length;
      set({ notifications: data, unreadCount });
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async (userId: string) => {
    try {
      const data = await fetchNotifications(userId);
      const unreadCount = data.filter((n) => !n.is_read).length;
      set({ notifications: data, unreadCount });
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await markNotificationRead(id);
      const { notifications } = get();
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      const unreadCount = updated.filter((n) => !n.is_read).length;
      set({ notifications: updated, unreadCount });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      await markAllNotificationsRead(userId);
      const { notifications } = get();
      const updated = notifications.map((n) => ({ ...n, is_read: true }));
      set({ notifications: updated, unreadCount: 0 });
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  },

  incrementUnread: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },

  reset: () => {
    set({ notifications: [], unreadCount: 0, isLoading: false });
  },
}));
