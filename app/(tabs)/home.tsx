import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Bell, ChevronDown, ChevronRight, Heart, MapPin, Navigation, Search, SlidersHorizontal, Star, Users, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useNotificationStore } from "@/store/notificationStore";
import { fetchCategories, fetchVenues } from "@/lib/api";
import { fetchServiceCategories, searchAll } from "@/lib/serviceApi";
import { addNotificationReceivedListener } from "@/lib/notifications";
import type { DbCategory, DbVenue } from "@/lib/types";
import type { DbServiceCategory, SearchResults } from "@/lib/serviceTypes";

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
  const { dbUser } = useAuth();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [venuesByCategory, setVenuesByCategory] = useState<Record<string, DbVenue[]>>({});
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Detecting...");
  const [locationSearch, setLocationSearch] = useState("");
  const [usingGPS, setUsingGPS] = useState(true);
  const [unavailableModalVisible, setUnavailableModalVisible] = useState(false);

  // Service marketplace state
  const [activeTab, setActiveTab] = useState<'venues' | 'services'>('venues');
  const [serviceCategories, setServiceCategories] = useState<DbServiceCategory[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'venues' | 'services'>('all');
  const [sortBy, setSortBy] = useState<'none' | 'price_low' | 'price_high' | 'rating'>('none');

  // Initialize location on mount
  useEffect(() => {
    locationStore.initialize();
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    if (dbUser?.id) {
      fetchUnreadCount(dbUser.id);
    }
  }, [dbUser?.id]);

  // Increment badge when a push notification arrives in foreground
  useEffect(() => {
    const subscription = addNotificationReceivedListener(() => {
      useNotificationStore.getState().incrementUnread();
    });
    return () => subscription.remove();
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

      const [cats, allVenues, svcCats] = await Promise.all([
        fetchCategories(),
        fetchVenues(filters),
        fetchServiceCategories(),
      ]);
      setCategories(cats);
      setServiceCategories(svcCats);

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

  // Debounced search
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.trim().length < 2) {
      setIsSearching(false);
      setSearchResults(null);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setIsSearching(true);
        const results = await searchAll(text.trim(), filterType);
        console.log('Search results:', JSON.stringify({ venues: results.venues.length, services: results.services.length }));
        setSearchResults(sortResults(results));
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [filterType, sortBy]);

  // Re-search when filter/sort changes
  useEffect(() => {
    if (isSearching && searchQuery.trim().length >= 2) {
      const doSearch = async () => {
        try {
          setSearchLoading(true);
          const results = await searchAll(searchQuery.trim(), filterType);
          setSearchResults(sortResults(results));
        } catch (err) {
          console.error("Search failed:", err);
        } finally {
          setSearchLoading(false);
        }
      };
      doSearch();
    }
  }, [filterType, sortBy]);

  const sortResults = (results: SearchResults): SearchResults => {
    let venues = [...results.venues];
    let services = [...results.services];

    if (sortBy === 'price_low') {
      venues.sort((a, b) => a.price_per_day - b.price_per_day);
      services.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
      venues.sort((a, b) => b.price_per_day - a.price_per_day);
      services.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      venues.sort((a, b) => b.rating - a.rating);
      services.sort((a, b) => b.rating - a.rating);
    }

    return { venues, services };
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults(null);
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    // Sync filter type with the active tab on browse view
    if (filterType === 'venues') setActiveTab('venues');
    else if (filterType === 'services') setActiveTab('services');

    if (isSearching && searchQuery.trim().length >= 2) {
      // Re-trigger search with new filters
      const doSearch = async () => {
        try {
          setSearchLoading(true);
          const results = await searchAll(searchQuery.trim(), filterType);
          setSearchResults(sortResults(results));
        } catch (err) {
          console.error("Search failed:", err);
        } finally {
          setSearchLoading(false);
        }
      };
      doSearch();
    } else {
      // Apply sort to the browse view
      applySortToBrowseView();
    }
  };

  const applySortToBrowseView = () => {
    if (sortBy === 'none') return;
    const sorted: Record<string, DbVenue[]> = {};
    for (const [catName, venues] of Object.entries(venuesByCategory)) {
      const copy = [...venues];
      if (sortBy === 'price_low') {
        copy.sort((a, b) => (a.price_per_day ?? 0) - (b.price_per_day ?? 0));
      } else if (sortBy === 'price_high') {
        copy.sort((a, b) => (b.price_per_day ?? 0) - (a.price_per_day ?? 0));
      } else if (sortBy === 'rating') {
        copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      }
      sorted[catName] = copy;
    }
    setVenuesByCategory(sorted);
  };

  // Apply sort when sortBy changes on browse view
  useEffect(() => {
    if (!isSearching && sortBy !== 'none') {
      applySortToBrowseView();
    }
  }, [sortBy]);

  const clearFilters = () => {
    setFilterType('all');
    setSortBy('none');
    // Reload original data without sort
    loadData();
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
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
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

        <View style={styles.searchRow} testID="home-search-bar">
          <View style={styles.searchContainer}>
            <Search size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search venues & services"
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <X size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterButton, (filterType !== 'all' || sortBy !== 'none') && styles.filterButtonActive]}
            onPress={() => setFilterModalVisible(true)}
          >
            <SlidersHorizontal size={18} color={(filterType !== 'all' || sortBy !== 'none') ? Colors.primary : Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.filterModalOverlay}>
            <View style={styles.filterModalContainer}>
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>Filter & Sort</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.modalCloseBtn}>
                  <X size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.filterSectionTitle}>Show</Text>
              <View style={styles.filterChipsRow}>
                {(['all', 'venues', 'services'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterChip, filterType === type && styles.filterChipActive]}
                    onPress={() => setFilterType(type)}
                  >
                    <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
                      {type === 'all' ? 'All' : type === 'venues' ? 'Venues' : 'Services'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Sort by</Text>
              <View style={styles.sortOptionsContainer}>
                {([
                  { key: 'none', label: 'Default' },
                  { key: 'price_low', label: 'Price: Low to High' },
                  { key: 'price_high', label: 'Price: High to Low' },
                  { key: 'rating', label: 'Rating: Highest First' },
                ] as const).map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={styles.sortOption}
                    onPress={() => setSortBy(option.key)}
                  >
                    <View style={[styles.radioOuter, sortBy === option.key && styles.radioOuterActive]}>
                      {sortBy === option.key && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.sortOptionText, sortBy === option.key && styles.sortOptionTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity style={styles.clearFilterBtn} onPress={clearFilters}>
                  <Text style={styles.clearFilterText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyFilterBtn} onPress={applyFilters}>
                  <Text style={styles.applyFilterText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Search Results (shown when searching) */}
        {isSearching ? (
          searchLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : searchResults ? (
            <View style={styles.searchResultsContainer}>
              {/* Venue Results */}
              {(filterType === 'all' || filterType === 'venues') && searchResults.venues.length > 0 && (
                <>
                  <Text style={styles.searchResultsTitle}>Venues</Text>
                  {searchResults.venues.map((venue) => (
                    <TouchableOpacity
                      key={venue.id}
                      style={styles.searchResultCard}
                      onPress={() => router.push({ pathname: "/venue-detail", params: { id: venue.id } })}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: venue.image_url ?? undefined }} style={styles.searchResultImage} />
                      <View style={styles.searchResultInfo}>
                        <View style={styles.searchResultBadgeRow}>
                          <View style={styles.searchResultBadge}>
                            <Text style={styles.searchResultBadgeText}>Venue</Text>
                          </View>
                        </View>
                        <Text style={styles.searchResultName} numberOfLines={1}>{venue.name}</Text>
                        <View style={styles.searchResultMeta}>
                          <MapPin size={11} color={Colors.textSecondary} />
                          <Text style={styles.searchResultCity}>{venue.city}</Text>
                        </View>
                        <View style={styles.searchResultFooter}>
                          <View style={styles.ratingRow}>
                            <Star size={12} color="#FFB800" fill="#FFB800" />
                            <Text style={styles.ratingText}>{venue.rating}</Text>
                          </View>
                          <Text style={styles.searchResultPrice}>{formatPrice(venue.price_per_day)}/day</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Service Results */}
              {(filterType === 'all' || filterType === 'services') && searchResults.services.length > 0 && (
                <>
                  <Text style={styles.searchResultsTitle}>Services</Text>
                  {searchResults.services.map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      style={styles.searchResultCard}
                      onPress={() => router.push({ pathname: "/service-detail" as any, params: { id: service.id } })}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: service.image_url ?? (service.images?.[0] ?? undefined) }} style={styles.searchResultImage} />
                      <View style={styles.searchResultInfo}>
                        <View style={styles.searchResultBadgeRow}>
                          <View style={[styles.searchResultBadge, styles.searchResultBadgeService]}>
                            <Text style={[styles.searchResultBadgeText, styles.searchResultBadgeServiceText]}>Service</Text>
                          </View>
                          {service.category?.name && (
                            <Text style={styles.searchResultCategory}>{service.category.name}</Text>
                          )}
                        </View>
                        <Text style={styles.searchResultName} numberOfLines={1}>{service.name}</Text>
                        <View style={styles.searchResultMeta}>
                          <MapPin size={11} color={Colors.textSecondary} />
                          <Text style={styles.searchResultCity}>{service.city}</Text>
                        </View>
                        <View style={styles.searchResultFooter}>
                          <View style={styles.ratingRow}>
                            <Star size={12} color="#FFB800" fill="#FFB800" />
                            <Text style={styles.ratingText}>{service.rating}</Text>
                          </View>
                          <Text style={styles.searchResultPrice}>{formatPrice(service.price)}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* No results */}
              {searchResults.venues.length === 0 && searchResults.services.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Search size={48} color={Colors.textTertiary} />
                  <Text style={styles.noResultsTitle}>No results found</Text>
                  <Text style={styles.noResultsSubtitle}>Try a different search term or adjust your filters</Text>
                </View>
              )}
            </View>
          ) : null
        ) : (
          <>
        {/* Venues / Services Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, activeTab === 'venues' && styles.toggleButtonActive]}
            onPress={() => setActiveTab('venues')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, activeTab === 'venues' && styles.toggleTextActive]}>Venues</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, activeTab === 'services' && styles.toggleButtonActive]}
            onPress={() => setActiveTab('services')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, activeTab === 'services' && styles.toggleTextActive]}>Services</Text>
          </TouchableOpacity>
        </View>

        {/* Category Chips — Venues or Services */}
        {activeTab === 'venues' ? (
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
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
            {serviceCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryChip}
                onPress={() => router.push({ pathname: "/service-listings" as any, params: { categoryId: cat.id, categoryName: cat.name } })}
              >
                <Text style={styles.categoryText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : activeTab === 'venues' ? (
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
        ) : (
          /* Services Tab Content */
          <View style={styles.servicesContent}>
            {serviceCategories.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 16, color: Colors.textSecondary }}>No service categories available</Text>
              </View>
            ) : (
              serviceCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.serviceCategoryCard}
                  onPress={() => router.push({ pathname: "/service-listings" as any, params: { categoryId: cat.id, categoryName: cat.name } })}
                  activeOpacity={0.7}
                >
                  <View style={styles.serviceCategoryIcon}>
                    <Text style={styles.serviceCategoryEmoji}>
                      {cat.icon === 'scissors' ? '✂️' : cat.icon === 'palette' ? '🎨' : cat.icon === 'utensils' ? '🍽️' : cat.icon === 'hand-metal' ? '🤚' : cat.icon === 'car' ? '🚗' : cat.icon === 'droplets' ? '💧' : cat.icon === 'shirt' ? '👔' : cat.icon === 'gem' ? '💎' : cat.icon === 'package' ? '📦' : '⭐'}
                    </Text>
                  </View>
                  <Text style={styles.serviceCategoryName}>{cat.name}</Text>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
          </>
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
    paddingBottom: 80,
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
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#FFFFFF",
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
  // Venues / Services Toggle
  toggleRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 14,
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  // Service categories grid
  servicesContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  serviceCategoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  serviceCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceCategoryEmoji: {
    fontSize: 20,
  },
  serviceCategoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  // Filter button active state
  filterButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  // Filter Modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  filterModalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterChipsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
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
    fontWeight: "600" as const,
    color: Colors.text,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  sortOptionsContainer: {
    gap: 4,
    marginBottom: 20,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  sortOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  sortOptionTextActive: {
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  filterActions: {
    flexDirection: "row",
    gap: 12,
  },
  clearFilterBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  applyFilterBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  applyFilterText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  // Search Results
  searchResultsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  searchResultCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  searchResultImage: {
    width: 100,
    height: 100,
  },
  searchResultInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  searchResultBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  searchResultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight,
  },
  searchResultBadgeService: {
    backgroundColor: "#E8F5E9",
  },
  searchResultBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  searchResultBadgeServiceText: {
    color: "#2E7D32",
  },
  searchResultCategory: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  searchResultMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  searchResultCity: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  searchResultFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchResultPrice: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  noResultsContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
