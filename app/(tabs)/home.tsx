import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Bell, Heart, MapPin, Search, SlidersHorizontal, Star, Users } from "lucide-react-native";
import React, { useState } from "react";
import {
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
import { AVATAR_IMAGES, CATEGORIES, VENUES } from "@/mocks/venues";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>("1");

  const featuredVenues = VENUES.slice(0, 3);
  const popularVenues = VENUES.slice(2, 5);
  const nearbyVenues = VENUES.slice(3);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.locationLabel}>Location</Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color={Colors.primary} />
              <Text style={styles.locationText}>Ahmedabad, Gujarat</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

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
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Venues</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {featuredVenues.map((venue) => (
          <TouchableOpacity
            key={venue.id}
            style={styles.featuredCard}
            onPress={() => router.push({ pathname: "/venue-detail", params: { id: venue.id } })}
            activeOpacity={0.7}
          >
            <Image source={{ uri: venue.image }} style={styles.featuredImage} />
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredTitle} numberOfLines={2}>{venue.name}</Text>
              <View style={styles.featuredLocationRow}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.featuredLocation}>{venue.city}</Text>
              </View>
              <View style={styles.featuredFooter}>
                <View style={styles.ratingRow}>
                  <Star size={12} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.ratingText}>{venue.rating}</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => router.push({ pathname: "/venue-detail", params: { id: venue.id } })}
                >
                  <Text style={styles.bookText}>Book</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Halls</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularScroll}>
          {popularVenues.map((venue) => (
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
                  <View style={styles.capacityBadge}>
                    <Users size={11} color={Colors.white} />
                    <Text style={styles.capacityText}>Up to {venue.capacity}</Text>
                  </View>
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Venues</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {nearbyVenues.map((venue) => (
          <TouchableOpacity
            key={venue.id}
            style={styles.nearbyCard}
            onPress={() => router.push({ pathname: "/venue-detail", params: { id: venue.id } })}
            activeOpacity={0.7}
          >
            <Image source={{ uri: venue.image }} style={styles.nearbyImage} />
            <View style={styles.nearbyInfo}>
              <Text style={styles.nearbyTitle} numberOfLines={2}>{venue.name}</Text>
              <View style={styles.nearbyLocationRow}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.nearbyLocation}>{venue.city}</Text>
              </View>
            </View>
            <Text style={styles.nearbyPrice}>{venue.pricePerDay}</Text>
          </TouchableOpacity>
        ))}
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
