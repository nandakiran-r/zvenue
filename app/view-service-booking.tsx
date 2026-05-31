import { useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { CheckCircle, ChevronLeft, Clock, XCircle } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import Colors from "@/constants/colors";
import { useToast } from "@/context/ToastContext";
import { fetchServiceBookingById } from "@/lib/serviceApi";
import { formatTime24to12 } from "@/lib/timeSlots";
import type { DbServiceBooking } from "@/lib/serviceTypes";

export default function ViewServiceBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { error: showError } = useToast();

  const [booking, setBooking] = useState<DbServiceBooking | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBooking = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchServiceBookingById(id);
      setBooking(data);
    } catch (err) {
      console.error("Failed to load service booking:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadBooking(); }, [loadBooking]);
  useFocusEffect(useCallback(() => { if (id) loadBooking(); }, [id, loadBooking]));

  const formatPrice = (amount: number | null | undefined) => {
    if (amount == null || isNaN(amount)) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  if (loading) {
    return <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (!booking) {
    return <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}><Text style={{ color: Colors.textSecondary }}>Booking not found</Text></View>;
  }

  const coverImage = booking.listing?.images?.[0] || null;
  const isConfirmed = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled' || booking.status === 'refunded';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack("/(tabs)/my-bookings")} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Booking ID */}
        <View style={styles.idCard}>
          <Text style={styles.idLabel}>Booking ID</Text>
          <Text style={styles.idValue}>{booking.booking_id_display || booking.id.slice(0, 8)}</Text>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          {isConfirmed && (
            <View style={[styles.statusBadgeLarge, { backgroundColor: '#E8F5E9' }]}>
              <CheckCircle size={20} color="#2E7D32" />
              <Text style={[styles.statusLargeText, { color: '#2E7D32' }]}>Confirmed</Text>
            </View>
          )}
          {isCancelled && (
            <View style={[styles.statusBadgeLarge, { backgroundColor: '#FFEBEE' }]}>
              <XCircle size={20} color="#D32F2F" />
              <Text style={[styles.statusLargeText, { color: '#D32F2F' }]}>
                {booking.status === 'refunded' ? 'Refunded' : 'Cancelled'}
              </Text>
            </View>
          )}
          {booking.status === 'pending' && (
            <View style={[styles.statusBadgeLarge, { backgroundColor: '#FFF3E0' }]}>
              <Clock size={20} color="#F57C00" />
              <Text style={[styles.statusLargeText, { color: '#F57C00' }]}>Pending</Text>
            </View>
          )}
        </View>

        {/* Service Info */}
        <View style={styles.card}>
          <View style={styles.serviceRow}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.serviceImage} />
            ) : (
              <View style={[styles.serviceImage, { backgroundColor: Colors.surface }]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{booking.listing?.name || 'Service'}</Text>
              <Text style={styles.serviceCity}>{booking.listing?.city || ''}</Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          {booking.booking_date && (
            <View style={styles.row}><Text style={styles.label}>Booking Date</Text><Text style={styles.value}>{new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text></View>
          )}
          {booking.start_time && booking.end_time && (
            <View style={styles.row}><Text style={styles.label}>Time</Text><Text style={styles.value}>{booking.start_time.includes('AM') || booking.start_time.includes('PM') ? `${booking.start_time} – ${booking.end_time}` : `${formatTime24to12(booking.start_time)} – ${formatTime24to12(booking.end_time)}`}</Text></View>
          )}
          <View style={styles.row}><Text style={styles.label}>Quantity</Text><Text style={styles.value}>{booking.quantity}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Unit Price</Text><Text style={styles.value}>{formatPrice(booking.unit_price)}</Text></View>
          {booking.discount_applied > 0 && (
            <View style={styles.row}><Text style={styles.label}>Discount</Text><Text style={[styles.value, { color: '#2E7D32' }]}>-{formatPrice(booking.discount_applied)}</Text></View>
          )}
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.totalLabel}>Total Paid</Text><Text style={styles.totalValue}>{formatPrice(booking.total_amount)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Payment Method</Text><Text style={styles.value}>{booking.payment_method || 'Razorpay'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Booked On</Text><Text style={styles.value}>{new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text></View>
        </View>

        {/* Contact Support for changes */}
        {isConfirmed && (
          <Text style={styles.rescheduleNote}>Need to reschedule? Contact support at +91 7249111100 (at least 3 days before booking date)</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  idCard: { marginHorizontal: 20, backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: "center" },
  idLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  idValue: { fontSize: 22, fontWeight: "800", color: Colors.primary, letterSpacing: 1 },
  statusContainer: { paddingHorizontal: 20, marginBottom: 16 },
  statusBadgeLarge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  statusLargeText: { fontSize: 15, fontWeight: "700" },
  card: { marginHorizontal: 20, backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 14 },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  serviceImage: { width: 60, height: 60, borderRadius: 12 },
  serviceName: { fontSize: 16, fontWeight: "600", color: Colors.text },
  serviceCity: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  label: { fontSize: 13, color: Colors.textSecondary },
  value: { fontSize: 13, fontWeight: "600", color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: "700", color: Colors.text },
  totalValue: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  rescheduleNote: { textAlign: "center", fontSize: 13, color: Colors.textSecondary, marginTop: 16, marginHorizontal: 20, fontStyle: "italic" },
});
