import { create } from "zustand";
import * as Location from "expo-location";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  isLoading: boolean;
  error: string | null;
  permissionGranted: boolean;

  // Actions
  initialize: () => Promise<void>;
  refreshLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  latitude: null,
  longitude: null,
  city: null,
  state: null,
  isLoading: false,
  error: null,
  permissionGranted: false,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        set({
          isLoading: false,
          error: "Location permission denied",
          permissionGranted: false,
        });
        return;
      }

      set({ permissionGranted: true });

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      set({ latitude, longitude });

      // Reverse geocode to get city name
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address) {
        set({
          city: address.city || address.subregion || null,
          state: address.region || null,
        });
      }
    } catch (err: any) {
      console.error("Location error:", err);
      set({ error: err.message || "Failed to get location" });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshLocation: async () => {
    const { permissionGranted } = get();
    if (!permissionGranted) {
      // Try requesting again
      await get().initialize();
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      set({ latitude, longitude });

      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address) {
        set({
          city: address.city || address.subregion || null,
          state: address.region || null,
        });
      }
    } catch (err: any) {
      console.error("Location refresh error:", err);
      set({ error: err.message || "Failed to refresh location" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
