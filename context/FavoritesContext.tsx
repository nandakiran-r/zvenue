import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchFavoriteVenueIds, addFavorite, removeFavorite } from "@/lib/api";

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (venueId: string) => void;
  isFavorite: (venueId: string) => boolean;
  isLoaded: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, dbUser, isSignedIn } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from Supabase when user is available
  useEffect(() => {
    if (!isSignedIn || !dbUser) {
      setFavorites([]);
      setIsLoaded(true);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const ids = await fetchFavoriteVenueIds(supabase, dbUser.id);
        if (!cancelled) setFavorites(ids);
      } catch (err) {
        console.error("Failed to load favorites:", err);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [isSignedIn, dbUser?.id, supabase]);

  const toggleFavorite = useCallback(
    (venueId: string) => {
      if (!dbUser) return;

      const isFav = favorites.includes(venueId);

      // Optimistic update
      setFavorites((prev) =>
        isFav ? prev.filter((id) => id !== venueId) : [...prev, venueId]
      );

      // Persist to Supabase
      const persist = async () => {
        try {
          if (isFav) {
            await removeFavorite(supabase, dbUser.id, venueId);
          } else {
            await addFavorite(supabase, dbUser.id, venueId);
          }
        } catch (err) {
          console.error("Failed to toggle favorite:", err);
          // Revert on error
          setFavorites((prev) =>
            isFav ? [...prev, venueId] : prev.filter((id) => id !== venueId)
          );
        }
      };

      persist();
    },
    [dbUser, favorites, supabase]
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
