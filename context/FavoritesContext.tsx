import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (venueId: string) => void;
  isFavorite: (venueId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = '@favorites_v1';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveFavorites = async (newFavs: string[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavs));
    } catch (e) {
      console.error('Failed to save favorites', e);
    }
  };

  const toggleFavorite = (venueId: string) => {
    setFavorites(prev => {
      const newFavs = prev.includes(venueId) 
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId];
      saveFavorites(newFavs);
      return newFavs;
    });
  };

  const isFavorite = (venueId: string) => favorites.includes(venueId);

  // We only render children once favorites are loaded from storage to prevent flickering
  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {isLoaded ? children : null}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
