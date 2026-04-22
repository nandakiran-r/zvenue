import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@zvenue_favorites";

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (venueId: string) => void;
  isFavorite: (venueId: string) => boolean;
  isLoaded: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const favoritesRef = useRef<string[]>([]);

  // Keep ref in sync for use in persist
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: string[] = JSON.parse(raw);
          setFavorites(parsed);
          favoritesRef.current = parsed;
        }
      } catch (err) {
        console.error("Failed to load favorites from storage:", err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("Failed to persist favorites:", err);
    }
  }, []);

  const toggleFavorite = useCallback(
    (venueId: string) => {
      setFavorites((prev) => {
        const isFav = prev.includes(venueId);
        const next = isFav ? prev.filter((id) => id !== venueId) : [...prev, venueId];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const isFavorite = useCallback(
    (venueId: string) => favorites.includes(venueId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, isLoaded }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
