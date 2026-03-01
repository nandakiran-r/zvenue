import { router } from "expo-router";
import { Heart, MapPin, Star, Users } from "lucide-react-native";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { VENUES } from "@/mocks/venues";

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const favoriteVenues = VENUES.slice(0, 4);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Saved Venues</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {favoriteVenues.map((venue) => (
          <TouchableOpacity
            key={venue.id}
            style={styles.venueCard}
            onPress={() => router.push({ pathname: "/venue-detail", params: { id: venue.id } })}
            activeOpacity={0.7}
          >
            <Image source={{ uri: venue.image }} style={styles.venueImage} />
            <View style={styles.venueInfo}>
              <Text style={styles.venueTitle} numberOfLines={2}>{venue.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.venueLocation}>{venue.city}</Text>
              </View>
              <View style={styles.metaRow}>
                <Star size={12} color="#FFB800" fill="#FFB800" />
                <Text style={styles.ratingText}>{venue.rating}</Text>
                <Users size={12} color={Colors.textSecondary} />
                <Text style={styles.capacityText}>Up to {venue.capacity}</Text>
              </View>
              <Text style={styles.priceText}>{venue.pricePerDay}/day</Text>
            </View>
            <TouchableOpacity style={styles.heartButton}>
              <Heart size={20} color={Colors.primary} fill={Colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {favoriteVenues.length === 0 && (
          <View style={styles.emptyState}>
            <Heart size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No saved venues yet</Text>
            <Text style={styles.emptySubtext}>Start adding venues to your favorites</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
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
    padding: 12,
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
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "600" as const,
    marginRight: 4,
  },
  capacityText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  priceText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  heartButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
