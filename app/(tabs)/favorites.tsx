import { router, useFocusEffect } from "expo-router";
import { Heart, MapPin, ShoppingBag, Star, Users } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useFavorites } from "@/context/FavoritesContext";
import { fetchVenueById } from "@/lib/api";
import { fetchServiceFavorites } from "@/lib/serviceApi";
import type { DbVenue } from "@/lib/types";
import type { DbServiceListing } from "@/lib/serviceTypes";

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite } = useFavorites();

  const [activeTab, setActiveTab] = useState<'venues' | 'services'>('venues');
  const [favoriteVenues, setFavoriteVenues] = useState<DbVenue[]>([]);
  const [favoriteServices, setFavoriteServices] = useState<DbServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [favorites.length])
  );

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadVenueFavorites(), loadServiceFavorites()]);
    setLoading(false);
  };

  const loadVenueFavorites = async () => {
    if (favorites.length === 0) { setFavoriteVenues([]); return; }
    try {
      const results = await Promise.all(favorites.map((id) => fetchVenueById(id)));
      setFavoriteVenues(results.filter(Boolean) as DbVenue[]);
    } catch (err) {
      console.error("Failed to load favorite venues:", err);
    }
  };

  const loadServiceFavorites = async () => {
    try {
      const data = await fetchServiceFavorites();
      setFavoriteServices(data);
    } catch (err) {
      console.error("Failed to load service favorites:", err);
      setFavoriteServices([]);
    }
  };

  const formatPrice = (amount: number | null | undefined) => {
    if (amount == null || isNaN(amount)) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Favorites</Text>

      {/* Sub-tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'venues' && styles.tabButtonActive]} onPress={() => setActiveTab('venues')}>
          <Text style={[styles.tabText, activeTab === 'venues' && styles.tabTextActive]}>Venues ({favoriteVenues.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'services' && styles.tabButtonActive]} onPress={() => setActiveTab('services')}>
          <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>Services ({favoriteServices.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : activeTab === 'venues' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {favoriteVenues.map((venue) => (
            <TouchableOpacity key={venue.id} style={styles.card} onPress={() => router.push({ pathname: "/venue-detail", params: { id: venue.id } })} activeOpacity={0.7}>
              <Image source={{ uri: venue.image_url ?? undefined }} style={styles.cardImage} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{venue.name}</Text>
                <View style={styles.metaRow}><MapPin size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{venue.city}</Text></View>
                <View style={styles.metaRow}><Star size={12} color="#FFB800" fill="#FFB800" /><Text style={styles.ratingText}>{venue.rating}</Text><Text style={styles.priceText}>{formatPrice(venue.price_per_day)}/day</Text></View>
              </View>
              <TouchableOpacity style={styles.heartButton} onPress={() => toggleFavorite(venue.id)}>
                <Heart size={20} color={Colors.primary} fill={Colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          {favoriteVenues.length === 0 && (
            <View style={styles.emptyState}><Heart size={48} color={Colors.textTertiary} /><Text style={styles.emptyText}>No saved venues</Text><Text style={styles.emptySubtext}>Tap the heart icon on venues to save them</Text></View>
          )}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {favoriteServices.map((svc) => (
            <TouchableOpacity key={svc.id} style={styles.card} onPress={() => router.push({ pathname: "/service-detail" as any, params: { id: svc.id } })} activeOpacity={0.7}>
              {svc.images?.[0] ? (
                <Image source={{ uri: svc.images[0] }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' }]}><ShoppingBag size={24} color={Colors.textTertiary} /></View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{svc.name}</Text>
                <View style={styles.metaRow}><MapPin size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{svc.city}</Text></View>
                <View style={styles.metaRow}><Star size={12} color="#FFB800" fill="#FFB800" /><Text style={styles.ratingText}>{svc.rating?.toFixed(1)}</Text><Text style={styles.priceText}>{formatPrice(svc.price)}</Text></View>
              </View>
            </TouchableOpacity>
          ))}
          {favoriteServices.length === 0 && (
            <View style={styles.emptyState}><ShoppingBag size={48} color={Colors.textTertiary} /><Text style={styles.emptyText}>No saved services</Text><Text style={styles.emptySubtext}>Tap the heart icon on services to save them</Text></View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Colors.text, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  tabRow: { flexDirection: "row", marginHorizontal: 20, marginBottom: 14, backgroundColor: Colors.surface, borderRadius: 12, padding: 3 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabButtonActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 90 },
  card: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 14, backgroundColor: Colors.surface, borderRadius: 14, padding: 12 },
  cardImage: { width: 80, height: 80, borderRadius: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  ratingText: { fontSize: 12, color: Colors.text, fontWeight: "600", flex: 1 },
  priceText: { fontSize: 12, color: Colors.primary, fontWeight: "700" },
  heartButton: { padding: 8 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: "600", color: Colors.text },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary },
});
