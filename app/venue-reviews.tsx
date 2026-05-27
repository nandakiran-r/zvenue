import { safeBack } from "@/constants/navigation";
import { ChevronLeft, MapPin, Star, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import ReviewCard from "@/components/ReviewCard";
import StarDisplay from "@/components/StarDisplay";
import { useReviewStore } from "@/store/reviewStore";
import type { DbReview } from "@/lib/types";
import { User } from "lucide-react-native";

const screenWidth = Dimensions.get("window").width;

export default function VenueReviewsScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const {
    venueReviews,
    venuePagination,
    loadingReviews,
    loadingMore,
    venueHeaderData,
    selectedReview,
    showReviewDetail,
    loadReviews,
    loadMoreReviews,
    loadVenueHeader,
    selectReview,
    dismissReviewDetail,
  } = useReviewStore();

  const reviews = venueReviews[venueId!] || [];
  const pagination = venuePagination[venueId!];
  const isLoading = loadingReviews[venueId!] ?? true;
  const isLoadingMore = loadingMore[venueId!] ?? false;
  const header = venueHeaderData[venueId!];

  useEffect(() => {
    if (venueId) {
      loadReviews(venueId);
      loadVenueHeader(venueId);
    }
  }, [venueId]);

  const handleLoadMore = useCallback(() => {
    if (venueId && !isLoadingMore) {
      loadMoreReviews(venueId);
    }
  }, [venueId, isLoadingMore]);

  const renderHeader = () => {
    if (!header) return null;
    const images = header.images;

    return (
      <View>
        {/* Photo Carousel */}
        {images.length > 0 && (
          <View style={styles.imageContainer}>
            <FlatList
              ref={flatListRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={[styles.heroImage, { width: screenWidth }]} />
              )}
              getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
            />
            {images.length > 1 && (
              <View style={styles.imageDots}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.imageDot, i === activeImageIndex && styles.imageDotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Venue Info */}
        <View style={styles.venueInfoCard}>
          <Text style={styles.venueName}>{header.name}</Text>
          {header.location && (
            <View style={styles.locationRow}>
              <MapPin size={14} color={Colors.textSecondary} />
              <Text style={styles.locationText}>{header.location}</Text>
            </View>
          )}
          <View style={styles.ratingRow}>
            <StarDisplay rating={header.rating} size={16} />
            <Text style={styles.ratingText}>{header.rating > 0 ? header.rating.toFixed(1) : "0.0"}</Text>
            <Text style={styles.reviewCountText}>({header.reviewCount} review{header.reviewCount !== 1 ? "s" : ""})</Text>
          </View>
        </View>

        {/* Section title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Reviews</Text>
          {pagination && <Text style={styles.sectionCount}>{pagination.total} total</Text>}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Star size={40} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>No reviews yet</Text>
        <Text style={styles.emptySubtext}>Be the first to review this venue!</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => safeBack(`/venue-detail?id=${venueId}`)} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && reviews.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.reviewItemWrapper}>
              <ReviewCard review={item} compact onPress={selectReview} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
        />
      )}

      {/* Review Detail Modal */}
      <Modal visible={showReviewDetail} transparent animationType="slide" onRequestClose={dismissReviewDetail}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Review</Text>
            <TouchableOpacity onPress={dismissReviewDetail} style={styles.modalCloseBtn}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
          {selectedReview && (
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Reviewer info */}
              <View style={styles.modalReviewerRow}>
                {selectedReview.user?.avatar_url ? (
                  <Image source={{ uri: selectedReview.user.avatar_url }} style={styles.modalAvatar} />
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <User size={24} color={Colors.textSecondary} />
                  </View>
                )}
                <View style={styles.modalReviewerInfo}>
                  <Text style={styles.modalReviewerName}>{selectedReview.user?.full_name || "Anonymous"}</Text>
                  <Text style={styles.modalDate}>
                    {new Date(selectedReview.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </Text>
                </View>
              </View>

              {/* Rating */}
              <View style={styles.modalRatingRow}>
                <StarDisplay rating={selectedReview.rating} size={22} />
                <Text style={styles.modalRatingValue}>{selectedReview.rating}/5</Text>
              </View>

              {/* Full comment */}
              {selectedReview.comment ? (
                <Text style={styles.modalComment}>{selectedReview.comment}</Text>
              ) : (
                <Text style={styles.modalNoComment}>No written review provided.</Text>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 40 },

  // Image carousel
  imageContainer: { height: 200, position: "relative" },
  heroImage: { height: 200 },
  imageDots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  imageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  imageDotActive: { backgroundColor: Colors.white, width: 20 },

  // Venue info
  venueInfoCard: { padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  venueName: { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 6 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  locationText: { fontSize: 13, color: Colors.textSecondary },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: { fontSize: 15, fontWeight: "700", color: Colors.text },
  reviewCountText: { fontSize: 13, color: Colors.textSecondary },

  // Section
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  sectionCount: { fontSize: 13, color: Colors.textSecondary },

  // Review items
  reviewItemWrapper: { paddingHorizontal: 16 },

  // Footer / empty
  footerLoader: { paddingVertical: 20, alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 12 },
  emptySubtext: { fontSize: 14, color: Colors.textTertiary, marginTop: 4 },

  // Detail modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  modalCloseBtn: { padding: 8 },
  modalContent: { padding: 24 },
  modalReviewerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  modalAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.surface },
  modalAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  modalReviewerInfo: { marginLeft: 14, flex: 1 },
  modalReviewerName: { fontSize: 17, fontWeight: "600", color: Colors.text },
  modalDate: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  modalRatingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  modalRatingValue: { fontSize: 16, fontWeight: "600", color: Colors.text },
  modalComment: { fontSize: 16, color: Colors.text, lineHeight: 24 },
  modalNoComment: { fontSize: 15, color: Colors.textTertiary, fontStyle: "italic" },
});
