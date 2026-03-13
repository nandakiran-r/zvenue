import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Heart, MapPin, Search, Star, Users } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { VENUES } from "@/mocks/venues";

export default function CategoryVenuesScreen() {
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [searchQuery, setSearchQuery] = useState("");

  const categoryVenues = VENUES.filter((v) => v.category === category);
  const filteredVenues = categoryVenues.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category} ({categoryVenues.length})</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search in ${category}...`}
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredVenues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No venues found.</Text>
        }
        renderItem={({ item: venue }) => (
          <TouchableOpacity
            style={styles.venueCard}
            onPress={() => router.push({ pathname: "/venue-detail", params: { id: venue.id } })}
            activeOpacity={0.8}
          >
            <Image source={{ uri: venue.image }} style={styles.venueImage} />
            <View style={styles.venueInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.venueTitle} numberOfLines={1}>{venue.name}</Text>
                <TouchableOpacity>
                  <Heart size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.locationRow}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.locationText}>{venue.city}</Text>
              </View>
              <View style={styles.detailsRow}>
                <View style={styles.ratingRow}>
                  <Star size={14} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.ratingText}>{venue.rating} ({venue.reviewCount})</Text>
                </View>
                {venue.capacity > 0 && (
                  <View style={styles.capacityRow}>
                    <Users size={14} color={Colors.textSecondary} />
                    <Text style={styles.capacityText}>Upto {venue.capacity}</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{venue.pricePerDay}</Text>
                <Text style={styles.priceUnit}> / day</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  searchContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface,
    marginHorizontal: 20, marginTop: 16, marginBottom: 12, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.text },
  listContent: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 },
  emptyText: { textAlign: "center", color: Colors.textSecondary, marginTop: 40, fontSize: 16 },
  venueCard: {
    backgroundColor: Colors.white, borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  venueImage: { width: "100%", height: 180 },
  venueInfo: { padding: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  venueTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, flex: 1, marginRight: 10 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  locationText: { fontSize: 14, color: Colors.textSecondary },
  detailsRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  capacityRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  capacityText: { fontSize: 14, color: Colors.textSecondary },
  priceRow: { flexDirection: "row", alignItems: "baseline" },
  priceText: { fontSize: 18, fontWeight: "700", color: Colors.primary },
  priceUnit: { fontSize: 14, color: Colors.textSecondary },
});
