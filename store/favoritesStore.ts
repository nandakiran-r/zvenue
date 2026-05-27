import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@zvenue_favorites";

interface FavoritesState {
  favorites: string[];
  isLoaded: boolean;

  // Actions
  initialize: () => Promise<void>;
  toggleFavorite: (venueId: string) => void;
  isFavorite: (venueId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoaded: false,

  initialize: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        set({ favorites: parsed });
      }
    } catch (err) {
      console.error("Failed to load favorites from storage:", err);
    } finally {
      set({ isLoaded: true });
    }
  },

  toggleFavorite: (venueId: string) => {
    const { favorites } = get();
    const isFav = favorites.includes(venueId);
    const next = isFav
      ? favorites.filter((id) => id !== venueId)
      : [...favorites, venueId];
    set({ favorites: next });
    // Persist in background
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
      console.error("Failed to persist favorites:", err)
    );
  },

  isFavorite: (venueId: string) => {
    return get().favorites.includes(venueId);
  },
}));
