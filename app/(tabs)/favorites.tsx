import { router } from "expo-router";
import { Heart, MapPin } from "lucide-react-native";
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
import { EVENTS } from "@/mocks/events";

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const favoriteEvents = EVENTS.slice(0, 4);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>My Favorites</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {favoriteEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            onPress={() => router.push({ pathname: "/event-detail", params: { id: event.id } })}
            activeOpacity={0.7}
          >
            <Image source={{ uri: event.image }} style={styles.eventImage} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.eventLocation}>{event.location}</Text>
              </View>
              <Text style={styles.eventDate}>{event.date}</Text>
            </View>
            <TouchableOpacity style={styles.heartButton}>
              <Heart size={20} color={Colors.primary} fill={Colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {favoriteEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Heart size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>Start adding events to your favorites</Text>
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
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
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
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  eventDate: {
    fontSize: 11,
    color: Colors.textTertiary,
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
