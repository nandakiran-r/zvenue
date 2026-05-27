import React, { createContext, useContext, useEffect } from "react";
import { useFavoritesStore } from "@/store/favoritesStore";

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (venueId: string) => void;
  isFavorite: (venueId: string) => boolean;
  isLoaded: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useFavoritesStore();

  useEffect(() => {
    store.initialize();
  }, []);

  const value: FavoritesContextType = {
    favorites: store.favorites,
    toggleFavorite: store.toggleFavorite,
    isFavorite: store.isFavorite,
    isLoaded: store.isLoaded,
  };

  return (
    <FavoritesContext.Provider value={value}>
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
