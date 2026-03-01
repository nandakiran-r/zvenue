import { router } from "expo-router";
import { ChevronLeft, MapPin, Search as SearchIcon } from "lucide-react-native";
import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { EVENTS } from "@/mocks/events";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const event = EVENTS[3];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Map Direction</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=400&fit=crop" }}
            style={styles.mapImage}
          />
          <View style={styles.mapOverlay}>
            <View style={styles.mapPin}>
              <MapPin size={24} color={Colors.primary} fill={Colors.primary} />
            </View>
            <View style={styles.mapRoute} />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push({ pathname: "/event-detail", params: { id: event.id } })}
        activeOpacity={0.7}
      >
        <Image source={{ uri: event.image }} style={styles.eventImage} />
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.eventMeta}>Party • 1 km away</Text>
          <Text style={styles.eventPrice}>{event.price}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    paddingVertical: 12,
  },
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchContainer: {
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
  mapContainer: {
    flex: 1,
    marginHorizontal: 0,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#E8E8E8",
    position: "relative",
    overflow: "hidden",
  },
  mapImage: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,0,102,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapRoute: {
    width: 4,
    height: 100,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginTop: -8,
  },
  eventCard: {
    flexDirection: "row",
    margin: 20,
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  eventImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  eventInfo: {
    flex: 1,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  eventMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  eventPrice: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
  },
});
