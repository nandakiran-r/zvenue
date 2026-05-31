import { router } from "expo-router";
import { Heart, MapPin, Search as SearchIcon, ShoppingBag, SlidersHorizontal, Star, Users } from "lucide-react-native";
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
import { useFavorites } from "@/context/FavoritesContext";
import { fetchCategories, fetchVenues } from "@/lib/api";
import { searchAll, fetchServiceListings, fetchServiceCategories } from "@/lib/serviceApi";
import type { DbCategory, DbVenue } from "@/lib/types";
import type { SearchResults, DbServiceListing, DbServiceCategory } from "@/lib/serviceTypes";

type SearchType = 'all' | 'venues' | 'services';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite: toggleFav } = useFavorites();

  const [searchText, setSearchText] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minCapacity, setMinCapacity] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'none' | 'price_low' | 'price_high' | 'rating'>('none');
  const [searchType, setSearchType] = useState<SearchType>('all');

  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [serviceCategories, setServiceCategories] = useState<DbServiceCategory[]>([]);
  const [venues, setVenues] = useState<DbVenue[]>([]);
  const [services, setServices] = useState<DbServiceListing[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
    fetchServiceCategories().then(setServiceCategories).catch(console.error);
    loadVenues();
  }, []);

  useEffect(() => {
    if (searchText.trim().length >= 2) {
      performSearch();
    } else {
      setIsSearching(false);
      loadVenues();
    }
  }, [searchText, searchType]);

  useEffect(() => {
    if (!isSearching) loadVenues();
  }, [selectedCategory, minCapacity]);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const [venueData, serviceData] = await Promise.all([
        fetchVenues({
          search: undefined,
          categoryName: selectedCategory ?? undefined,
          minCapacity: minCapacity ?? undefined,
        }),
        fetchServiceListings({ limit: 50 }),
      ]);
      setVenues(venueData);
      setServices(serviceData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      setIsSearching(true);
      const results = await searchAll(searchText.trim(), searchType);
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number | null | undefined) => {
    if (amount == null || isNaN(amount)) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues & services..."
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

      {/* Type filter chips (always visible) */}
      <View style={styles.typeFilterRow}>
        {(['all', 'venues', 'services'] as SearchType[]).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeChip, searchType === type && styles.typeChipActive]}
            onPress={() => setSearchType(type)}
          >
            <Text style={[styles.typeChipText, searchType === type && styles.typeChipTextActive]}>
              {type === 'all' ? 'All' : type === 'venues' ? 'Venues' : 'Services'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!isSearching && showFilters && (
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
            {serviceCategories.map(cat => (
              <TouchableOpacity
                key={`svc-${cat.id}`}
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
              <TouchableOpacity key={cap} style={[styles.filterChip, minCapacity === cap && styles.filterChipActive]} onPress={() => setMinCapacity(minCapacity === cap ? null : cap)}>
                <Text style={[styles.filterChipText, minCapacity === cap && styles.filterChipTextActive]}>{cap}+</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.filterTitle}>Sort By</Text>
          <View style={styles.capacityRow}>
            {([
              { key: 'price_low', label: 'Price ↑' },
              { key: 'price_high', label: 'Price ↓' },
              { key: 'rating', label: 'Top Rated' },
            ] as const).map(opt => (
              <TouchableOpacity key={opt.key} style={[styles.filterChip, sortBy === opt.key && styles.filterChipActive]} onPress={() => setSortBy(sortBy === opt.key ? 'none' : opt.key)}>
                <Text style={[styles.filterChipText, sortBy === opt.key && styles.filterChipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearFilterBtn} onPress={() => { setSelectedCategory(null); setMinCapacity(null); setSortBy('none'); }}>
              <Text style={styles.clearFilterText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : isSearching && searchResults ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Venue results */}
          {(searchType === 'all' || searchType === 'venues') && searchResults.venues.length > 0 && (
            <>
              {searchType === 'all' && <Text style={styles.resultSectionTitle}>Venues</Text>}
              {searchResults.venues.map((venue) => (
                <TouchableOpacity key={venue.id} style={styles.venueCard} onPress={() => router.push({ pathname: "/venue-detail", params: { id: venue.id } })} activeOpacity={0.7}>
                  <Image source={{ uri: venue.image_url ?? undefined }} style={styles.venueImage} />
                  <View style={styles.venueInfo}>
                    <View style={styles.typeBadgeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: '#7a331715' }]}><Text style={[styles.typeBadgeText, { color: Colors.primary }]}>Venue</Text></View>
                    </View>
                    <Text style={styles.venueTitle} numberOfLines={1}>{venue.name}</Text>
                    <View style={styles.metaRow}><MapPin size={11} color={Colors.textSecondary} /><Text style={styles.venueCity}>{venue.city}</Text></View>
                    <View style={styles.ratingRow}><Star size={12} color="#FFB800" fill="#FFB800" /><Text style={styles.ratingText}>{venue.review_count > 0 ? venue.rating : 'No reviews yet'}</Text><Text style={styles.priceText}>{formatPrice(venue.price_per_day)}/day</Text></View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Service results */}
          {(searchType === 'all' || searchType === 'services') && searchResults.services.length > 0 && (
            <>
              {searchType === 'all' && <Text style={styles.resultSectionTitle}>Services</Text>}
              {searchResults.services.map((svc) => (
                <TouchableOpacity key={svc.id} style={styles.venueCard} onPress={() => router.push({ pathname: "/service-detail" as any, params: { id: svc.id } })} activeOpacity={0.7}>
                  <Image source={{ uri: svc.image_url ?? svc.images?.[0] ?? undefined }} style={styles.venueImage} />
                  <View style={styles.venueInfo}>
                    <View style={styles.typeBadgeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: '#1565C015' }]}><Text style={[styles.typeBadgeText, { color: '#1565C0' }]}>Service</Text></View>
                      {svc.category && <Text style={styles.categoryLabel}>{svc.category.name}</Text>}
                    </View>
                    <Text style={styles.venueTitle} numberOfLines={1}>{svc.name}</Text>
                    <View style={styles.metaRow}><MapPin size={11} color={Colors.textSecondary} /><Text style={styles.venueCity}>{svc.city}</Text></View>
                    <View style={styles.ratingRow}><Star size={12} color="#FFB800" fill="#FFB800" /><Text style={styles.ratingText}>{svc.review_count > 0 ? svc.rating : 'No reviews yet'}</Text><Text style={styles.priceText}>{formatPrice(svc.price)}</Text></View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {searchResults.venues.length === 0 && searchResults.services.length === 0 && (
            <Text style={styles.emptyText}>No results found for "{searchText}"</Text>
          )}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {(searchType === 'all' || searchType === 'venues') && [...venues].sort((a, b) => {
            if (sortBy === 'price_low') return (a.price_per_day ?? 0) - (b.price_per_day ?? 0);
            if (sortBy === 'price_high') return (b.price_per_day ?? 0) - (a.price_per_day ?? 0);
            if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
            return 0;
          }).map((venue) => (
            <TouchableOpacity key={venue.id} style={styles.venueCard} onPress={() => router.push({ pathname: "/venue-detail", params: { id: venue.id } })} activeOpacity={0.7}>
              <Image source={{ uri: venue.image_url ?? undefined }} style={styles.venueImage} />
              <View style={styles.venueInfo}>
                <View style={styles.typeBadgeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: '#7a331715' }]}><Text style={[styles.typeBadgeText, { color: Colors.primary }]}>Venue</Text></View>
                </View>
                <Text style={styles.venueTitle} numberOfLines={2}>{venue.name}</Text>
                <View style={styles.metaRow}>
                  <MapPin size={11} color={Colors.textSecondary} /><Text style={styles.venueCity}>{venue.city}</Text>
                  <Users size={11} color={Colors.textSecondary} /><Text style={styles.venueCapacity}>Up to {venue.capacity}</Text>
                </View>
                <View style={styles.ratingRow}><Star size={12} color="#FFB800" fill="#FFB800" /><Text style={styles.ratingText}>{venue.review_count > 0 ? venue.rating : 'No reviews yet'}</Text><Text style={styles.priceText}>{formatPrice(venue.price_per_day)}/day</Text></View>
              </View>
              <TouchableOpacity onPress={() => toggleFav(venue.id)} style={styles.heartButton}>
                <Heart size={20} color={favorites.includes(venue.id) ? Colors.primary : Colors.textTertiary} fill={favorites.includes(venue.id) ? Colors.primary : "none"} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          {(searchType === 'all' || searchType === 'services') && [...services].filter(svc => !selectedCategory || svc.category?.name === selectedCategory).sort((a, b) => {
            if (sortBy === 'price_low') return (a.price ?? 0) - (b.price ?? 0);
            if (sortBy === 'price_high') return (b.price ?? 0) - (a.price ?? 0);
            if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
            return 0;
          }).map((svc) => (
            <TouchableOpacity key={svc.id} style={styles.venueCard} onPress={() => router.push({ pathname: "/service-detail" as any, params: { id: svc.id } })} activeOpacity={0.7}>
              <Image source={{ uri: svc.images?.[0] ?? undefined }} style={styles.venueImage} />
              <View style={styles.venueInfo}>
                <View style={styles.typeBadgeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: '#1565C015' }]}><Text style={[styles.typeBadgeText, { color: '#1565C0' }]}>Service</Text></View>
                  {svc.category && <Text style={styles.categoryLabel}>{svc.category.name}</Text>}
                </View>
                <Text style={styles.venueTitle} numberOfLines={2}>{svc.name}</Text>
                <View style={styles.metaRow}><MapPin size={11} color={Colors.textSecondary} /><Text style={styles.venueCity}>{svc.city}</Text></View>
                <View style={styles.ratingRow}><Star size={12} color="#FFB800" fill="#FFB800" /><Text style={styles.ratingText}>{svc.review_count > 0 ? svc.rating?.toFixed(1) : 'No reviews yet'}</Text><Text style={styles.priceText}>{formatPrice(svc.price)}</Text></View>
              </View>
            </TouchableOpacity>
          ))}
          {searchType === 'venues' && venues.length === 0 && <Text style={styles.emptyText}>No venues found.</Text>}
          {searchType === 'services' && services.length === 0 && <Text style={styles.emptyText}>No services found.</Text>}
          {searchType === 'all' && venues.length === 0 && services.length === 0 && <Text style={styles.emptyText}>No results found.</Text>}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginTop: 12, marginBottom: 12 },
  searchContainer: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filterButton: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  // Type filter
  typeFilterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 13, color: Colors.text, fontWeight: "500" },
  typeChipTextActive: { color: Colors.white, fontWeight: "600" },
  // Filters
  filtersContainer: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 16 },
  filterTitle: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 10, marginTop: 4 },
  filterScroll: { marginBottom: 12 },
  filterScrollContent: { gap: 8 },
  capacityRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, color: Colors.text },
  filterChipTextActive: { color: Colors.white, fontWeight: "600" },
  filterActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  clearFilterBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  clearFilterText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  // Results
  scrollContent: { paddingHorizontal: 20, paddingBottom: 90 },
  resultSectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginTop: 8, marginBottom: 12 },
  venueCard: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 14, backgroundColor: Colors.surface, borderRadius: 14, padding: 10 },
  venueImage: { width: 80, height: 80, borderRadius: 12 },
  venueInfo: { flex: 1 },
  venueTitle: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  venueCity: { fontSize: 12, color: Colors.textSecondary, marginRight: 8 },
  venueCapacity: { fontSize: 12, color: Colors.textSecondary },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, color: Colors.text, fontWeight: "600", flex: 1 },
  priceText: { fontSize: 12, color: Colors.primary, fontWeight: "700" },
  heartButton: { padding: 8 },
  typeBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: "700" },
  categoryLabel: { fontSize: 11, color: Colors.textSecondary },
  emptyText: { textAlign: "center", color: Colors.textSecondary, marginTop: 40, fontSize: 14 },
});
