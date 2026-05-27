import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ChevronLeft, ChevronRight, Heart, MapPin, Minus, Plus, Star, ShoppingBag, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { fetchServiceListingById, fetchServiceReviews, addServiceFavorite, removeServiceFavorite, createServiceOrder, verifyServicePayment } from "@/lib/serviceApi";
import type { DbServiceListing, DbServiceReview } from "@/lib/serviceTypes";

const screenWidth = Dimensions.get("window").width;

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isSubscribed, isSignedIn, userId } = useAuth();
  const { showAlert, warning, error: showError } = useToast();

  const [listing, setListing] = useState<DbServiceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [reviews, setReviews] = useState<DbServiceReview[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSwipeRef = useRef<number>(0);

  useEffect(() => {
    if (id) loadData();
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [id]);

  useFocusEffect(useCallback(() => {
    if (id && !loading) refreshData();
  }, [id, loading]));

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchServiceListingById(id!);
      setListing(data);
      // Load reviews
      const reviewData = await fetchServiceReviews(id!, 1, 2);
      setReviews(reviewData.reviews);
      setTotalReviews(reviewData.pagination.total);
    } catch (err) {
      console.error("Failed to load service:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const data = await fetchServiceListingById(id!);
      if (data) setListing(data);
      const reviewData = await fetchServiceReviews(id!, 1, 2);
      setReviews(reviewData.reviews);
      setTotalReviews(reviewData.pagination.total);
    } catch {}
  };

  // Auto-scroll carousel
  useEffect(() => {
    const images = listing?.images || [];
    if (images.length <= 1) return;
    autoScrollRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastSwipeRef.current < 5000) return; // pause after manual swipe
      setActiveImageIndex(prev => {
        const next = (prev + 1) % images.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [listing]);

  const handleManualScroll = (e: any) => {
    lastSwipeRef.current = Date.now();
    setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth));
  };

  const incrementQty = () => {
    if (!listing) return;
    if (quantity >= listing.quantity_available) {
      warning("Maximum Reached", "Maximum available quantity reached.");
      return;
    }
    setQuantity(q => q + 1);
  };
  const decrementQty = () => setQuantity(q => Math.max(1, q - 1));

  const toggleFavorite = async () => {
    if (!id) return;
    try {
      if (isFav) { await removeServiceFavorite(id); setIsFav(false); }
      else { await addServiceFavorite(id); setIsFav(true); }
    } catch {}
  };

  const handleBuyNow = async () => {
    if (!isSignedIn) {
      showAlert({ type: "confirm", title: "Login Required", message: "Please log in to purchase this service.", actions: [{ text: "Cancel", style: "cancel" }, { text: "Log In", style: "default", onPress: () => router.push("/login" as any) }] });
      return;
    }
    if (!listing || submitting) return;

    setSubmitting(true);
    try {
      const orderResponse = await createServiceOrder({ service_listing_id: listing.id, quantity });
      const { order, booking } = orderResponse;
      setPendingBookingId(booking.id);

      const html = `
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script></head>
        <body style="background:#fff;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;">
          <div style="text-align:center;"><h3 style="color:#333;">Loading payment...</h3><p style="color:#666;font-size:14px;">Please do not close this window.</p></div>
          <script>
            var options = {
              key: "${process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_test_SpDyznKPQ9nviQ'}",
              amount: ${order.amount},
              currency: "INR",
              name: "Zvenue",
              description: "Service: ${listing.name.replace(/"/g, '\\"')}",
              order_id: "${order.id}",
              prefill: { email: "", contact: "", name: "" },
              theme: { color: "#7a3317" },
              handler: function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', data: { orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature } }));
              },
              modal: { ondismiss: function() { window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'cancel' })); } }
            };
            var rzp = new Razorpay(options);
            rzp.on('payment.failed', function(response) { window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'failed', data: response.error })); });
            rzp.open();
          </script>
        </body></html>
      `;
      setPaymentHtml(html);
      setPaymentModalVisible(true);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to create payment order. Please try again.";
      showError("Payment Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'success') {
        setPaymentModalVisible(false);
        setPaymentHtml(null);

        const response = await verifyServicePayment({
          order_id: data.data.orderId,
          payment_id: data.data.paymentId,
          signature: data.data.signature,
          booking_id: pendingBookingId!,
        });

        if (response.success) {
          router.replace({
            pathname: "/service-booking-confirmed" as any,
            params: {
              id: response.booking.id,
              bookingDisplayId: response.booking.booking_id_display || '',
              serviceName: listing!.name,
              quantity: String(quantity),
              total: String(response.booking.total_amount),
            },
          });
        } else {
          showError("Verification Failed", "Payment received but verification failed. Contact support.");
        }
      } else if (data.event === 'cancel') {
        setPaymentModalVisible(false);
        setPaymentHtml(null);
        showError("Payment Cancelled", "You cancelled the payment.");
      } else if (data.event === 'failed') {
        setPaymentModalVisible(false);
        setPaymentHtml(null);
        showError("Payment Failed", data.data?.description || "Payment could not be processed.");
      }
    } catch (err) {
      console.error("Payment message error:", err);
    }
  };

  const formatPrice = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  if (loading) {
    return <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }
  if (!listing) {
    return <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}><Text style={{ color: Colors.textSecondary }}>Service not found</Text></View>;
  }

  const images = listing.images?.length > 0 ? listing.images : [];
  const unitPrice = listing.price;
  const subtotal = unitPrice * quantity;
  const discount = isSubscribed && listing.subscriber_discount_percent > 0 ? Math.round(subtotal * listing.subscriber_discount_percent / 100) : 0;
  const total = subtotal - discount;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={images.slice(0, 5)}
              horizontal pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleManualScroll}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => <Image source={{ uri: item }} style={[styles.heroImage, { width: screenWidth }]} />}
              getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
            />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ color: Colors.textTertiary }}>No images</Text>
            </View>
          )}
          {images.length > 1 && (
            <View style={styles.imageDots}>
              {images.slice(0, 5).map((_, i) => <View key={i} style={[styles.imageDot, i === activeImageIndex && styles.imageDotActive]} />)}
            </View>
          )}
          <View style={[styles.imageOverlay, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.iconButton} onPress={() => safeBack("/(tabs)/home")}>
              <ChevronLeft size={22} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={toggleFavorite}>
              <Heart size={22} color={isFav ? Colors.primary : Colors.white} fill={isFav ? Colors.primary : "none"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Card */}
        <View style={styles.contentCard}>
          <Text style={styles.title}>{listing.name}</Text>
          <View style={styles.metaRow}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{listing.city}{listing.area ? `, ${listing.area}` : ''}</Text>
          </View>
          <View style={styles.metaRow}>
            <Star size={14} color="#FFB800" fill="#FFB800" />
            <Text style={styles.metaText}>{listing.rating.toFixed(1)} ({listing.review_count} reviews)</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(unitPrice)}</Text>
            <Text style={styles.priceLabel}>/unit</Text>
            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>{listing.quantity_available} available</Text>
            </View>
          </View>
        </View>

        {/* Quantity Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={decrementQty}><Minus size={18} color={Colors.text} /></TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={incrementQty}><Plus size={18} color={Colors.text} /></TouchableOpacity>
          </View>
        </View>

        {/* About */}
        {listing.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>
        )}

        {/* Video */}
        {listing.video_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📹 Video</Text>
            <TouchableOpacity style={styles.videoCard} onPress={() => Linking.openURL(listing.video_url!)}>
              <View style={styles.videoPlayIcon}><Text style={{ color: "#fff", fontSize: 20 }}>▶</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.text }}>Watch Video</Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Tap to open</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Subscriber Benefits */}
        {(listing.subscriber_benefits?.length > 0 || listing.subscriber_discount_percent > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎁 Subscriber Benefits</Text>
            <View style={styles.benefitsCard}>
              {listing.subscriber_discount_percent > 0 && (
                <Text style={styles.benefitHighlight}>Subscribers save {listing.subscriber_discount_percent}% on every purchase</Text>
              )}
              {(listing.subscriber_benefits as string[]).map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Text style={styles.benefitStar}>★</Text>
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
              {!isSubscribed && (
                <TouchableOpacity style={styles.subscribePrompt} onPress={() => router.push("/subscription" as any)}>
                  <Text style={styles.subscribePromptText}>Subscribe for ₹49/month →</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Owner */}
        {listing.owner_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Provider</Text>
            <View style={styles.ownerRow}>
              {listing.owner_image ? (
                <Image source={{ uri: listing.owner_image }} style={styles.ownerAvatar} />
              ) : (
                <View style={[styles.ownerAvatar, { backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" }]}>
                  <ShoppingBag size={20} color={Colors.textSecondary} />
                </View>
              )}
              <Text style={styles.ownerName}>{listing.owner_name}</Text>
            </View>
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {totalReviews > 0 && <Text style={styles.reviewCount}>({totalReviews})</Text>}
          </View>
          {reviews.length > 0 ? (
            <>
              {reviews.map(r => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewerName}>{r.user?.full_name || "User"}</Text>
                    <View style={styles.reviewStars}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={12} color={s <= r.rating ? "#FFB800" : Colors.border} fill={s <= r.rating ? "#FFB800" : "none"} />)}
                    </View>
                  </View>
                  {r.comment && <Text style={styles.reviewComment} numberOfLines={2}>{r.comment}</Text>}
                </View>
              ))}
              {totalReviews > 2 && (
                <TouchableOpacity style={styles.seeAllReviews} onPress={() => router.push({ pathname: "/service-reviews" as any, params: { listingId: id } })}>
                  <Text style={styles.seeAllReviewsText}>See All Reviews ({totalReviews})</Text>
                  <ChevronRight size={16} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.noReviews}>No reviews yet</Text>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.bottomPricing}>
          <Text style={styles.bottomTotal}>{formatPrice(total)}</Text>
          {discount > 0 && <Text style={styles.bottomOriginal}>{formatPrice(subtotal)}</Text>}
          {discount > 0 && <View style={styles.discountBadge}><Text style={styles.discountText}>-{listing.subscriber_discount_percent}%</Text></View>}
        </View>
        <TouchableOpacity style={[styles.buyButton, submitting && { opacity: 0.6 }]} onPress={handleBuyNow} activeOpacity={0.8} disabled={submitting}>
          {submitting ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.buyButtonText}>Buy Now</Text>}
        </TouchableOpacity>
      </View>

      {/* Payment WebView Modal */}
      <Modal visible={paymentModalVisible} onRequestClose={() => { setPaymentModalVisible(false); setPaymentHtml(null); }}>
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
          <View style={styles.paymentHeader}>
            <TouchableOpacity onPress={() => { setPaymentModalVisible(false); setPaymentHtml(null); }} style={{ padding: 8 }}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.text }}>Complete Payment</Text>
            <View style={{ width: 40 }} />
          </View>
          {paymentHtml && (
            <WebView source={{ html: paymentHtml }} style={{ flex: 1 }} onMessage={handlePaymentMessage} />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 100 },
  // Image carousel
  imageContainer: { height: 280, position: "relative" },
  heroImage: { width: "100%", height: 280 },
  imageDots: { position: "absolute", bottom: 40, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  imageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  imageDotActive: { backgroundColor: Colors.white, width: 20 },
  imageOverlay: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  // Content card
  contentCard: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 12, gap: 4 },
  price: { fontSize: 24, fontWeight: "800", color: Colors.primary },
  priceLabel: { fontSize: 14, color: Colors.textSecondary },
  stockBadge: { marginLeft: "auto", backgroundColor: "#E8F5E9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  stockText: { fontSize: 12, fontWeight: "600", color: "#2E7D32" },
  // Sections
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  // Quantity
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  qtyBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  qtyValue: { fontSize: 20, fontWeight: "700", color: Colors.text, minWidth: 40, textAlign: "center" },
  // Video
  videoCard: { backgroundColor: "#FFF0F5", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  videoPlayIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FF0000", alignItems: "center", justifyContent: "center" },
  // Benefits
  benefitsCard: { backgroundColor: "#FFF8E1", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#FFE082" },
  benefitHighlight: { fontSize: 14, fontWeight: "700", color: "#F57F17", marginBottom: 10 },
  benefitRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  benefitStar: { fontSize: 13, color: "#F57F17", marginRight: 8 },
  benefitText: { fontSize: 13, color: Colors.text, flex: 1 },
  subscribePrompt: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#FFE082" },
  subscribePromptText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  // Owner
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  ownerAvatar: { width: 44, height: 44, borderRadius: 22 },
  ownerName: { fontSize: 15, fontWeight: "600", color: Colors.text },
  // Reviews
  reviewsHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewCount: { fontSize: 14, color: Colors.textSecondary },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10 },
  reviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  reviewerName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewComment: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  seeAllReviews: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8 },
  seeAllReviewsText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  noReviews: { fontSize: 14, color: Colors.textTertiary, fontStyle: "italic" },
  // Bottom bar
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bottomPricing: { flexDirection: "row", alignItems: "center", gap: 6 },
  bottomTotal: { fontSize: 20, fontWeight: "800", color: Colors.primary },
  bottomOriginal: { fontSize: 14, color: Colors.textTertiary, textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: "#E8F5E9", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { fontSize: 11, fontWeight: "700", color: "#2E7D32" },
  buyButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32 },
  buyButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  // Payment modal
  paymentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
});
