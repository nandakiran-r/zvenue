import { safeBack } from "@/constants/navigation";
import { ChevronLeft, Star } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { fetchServiceReviews } from "@/lib/serviceApi";
import type { DbServiceReview } from "@/lib/serviceTypes";

export default function ServiceReviewsScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const insets = useSafeAreaInsets();

  const [reviews, setReviews] = useState<DbServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadReviews = useCallback(async (pageNum = 1, append = false) => {
    if (!listingId) return;
    try {
      if (pageNum === 1) setLoading(true); else setLoadingMore(true);
      const data = await fetchServiceReviews(listingId, pageNum, 10);
      if (append) setReviews(prev => [...prev, ...data.reviews]);
      else setReviews(data.reviews);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [listingId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) loadReviews(page + 1, true);
  };

  const renderReview = ({ item }: { item: DbServiceReview }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{item.user?.full_name || "User"}</Text>
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map(s => <Star key={s} size={14} color={s <= item.rating ? "#FFB800" : Colors.border} fill={s <= item.rating ? "#FFB800" : "none"} />)}
        </View>
      </View>
      {item.comment && <Text style={styles.reviewComment}>{item.comment}</Text>}
      <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack(`/service-detail?id=${listingId}`)} style={styles.backBtn}><ChevronLeft size={24} color={Colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>All Reviews</Text>
        <Text style={styles.headerCount}>{total}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReview}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={Colors.primary} style={{ paddingVertical: 20 }} /> : null}
          ListEmptyComponent={<View style={styles.emptyState}><Star size={40} color={Colors.textTertiary} /><Text style={styles.emptyText}>No reviews yet</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: Colors.text, marginLeft: 8 },
  headerCount: { fontSize: 14, color: Colors.textSecondary, marginRight: 8 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 20, paddingBottom: 40 },
  reviewCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  reviewerName: { fontSize: 15, fontWeight: "600", color: Colors.text },
  starsRow: { flexDirection: "row", gap: 2 },
  reviewComment: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  reviewDate: { fontSize: 12, color: Colors.textTertiary },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
});
