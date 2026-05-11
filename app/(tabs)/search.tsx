import { router } from "expo-router";
import { Heart, MapPin, Search as SearchIcon, SlidersHorizontal, Star, Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { fetchCategories, fetchVenues } from "@/lib/api";
import type { DbCategory, DbVenue } from "@/lib/types";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  
  const { favorites, toggleFavorite: toggleFav } = useFavorites();

  const [searchText, setSearchText] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minCapacity, setMinCapacity] = useState<number | null>(null);

  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [venues, setVenues] = useState<DbVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    loadVenues();
  }, [searchText, selectedCategory, minCapacity]);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const data = await fetchVenues({
        search: searchText || undefined,
        categoryName: selectedCategory ?? undefined,
        minCapacity: minCapacity ?? undefined,
      });
      setVenues(data);
    } catch (err) {
      console.error("Failed to load venues:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues, city or type..."
            placeholderTextColor={Colors.textTertiary}
            value={searchText}
            onChangeText={setSearchText}
            testID="search-input"
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={18} color={showFilters ? Colors.primary : Colors.text} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, selectedCategory === cat.name && styles.filterChipActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              >
                <Text style={[styles.filterChipText, selectedCategory === cat.name && styles.filterChipTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterTitle}>Minimum Capacity</Text>
          <View style={styles.capacityRow}>
            {[10, 50, 100, 500].map(cap => (
              <TouchableOpacity
                key={cap}
                style={[styles.filterChip, minCapacity === cap && styles.filterChipActive]}
                onPress={() => setMinCapacity(minCapacity === cap ? null : cap)}
              >
                <Text style={[styles.filterChipText, minCapacity === cap && styles.filterChipTextActive]}>{cap}+</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => { setSelectedCategory(null); setMinCapacity(null); }}
            >
              <Text style={styles.clearFilterText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {venues.map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={styles.venueCard}
              onPress={() => router.push({ pathname: "/venue-detail", params: { id: venue.id } })}
              activeOpacity={0.7}
            >
              <Image source={{ uri: venue.image_url ?? undefined }} style={styles.venueImage} />
              <View style={styles.venueInfo}>
                <Text style={styles.venueTitle} numberOfLines={2}>{venue.name}</Text>
                <View style={styles.metaRow}>
                  <MapPin size={11} color={Colors.textSecondary} />
                  <Text style={styles.venueCity}>{venue.city}</Text>
                  <Users size={11} color={Colors.textSecondary} />
                  <Text style={styles.venueCapacity}>Up to {venue.capacity}</Text>
                </View>
                <View style={styles.ratingRow}>
                  <Star size={12} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.ratingText}>{venue.rating}</Text>
                  <Text style={styles.priceText}>{formatPrice(venue.price_per_day)}/day</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => toggleFav(venue.id)}
                style={styles.heartButton}
              >
                <Heart
                  size={20}
                  color={favorites.includes(venue.id) ? Colors.primary : Colors.textTertiary}
                  fill={favorites.includes(venue.id) ? Colors.primary : "none"}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          {venues.length === 0 && (
            <Text style={{ textAlign: "center", color: Colors.textSecondary, marginTop: 40 }}>No venues found.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterScrollContent: {
    gap: 8,
  },
  capacityRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.text,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: "600",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  clearFilterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  venueCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 10,
  },
  venueImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  venueInfo: {
    flex: 1,
  },
  venueTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  venueCity: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  venueCapacity: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "600" as const,
    flex: 1,
  },
  priceText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  heartButton: {
    padding: 8,
  },
});
