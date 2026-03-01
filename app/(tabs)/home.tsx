import { router } from "expo-router";
import { Bell, Heart, MapPin, Search, SlidersHorizontal } from "lucide-react-native";
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
import { AVATAR_IMAGES, CATEGORIES, EVENTS } from "@/mocks/events";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>("1");

  const upcomingEvents = EVENTS.slice(0, 3);
  const popularEvents = EVENTS.slice(2, 5);
  const recommendations = EVENTS.slice(3);

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
              placeholder="Search"
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
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
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
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {upcomingEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.upcomingCard}
            onPress={() => router.push({ pathname: "/event-detail", params: { id: event.id } })}
            activeOpacity={0.7}
          >
            <Image source={{ uri: event.image }} style={styles.upcomingImage} />
            <View style={styles.upcomingInfo}>
              <Text style={styles.upcomingTitle} numberOfLines={2}>{event.title}</Text>
              <View style={styles.upcomingLocationRow}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.upcomingLocation}>{event.location}</Text>
              </View>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinText}>Join</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Now</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularScroll}>
          {popularEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.popularCard}
              onPress={() => router.push({ pathname: "/event-detail", params: { id: event.id } })}
              activeOpacity={0.8}
            >
              <Image source={{ uri: event.image }} style={styles.popularImage} />
              <View style={styles.popularOverlay}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>{event.category}</Text>
                </View>
                <TouchableOpacity style={styles.popularHeart}>
                  <Heart size={18} color={Colors.primary} fill={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.popularBottom}>
                  <Text style={styles.popularAuthor}>Altanito Salami</Text>
                </View>
              </View>
              <View style={styles.popularDetails}>
                <Text style={styles.popularTitle} numberOfLines={1}>{event.title}</Text>
                <Text style={styles.popularDate}>{event.date}</Text>
                <View style={styles.popularFooter}>
                  <View style={styles.avatarStack}>
                    {AVATAR_IMAGES.slice(0, 3).map((img, i) => (
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
                  <Text style={styles.popularPrice}>{event.price}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommendations for you</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recommendations.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.recommendCard}
            onPress={() => router.push({ pathname: "/event-detail", params: { id: event.id } })}
            activeOpacity={0.7}
          >
            <Image source={{ uri: event.image }} style={styles.recommendImage} />
            <View style={styles.recommendInfo}>
              <Text style={styles.recommendTitle} numberOfLines={2}>{event.title}</Text>
              <View style={styles.recommendLocationRow}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.recommendLocation}>{event.location}</Text>
              </View>
            </View>
            <Text style={styles.recommendPrice}>{event.price}</Text>
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
  categoryEmoji: {
    fontSize: 16,
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
  upcomingCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: "hidden",
    gap: 12,
  },
  upcomingImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  upcomingInfo: {
    flex: 1,
    justifyContent: "center",
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  upcomingLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  upcomingLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  joinButton: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  joinText: {
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
  popularAuthor: {
    fontSize: 12,
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
    marginBottom: 4,
  },
  popularDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  popularFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarMore: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMoreText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: "700" as const,
  },
  popularPrice: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  recommendCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 14,
    alignItems: "center",
    gap: 12,
  },
  recommendImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  recommendInfo: {
    flex: 1,
  },
  recommendTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  recommendLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recommendLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  recommendPrice: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
});
