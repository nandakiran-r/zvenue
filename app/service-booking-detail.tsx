import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ChevronLeft, ChevronRight, Clock, Minus, Plus, X } from "lucide-react-native";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
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
import { fetchServiceListingById, fetchServiceBookedDates, createServiceOrder, verifyServicePayment } from "@/lib/serviceApi";
import type { DbServiceListing } from "@/lib/serviceTypes";

const SESSIONS = [
  { id: 'morning', label: 'Morning Session', time: '08:00 AM – 12:00 PM', start: '08:00 AM', end: '12:00 PM', hours: 4 },
  { id: 'afternoon', label: 'Afternoon Session', time: '01:00 PM – 05:00 PM', start: '01:00 PM', end: '05:00 PM', hours: 4 },
  { id: 'fullday', label: 'Full Day', time: '08:00 AM – 05:00 PM', start: '08:00 AM', end: '05:00 PM', hours: 9 },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ServiceBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { dbUser, isSubscribed, isSignedIn } = useAuth();
  const { error: showError, warning } = useToast();

  const [listing, setListing] = useState<DbServiceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookedDates, setBookedDates] = useState<{ booking_date: string; start_time: string; end_time: string }[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  // Session state
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Quantity
  const [quantity, setQuantity] = useState(1);

  // Payment
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadListing();
    loadBookedDates();
  }, [id]);

  useEffect(() => {
    if (!isSignedIn) {
      router.replace("/login" as any);
    }
  }, [isSignedIn]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const data = await fetchServiceListingById(id!);
      setListing(data);
    } catch (err) {
      console.error("Failed to load service:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookedDates = async () => {
    try {
      const data = await fetchServiceBookedDates(id!);
      setBookedDates(data.bookings);
      setBlockedDates(data.blocked_dates || []);
    } catch (err) {
      console.error("Failed to load booked dates:", err);
    }
  };

  // Calendar logic
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = formatDateKey(new Date());

    const days: { date: string; day: number; isCurrentMonth: boolean; isPast: boolean; isBooked: boolean; isToday: boolean; isBlocked?: boolean }[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push({ date: "", day: 0, isCurrentMonth: false, isPast: false, isBooked: false, isToday: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateKey = formatDateKey(dateObj);
      const isPast = dateKey < today;
      const isBooked = bookedDates.some(b => b.booking_date === dateKey);
      const isBlocked = blockedDates.includes(dateKey);
      const isToday = dateKey === today;
      days.push({ date: dateKey, day: d, isCurrentMonth: true, isPast: isPast || isBlocked, isBooked, isToday, isBlocked });
    }

    return days;
  }, [currentMonth, bookedDates, blockedDates]);

  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateSelect = (dateKey: string) => {
    setSelectedDate(dateKey);
    setSelectedSession(null);
  };

  // Check which sessions are booked for selected date
  const bookedSessionsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateBookings = bookedDates.filter(b => b.booking_date === selectedDate);
    const booked: string[] = [];

    for (const session of SESSIONS) {
      const isBooked = dateBookings.some(b => {
        if (b.start_time === '08:00 AM' && b.end_time === '05:00 PM') return true;
        if (session.id === 'fullday') return dateBookings.length > 0;
        return b.start_time === session.start && b.end_time === session.end;
      });
      if (isBooked) booked.push(session.id);
    }
    return booked;
  }, [selectedDate, bookedDates]);

  const isSessionBooked = (sessionId: string) => bookedSessionsForDate.includes(sessionId);

  const currentSession = SESSIONS.find(s => s.id === selectedSession);

  // Quantity handlers
  const incrementQty = () => {
    if (!listing) return;
    if (quantity >= listing.quantity_available) {
      warning("Maximum Reached", "Maximum available quantity reached.");
      return;
    }
    setQuantity(q => q + 1);
  };
  const decrementQty = () => setQuantity(q => Math.max(1, q - 1));

  // Pricing (quantity-based, not session-based)
  const unitPrice = listing?.price ?? 0;
  const subtotal = unitPrice * quantity;
  const discountPercent = isSubscribed && listing?.subscriber_discount_percent ? listing.subscriber_discount_percent : 0;
  const discount = Math.round(subtotal * discountPercent / 100);
  const total = subtotal - discount;

  const canBook = selectedDate && selectedSession && quantity >= 1;

  const formatPrice = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const handleConfirmAndPay = async () => {
    if (!canBook || !listing || submitting) return;

    setSubmitting(true);
    try {
      const orderResponse = await createServiceOrder({
        service_listing_id: listing.id,
        quantity,
        booking_date: selectedDate!,
        start_time: currentSession!.start,
        end_time: currentSession!.end,
      });
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
              prefill: { email: "${dbUser?.email || ''}", contact: "${dbUser?.phone_number || ''}", name: "${dbUser?.full_name || ''}" },
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
              bookingDate: selectedDate!,
              session: currentSession?.label || '',
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

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: Colors.textSecondary }}>Service not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack("/(tabs)/home")} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Service Card */}
        <View style={styles.serviceCard}>
          <Image source={{ uri: listing.images?.[0] ?? undefined }} style={styles.serviceImage} />
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle} numberOfLines={2}>{listing.name}</Text>
            <Text style={styles.serviceCity}>{listing.city}{listing.area ? `, ${listing.area}` : ''}</Text>
            <Text style={styles.servicePrice}>{formatPrice(unitPrice)}/unit</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.calNavBtn}>
              <ChevronLeft size={22} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.calMonthText}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.calNavBtn}>
              <ChevronRight size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.calDaysHeader}>
            {DAYS.map(day => (
              <Text key={day} style={styles.calDayLabel}>{day}</Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {calendarDays.map((item, idx) => {
              if (!item.isCurrentMonth) {
                return <View key={idx} style={styles.calCell} />;
              }
              const isSelected = item.date === selectedDate;
              const isDisabled = item.isPast;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.calCell,
                    item.isBooked && !isSelected && styles.calCellBooked,
                    item.isToday && !isSelected && styles.calCellToday,
                    isSelected && styles.calCellSelected,
                  ]}
                  onPress={() => !isDisabled && handleDateSelect(item.date)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.calCellText,
                    isSelected && styles.calCellTextSelected,
                    isDisabled && styles.calCellTextDisabled,
                    item.isBooked && !isSelected && styles.calCellTextBooked,
                  ]}>
                    {item.day}
                  </Text>
                  {item.isBooked && (
                    <View style={[styles.bookedDot, isSelected && { backgroundColor: Colors.white }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.calLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#FF9800" }]} />
              <Text style={styles.legendText}>Has bookings</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.border }]} />
              <Text style={styles.legendText}>Past</Text>
            </View>
          </View>
        </View>

        {/* Session Selection */}
        {selectedDate && (
          <View style={styles.sessionSection}>
            <Text style={styles.sectionTitle}>
              <Clock size={16} color={Colors.primary} /> Select Session
            </Text>
            <View style={{ gap: 10 }}>
              {SESSIONS.map(session => {
                const booked = isSessionBooked(session.id);
                const isActive = selectedSession === session.id;
                return (
                  <TouchableOpacity
                    key={session.id}
                    style={[styles.sessionCard, isActive && styles.sessionCardActive, booked && styles.sessionCardBooked]}
                    onPress={() => !booked && setSelectedSession(session.id)}
                    disabled={booked}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sessionLabel, isActive && styles.sessionLabelActive, booked && styles.sessionLabelBooked]}>
                        {session.label}
                      </Text>
                      <Text style={[styles.sessionTime, booked && styles.sessionLabelBooked]}>
                        {session.time}
                      </Text>
                    </View>
                    <Text style={[styles.sessionHours, isActive && styles.sessionLabelActive, booked && styles.sessionLabelBooked]}>
                      {booked ? 'Booked' : `${session.hours} hrs`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Quantity Selector */}
        {selectedDate && selectedSession && (
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={decrementQty}>
                <Minus size={18} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={incrementQty}>
                <Plus size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.availableText}>{listing.quantity_available} available</Text>
          </View>
        )}

        {/* Pricing Summary */}
        {selectedDate && selectedSession && (
          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Price Summary</Text>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>{formatPrice(unitPrice)} × {quantity}</Text>
              <Text style={styles.pricingValue}>{formatPrice(subtotal)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.pricingRow}>
                <Text style={[styles.pricingLabel, { color: "#2E7D32" }]}>Subscriber Discount (-{discountPercent}%)</Text>
                <Text style={[styles.pricingValue, { color: "#2E7D32" }]}>-{formatPrice(discount)}</Text>
              </View>
            )}
            <View style={styles.pricingDivider} />
            <View style={styles.pricingRow}>
              <Text style={styles.pricingTotal}>Total</Text>
              <Text style={styles.pricingTotalValue}>{formatPrice(total)}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.bottomTotal}>{formatPrice(total)}</Text>
          {discount > 0 && <Text style={styles.bottomDiscount}>You save {formatPrice(discount)}</Text>}
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, (!canBook || submitting) && styles.confirmButtonDisabled]}
          onPress={handleConfirmAndPay}
          activeOpacity={0.8}
          disabled={!canBook || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm & Pay</Text>
          )}
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  // Service card
  serviceCard: { flexDirection: "row", backgroundColor: Colors.white, borderRadius: 16, padding: 12, marginBottom: 20, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  serviceImage: { width: 70, height: 70, borderRadius: 12 },
  serviceInfo: { flex: 1, justifyContent: "center" },
  serviceTitle: { fontSize: 15, fontWeight: "600", color: Colors.text, marginBottom: 4 },
  serviceCity: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  servicePrice: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  // Calendar
  calendarCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1.5, borderColor: Colors.primary },
  calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  calNavBtn: { padding: 8 },
  calMonthText: { fontSize: 20, fontWeight: "700", color: Colors.text },
  calDaysHeader: { flexDirection: "row", marginBottom: 16 },
  calDayLabel: { flex: 1, textAlign: "center", fontSize: 14, fontWeight: "700", color: Colors.textSecondary },
  calGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 8, paddingHorizontal: 4 },
  calCell: { width: "14.28%", height: 40, alignItems: "center", justifyContent: "center", borderRadius: 8, marginVertical: 2 },
  calCellSelected: { backgroundColor: '#7a3317', width: "12%", marginHorizontal: "1.14%" },
  calCellBooked: { backgroundColor: "#FFF3E0", width: "12%", marginHorizontal: "1.14%", borderRadius: 8 },
  calCellToday: { backgroundColor: Colors.primaryLight, width: "12%", marginHorizontal: "1.14%" },
  calCellText: { fontSize: 16, fontWeight: "500", color: Colors.text },
  calCellTextSelected: { color: Colors.white, fontWeight: "700" },
  calCellTextDisabled: { color: "#CCCCCC" },
  calCellTextBooked: { color: "#F57C00" },
  bookedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#FF9800", marginTop: 2 },
  calLegend: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textSecondary },
  // Sessions
  sessionSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  sessionCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: Colors.border },
  sessionCardActive: { borderColor: Colors.primary, backgroundColor: "#FFF5F0" },
  sessionCardBooked: { backgroundColor: Colors.surface, borderColor: Colors.border, opacity: 0.6 },
  sessionLabel: { fontSize: 14, fontWeight: "600", color: Colors.text },
  sessionLabelActive: { color: Colors.primary },
  sessionLabelBooked: { color: Colors.textTertiary },
  sessionTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  sessionHours: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  // Quantity
  quantitySection: { marginBottom: 20 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  qtyBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, alignItems: "center", justifyContent: "center", backgroundColor: Colors.white },
  qtyValue: { fontSize: 20, fontWeight: "700", color: Colors.text, minWidth: 40, textAlign: "center" },
  availableText: { fontSize: 12, color: Colors.textSecondary, marginTop: 8 },
  // Pricing
  pricingCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  pricingTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  pricingRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  pricingLabel: { fontSize: 14, color: Colors.textSecondary },
  pricingValue: { fontSize: 14, fontWeight: "600", color: Colors.text },
  pricingDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  pricingTotal: { fontSize: 16, fontWeight: "700", color: Colors.text },
  pricingTotalValue: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  // Bottom bar
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bottomTotal: { fontSize: 20, fontWeight: "800", color: Colors.primary },
  bottomDiscount: { fontSize: 12, color: "#2E7D32", fontWeight: "600" },
  confirmButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 28 },
  confirmButtonDisabled: { opacity: 0.4 },
  confirmButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  // Payment modal
  paymentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
});
