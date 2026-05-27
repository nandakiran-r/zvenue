import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Bell, ChevronDown, ChevronRight, Heart, MapPin, Navigation, Search, SlidersHorizontal, Star, Users, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
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
import { useLocationStore } from "@/store/locationStore";
import { fetchCategories, fetchVenues } from "@/lib/api";
import type { DbCategory, DbVenue } from "@/lib/types";

const CITIES = [
  { id: "1", name: "Ahmedabad", state: "Gujarat" },
  { id: "2", name: "Mumbai", state: "Maharashtra" },
  { id: "3", name: "Delhi", state: "Delhi" },
  { id: "4", name: "Bengaluru", state: "Karnataka" },
  { id: "5", name: "Chennai", state: "Tamil Nadu" },
  { id: "6", name: "Hyderabad", state: "Telangana" },
  { id: "7", name: "Pune", state: "Maharashtra" },
  { id: "8", name: "Jaipur", state: "Rajasthan" },
  { id: "9", name: "Kolkata", state: "West Bengal" },
  { id: "10", name: "Surat", state: "Gujarat" },
  { id: "11", name: "Lucknow", state: "Uttar Pradesh" },
  { id: "12", name: "Chandigarh", state: "Punjab" },
  { id: "13", name: "Kochi", state: "Kerala" },
  { id: "14", name: "Bhopal", state: "Madhya Pradesh" },
  { id: "15", name: "Indore", state: "Madhya Pradesh" },
  { id: "16", name: "Nagpur", state: "Maharashtra" },
  { id: "17", name: "Coimbatore", state: "Tamil Nadu" },
  { id: "18", name: "Vadodara", state: "Gujarat" },
  { id: "19", name: "Vizag", state: "Andhra Pradesh" },
  { id: "20", name: "Agra", state: "Uttar Pradesh" },
];

const POPULAR_CITIES = ["Mumbai", "Delhi", "Bengaluru", "Jaipur"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  const { isFavorite, toggleFavorite } = useFavorites();
  const locationStore = useLocationStore();

  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [venuesByCategory, setVenuesByCategory] = useState<Record<string, DbVenue[]>>({});
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Detecting...");
  const [locationSearch, setLocationSearch] = useState("");
  const [usingGPS, setUsingGPS] = useState(true);
  const [unavailableModalVisible, setUnavailableModalVisible] = useState(false);

  // Initialize location on mount
  useEffect(() => {
    locationStore.initialize();
  }, []);

  // Update selected location when GPS resolves
  useEffect(() => {
    if (locationStore.city && locationStore.state) {
      setSelectedLocation(`${locationStore.city}, ${locationStore.state}`);
      setUsingGPS(true);
    } else if (locationStore.error) {
      setSelectedLocation("Ahmedabad, Gujarat");
      setUsingGPS(false);
    }
  }, [locationStore.city, locationStore.state, locationStore.error]);

  // Load data when location changes
  useEffect(() => {
    loadData();
  }, [locationStore.latitude, locationStore.longitude, locationStore.isLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      // Pass GPS coordinates if available for distance sorting
      if (locationStore.latitude && locationStore.longitude) {
        filters.lat = locationStore.latitude;
        filters.lng = locationStore.longitude;
        filters.radius = 50000; // Show all venues, sorted by nearest
      }

      const [cats, allVenues] = await Promise.all([
        fetchCategories(),
        fetchVenues(filters),
      ]);
      setCategories(cats);

      // Group venues by category name
      const grouped: Record<string, DbVenue[]> = {};
      for (const venue of allVenues) {
        const catName = venue.category?.name ?? "Other";
        if (!grouped[catName]) grouped[catName] = [];
        grouped[catName].push(venue);
      }
      setVenuesByCategory(grouped);
    } catch (err) {
      console.error("Failed to load home data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = locationSearch.trim()
    ? CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
        c.state.toLowerCase().includes(locationSearch.toLowerCase())
    )
    : CITIES;

  const handleSelectCity = async (city: { name: string; state: string }) => {
    setLocationSearch("");
    setLocationModalVisible(false);

    // Check if venues are available in the selected city
    try {
      const cityVenues = await fetchVenues({ city: city.name });
      if (cityVenues.length === 0) {
        // No venues in this city — show unavailable popup
        setUnavailableModalVisible(true);
        return;
      }
    } catch {
      // If check fails, proceed anyway
    }

    setSelectedLocation(`${city.name}, ${city.state}`);
    setUsingGPS(false);
  };

  const formatPrice = (amount: number | null | undefined) => {
    if (amount == null || isNaN(amount)) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setLocationModalVisible(true)} activeOpacity={0.7}>
            <Text style={styles.locationLabel}>Location</Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color={Colors.primary} />
              {locationStore.isLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 4 }} />
              ) : (
                <Text style={styles.locationText}>{selectedLocation}</Text>
              )}
              <ChevronDown size={16} color={Colors.primary} style={{ marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton} onPress={() => router.push("/notifications" as any)}>
            <Bell size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Location Picker Modal */}
        <Modal
          visible={locationModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setLocationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <TouchableOpacity
                  onPress={() => {
                    setLocationSearch("");
                    setLocationModalVisible(false);
                  }}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchContainer}>
                <Search size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search city or state..."
                  placeholderTextColor={Colors.textTertiary}
                  value={locationSearch}
                  onChangeText={setLocationSearch}
                />
                {locationSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setLocationSearch("")}>
                    <X size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.currentLocationRow}
                onPress={() => {
                  locationStore.refreshLocation();
                  setUsingGPS(true);
                  setLocationSearch("");
                  setLocationModalVisible(false);
                }}
              >
                <View style={styles.currentLocationIcon}>
                  <Navigation size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.currentLocationText}>Use Current Location</Text>
                  <Text style={styles.currentLocationSub}>
                    {locationStore.isLoading
                      ? "Detecting..."
                      : locationStore.city
                      ? `${locationStore.city}, ${locationStore.state}`
                      : "GPS will detect your city"}
                  </Text>
                </View>
                {usingGPS && locationStore.city && (
                  <View style={styles.selectedDot} />
                )}
              </TouchableOpacity>

              {!locationSearch && (
                <>
                  <Text style={styles.sectionLabel}>Popular Cities</Text>
                  <View style={styles.popularCitiesRow}>
                    {POPULAR_CITIES.map((city) => (
                      <TouchableOpacity
                        key={city}
                        style={styles.popularCityChip}
                        onPress={() => {
                          const found = CITIES.find((c) => c.name === city);
                          if (found) handleSelectCity(found);
                        }}
                      >
                        <Text style={styles.popularCityChipText}>{city}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.sectionLabel}>
                {locationSearch ? "Search Results" : "All Cities"}
              </Text>
              <FlatList
                data={filteredCities}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No cities found for "{locationSearch}"</Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.cityRow}
                    onPress={() => handleSelectCity(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cityIconWrap}>
                      <MapPin size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.cityRowInfo}>
                      <Text style={styles.cityName}>{item.name}</Text>
                      <Text style={styles.cityState}>{item.state}</Text>
                    </View>
                    {selectedLocation.startsWith(item.name) && (
                      <View style={styles.selectedDot} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Unavailable Location Modal */}
        <Modal
          visible={unavailableModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setUnavailableModalVisible(false)}
        >
          <View style={styles.unavailableOverlay}>
            <View style={styles.unavailableCard}>
              <TouchableOpacity
                style={styles.unavailableClose}
                onPress={() => setUnavailableModalVisible(false)}
              >
                <X size={20} color={Colors.text} />
              </TouchableOpacity>

              <View style={styles.unavailableIconWrap}>
                <MapPin size={40} color={Colors.primary} />
              </View>

              <Text style={styles.unavailableTitle}>We're not here yet!</Text>
              <Text style={styles.unavailableMessage}>
                Sorry for the inconvenience! We are not available in your location now, but we are expanding our services. Hope to provide service in your area soon.
              </Text>

              <TouchableOpacity
                style={styles.unavailableButton}
                onPress={() => setUnavailableModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.unavailableButtonText}>Browse Available Venues</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.searchContainer} onPress={() => router.push("/(tabs)/search" as any)} activeOpacity={0.7}>
            <Search size={18} color={Colors.textSecondary} />
            <Text style={[styles.searchInput, { color: Colors.textTertiary }]}>Search venues</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => router.push("/(tabs)/search" as any)}>
            <SlidersHorizontal size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          {[{ id: 'all', name: 'All', icon: 'apps', sort_order: 0, created_at: '' }, ...categories].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => {
                if (cat.id !== 'all') {
                  router.push({ pathname: "/category-venues" as any, params: { category: cat.name } });
                }
              }}
            >
              <MaterialIcons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.id ? "#FFFFFF" : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          categories.map((category) => {
            const categoryVenues = venuesByCategory[category.name] ?? [];
            if (categoryVenues.length === 0) return null;

            return (
              <View key={category.id}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{category.name}</Text>
                  <TouchableOpacity style={styles.seeMoreButton} onPress={() => router.push({ pathname: "/category-venues" as any, params: { category: category.name } })}>
                    <Text style={styles.seeAll}>See More</Text>
                    <ChevronRight size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularScroll}>
                  {categoryVenues.map((venue) => (
                    <TouchableOpacity
                      key={venue.id}
                      style={styles.popularCard}
                      onPress={() => router.push({ pathname: "/venue-detail", params: { id: venue.id } })}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: venue.image_url ?? undefined }} style={styles.popularImage} />
                      <View style={styles.popularOverlay}>
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>{category.name}</Text>
                        </View>
                        <TouchableOpacity style={styles.popularHeart} onPress={() => toggleFavorite(venue.id)}>
                          <Heart size={18} color={isFavorite(venue.id) ? Colors.primary : Colors.textTertiary} fill={isFavorite(venue.id) ? Colors.primary : "none"} />
                        </TouchableOpacity>
                        <View style={styles.popularBottom}>
                          {venue.capacity > 0 && (
                            <View style={styles.capacityBadge}>
                              <Users size={11} color={Colors.white} />
                              <Text style={styles.capacityText}>Up to {venue.capacity}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.popularDetails}>
                        <Text style={styles.popularTitle} numberOfLines={1}>{venue.name}</Text>
                        <Text style={styles.popularCity}>{venue.city}</Text>
                        <View style={styles.popularFooter}>
                          <View style={styles.ratingRow}>
                            <Star size={12} color="#FFB800" fill="#FFB800" />
                            <Text style={styles.ratingText}>{venue.rating} ({venue.review_count})</Text>
                          </View>
                          <Text style={styles.popularPrice}>{formatPrice(venue.price_per_day)}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    maxWidth: 180,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  // --- Modal styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  currentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  currentLocationSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  popularCitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  popularCityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  popularCityChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cityRowInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  cityState: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 24,
  },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
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
  categoriesRow: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    marginRight: 10,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  categoryTextActive: {
    color: Colors.white,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingRight: 10,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  popularScroll: {
    paddingLeft: 20,
    marginBottom: 8,
  },
  popularCard: {
    width: 260,
    marginRight: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  popularImage: {
    width: "100%",
    height: 160,
  },
  popularOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    padding: 12,
  },
  popularBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  popularBadgeText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: "600" as const,
  },
  popularHeart: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  popularBottom: {
    position: "absolute",
    bottom: 12,
    left: 12,
  },
  capacityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  capacityText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: "600" as const,
  },
  popularDetails: {
    padding: 12,
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  popularCity: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  popularFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  },
  popularPrice: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  // Unavailable location modal
  unavailableOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  unavailableCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  unavailableClose: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  unavailableIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight || "#FFF0F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  unavailableTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 10,
  },
  unavailableMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  unavailableButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  unavailableButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700" as const,
  },
});
