import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { Calendar, ChevronLeft, Heart, MapPin, MessageCircle } from "lucide-react-native";
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
import { AVATAR_IMAGES, EVENTS } from "@/mocks/events";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const event = EVENTS.find((e) => e.id === id) ?? EVENTS[0];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: event.image }} style={styles.heroImage} />
          <View style={[styles.imageOverlay, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.iconButton} onPress={() => safeBack("/(tabs)/home")}>
              <ChevronLeft size={22} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Heart size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleInfo}>
              <Text style={styles.title}>{event.title}</Text>
              <View style={styles.metaRow}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{event.location}</Text>
              </View>
              <View style={styles.metaRow}>
                <Calendar size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{event.date}</Text>
              </View>
            </View>
            <Text style={styles.price}>{event.price}</Text>
          </View>

          <View style={styles.attendeesRow}>
            <View style={styles.avatarStack}>
              {AVATAR_IMAGES.slice(0, 4).map((img, i) => (
                <Image
                  key={i}
                  source={{ uri: img }}
                  style={[styles.avatar, { marginLeft: i > 0 ? -10 : 0 }]}
                />
              ))}
              <View style={[styles.avatar, styles.avatarMore, { marginLeft: -10 }]}>
                <Text style={styles.avatarMoreText}>+{event.attendees}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organizers and Attendees</Text>
          <View style={styles.organizerRow}>
            <Image source={{ uri: event.organizerImage }} style={styles.organizerAvatar} />
            <View style={styles.organizerBadge}>
              <Text style={styles.organizerBadgeText}>+15</Text>
            </View>
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerLabel}>Organizers</Text>
              <Text style={styles.organizerName}>{event.organizer}</Text>
            </View>
            <TouchableOpacity style={styles.chatButton}>
              <MessageCircle size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=300&fit=crop" }}
              style={styles.mapImage}
            />
            <TouchableOpacity style={styles.seeLocationButton}>
              <Text style={styles.seeLocationText}>See Location</Text>
            </TouchableOpacity>
            <View style={styles.mapPinContainer}>
              <MapPin size={24} color={Colors.primary} fill={Colors.primary} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => router.push({ pathname: "/order-detail", params: { id: event.id } })}
          activeOpacity={0.8}
          testID="buy-ticket"
        >
          <Text style={styles.buyButtonText}>Buy Ticket</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 280,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleInfo: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  attendeesRow: {
    marginTop: 16,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarMore: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMoreText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: "700" as const,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  organizerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  organizerBadge: {
    position: "absolute",
    left: 30,
    bottom: 0,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  organizerBadgeText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: "700" as const,
  },
  organizerInfo: {
    flex: 1,
    marginLeft: 4,
  },
  organizerLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  organizerName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  mapContainer: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
    opacity: 0.7,
  },
  seeLocationButton: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  seeLocationText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  mapPinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -12,
    marginTop: -24,
    backgroundColor: "rgba(255,0,102,0.15)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  buyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
