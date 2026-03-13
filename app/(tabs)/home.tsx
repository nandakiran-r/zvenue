import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Bell, ChevronDown, ChevronRight, Heart, MapPin, Navigation, Search, SlidersHorizontal, Star, Users, X } from "lucide-react-native";
import React, { useState } from "react";
import {
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
import { AVATAR_IMAGES, CATEGORIES, VENUES } from "@/mocks/venues";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Ahmedabad, Gujarat");
  const [locationSearch, setLocationSearch] = useState("");

  // Removed static featured/popular/nearby arrays

  const filteredCities = locationSearch.trim()
    ? CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
        c.state.toLowerCase().includes(locationSearch.toLowerCase())
    )
    : CITIES;

  const handleSelectCity = (city: { name: string; state: string }) => {
    setSelectedLocation(`${city.name}, ${city.state}`);
    setLocationSearch("");
    setLocationModalVisible(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setLocationModalVisible(true)} activeOpacity={0.7}>
            <Text style={styles.locationLabel}>Location</Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color={Colors.primary} />
              <Text style={styles.locationText}>{selectedLocation}</Text>
              <ChevronDown size={16} color={Colors.primary} style={{ marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
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
              {/* Modal Header */}
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

              {/* Search Input */}
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

              {/* Use Current Location */}
              <TouchableOpacity
                style={styles.currentLocationRow}
                onPress={() => {
                  setSelectedLocation("Current Location");
                  setLocationSearch("");
                  setLocationModalVisible(false);
                }}
              >
                <View style={styles.currentLocationIcon}>
                  <Navigation size={16} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.currentLocationText}>Use Current Location</Text>
                  <Text style={styles.currentLocationSub}>GPS will detect your city</Text>
                </View>
              </TouchableOpacity>

              {/* Popular Cities */}
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

              {/* City List */}
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

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search venues"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <SlidersHorizontal size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          {[{ id: 'all', name: 'All', icon: 'apps' }, ...CATEGORIES].map((cat) => (
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

        {CATEGORIES.map((category) => {
          const categoryVenues = VENUES.filter(v => v.category === category.name);
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
                    <Image source={{ uri: venue.image }} style={styles.popularImage} />
                    <View style={styles.popularOverlay}>
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>{venue.category}</Text>
                      </View>
                      <TouchableOpacity style={styles.popularHeart}>
                        <Heart size={18} color={Colors.primary} fill={Colors.primary} />
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
                          <Text style={styles.ratingText}>{venue.rating} ({venue.reviewCount})</Text>
                        </View>
                        <Text style={styles.popularPrice}>{venue.pricePerDay}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
  featuredCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: "hidden",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
  },
  featuredImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  featuredInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  featuredLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  featuredLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  featuredFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  bookButton: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  bookText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: "600" as const,
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
  popularPrice: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  nearbyCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 14,
    alignItems: "center",
    gap: 12,
  },
  nearbyImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  nearbyLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nearbyLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  nearbyPrice: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
});
