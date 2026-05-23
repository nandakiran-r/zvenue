import { router } from "expo-router";
import { CalendarCheck, MapPin, Clock, ChevronRight } from "lucide-react-native";
import React, { useEffect, useState } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { fetchBookings } from "@/lib/api";
import type { DbBooking } from "@/lib/types";

function getSessionLabel(startTime: string | null, endTime: string | null) {
  if (startTime === '08:00 AM' && endTime === '12:00 PM') return 'Morning';
  if (startTime === '01:00 PM' && endTime === '05:00 PM') return 'Afternoon';
  if (startTime === '08:00 AM' && endTime === '05:00 PM') return 'Full Day';
  return startTime && endTime ? `${startTime} - ${endTime}` : '—';
}

function statusColor(status: string) {
  switch (status) {
    case 'confirmed': return { bg: '#E8F5E9', text: '#2E7D32' };
    case 'pending': return { bg: '#FFF3E0', text: '#F57C00' };
    case 'cancelled': return { bg: '#FFEBEE', text: '#D32F2F' };
    default: return { bg: '#F5F5F5', text: '#666' };
  }
}

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = async () => {
    if (!userId) return;
    try {
      const data = await fetchBookings(userId);
      setBookings(data);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadBookings(); }, [userId]);

  const onRefresh = () => { setRefreshing(true); loadBookings(); };

  const renderBooking = ({ item }: { item: DbBooking }) => {
    const colors = statusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => router.push({ pathname: "/view-booking", params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.venue?.image_url ?? undefined }} style={styles.venueImage} />
        <View style={styles.bookingInfo}>
          <Text style={styles.venueName} numberOfLines={1}>{item.venue?.name || 'Venue'}</Text>
          <View style={styles.metaRow}>
            <MapPin size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{item.venue?.city || '—'}</Text>
          </View>
          <View style={styles.metaRow}>
            <CalendarCheck size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{item.booking_date}</Text>
            <View style={styles.dot} />
            <Clock size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{getSessionLabel(item.start_time, item.end_time)}</Text>
          </View>
          <View style={styles.bottomRow}>
            <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
            </View>
            <Text style={styles.price}>₹{(item.total || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <ChevronRight size={18} color={Colors.textTertiary} style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CalendarCheck size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySubtitle}>Your venue bookings will appear here</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/(tabs)/home")}>
              <Text style={styles.browseBtnText}>Browse Venues</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: Colors.text },
  headerSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  bookingCard: {
    flexDirection: "row", backgroundColor: Colors.white, borderRadius: 16, padding: 12,
    marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, gap: 12,
  },
  venueImage: { width: 72, height: 72, borderRadius: 12 },
  bookingInfo: { flex: 1, justifyContent: "space-between" },
  venueName: { fontSize: 15, fontWeight: "600", color: Colors.text, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.textTertiary, marginHorizontal: 4 },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  price: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary },
  browseBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 12 },
  browseBtnText: { color: Colors.white, fontSize: 14, fontWeight: "600" },
});
