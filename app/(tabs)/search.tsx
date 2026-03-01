import { router } from "expo-router";
import { Heart, MapPin, Search as SearchIcon, SlidersHorizontal } from "lucide-react-native";
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
import { EVENTS } from "@/mocks/events";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState<string>("");
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFav = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const filteredEvents = searchText
    ? EVENTS.filter((e) =>
        e.title.toLowerCase().includes(searchText.toLowerCase())
      )
    : EVENTS;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={Colors.textTertiary}
            value={searchText}
            onChangeText={setSearchText}
            testID="search-input"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <SlidersHorizontal size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.locationBanner} activeOpacity={0.7}>
        <MapPin size={16} color={Colors.primary} />
        <Text style={styles.locationText}>My Current Location</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            onPress={() => router.push({ pathname: "/event-detail", params: { id: event.id } })}
            activeOpacity={0.7}
          >
            <Image source={{ uri: event.image }} style={styles.eventImage} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
              <Text style={styles.eventDate}>{event.date}</Text>
            </View>
            <TouchableOpacity
              onPress={() => toggleFav(event.id)}
              style={styles.heartButton}
            >
              <Heart
                size={20}
                color={favorites.includes(event.id) ? Colors.primary : Colors.textTertiary}
                fill={favorites.includes(event.id) ? Colors.primary : "none"}
              />
            </TouchableOpacity>
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
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F5",
    marginHorizontal: 20,
    borderRadius: 24,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
  },
  eventImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  heartButton: {
    padding: 8,
  },
});
