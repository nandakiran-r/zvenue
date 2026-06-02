import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ChevronLeft, Star, Heart, MapPin } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { fetchServiceListings } from "@/lib/serviceApi";
import type { DbServiceListing } from "@/lib/serviceTypes";

export default function ServiceListingsScreen() {
  const { categoryId, categoryName, sortBy } = useLocalSearchParams<{ categoryId: string; categoryName: string; sortBy?: string }>();
  const insets = useSafeAreaInsets();

  const [listings, setListings] = useState<DbServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadListings = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      let data = await fetchServiceListings({ category_id: categoryId, page: pageNum, limit: 20 });
      
      // Apply sort from home screen filter
      if (sortBy && pageNum === 1 && !append) {
        if (sortBy === 'price_low') data.sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));
        else if (sortBy === 'price_high') data.sort((a: any, b: any) => (b.price ?? 0) - (a.price ?? 0));
        else if (sortBy === 'rating') data.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
      }

      if (append) {
        setListings(prev => [...prev, ...data]);
      } else {
        setListings(data);
      }
      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load service listings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId, sortBy]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const onRefresh = () => { setRefreshing(true); loadListings(1); };
  const onEndReached = () => { if (hasMore && !loading) loadListings(page + 1, true); };

  const formatPrice = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const renderItem = ({ item }: { item: DbServiceListing }) => {
    const coverImage = item.images?.[0] || null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: "/service-detail" as any, params: { id: item.id } })}
        activeOpacity={0.8}
      >
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ color: Colors.textTertiary }}>No Image</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.cardMeta}>
            <MapPin size={12} color={Colors.textSecondary} />
            <Text style={styles.cardCity}>{item.city}</Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.cardRating}>
              <Star size={12} color="#FFB800" fill="#FFB800" />
              <Text style={styles.cardRatingText}>{item.rating.toFixed(1)} ({item.review_count})</Text>
            </View>
            <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack("/(tabs)/home")} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName || "Services"}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && listings.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No services available</Text>
              <Text style={styles.emptySubtitle}>Check back later for new listings in this category</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  row: { justifyContent: "space-between", marginBottom: 12 },
  card: { width: "48%", borderRadius: 16, overflow: "hidden", backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  cardImage: { width: "100%", height: 120 },
  cardContent: { padding: 10 },
  cardName: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 4 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  cardCity: { fontSize: 12, color: Colors.textSecondary },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardRating: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardRatingText: { fontSize: 11, color: Colors.text, fontWeight: "600" },
  cardPrice: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  emptyState: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: Colors.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center" },
});
