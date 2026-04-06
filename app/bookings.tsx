import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { VENUES } from '@/mocks/venues';

const MOCK_BOOKINGS = [
  {
    id: 'b1',
    venueId: 'h1',
    date: '2026-05-15',
    time: '10:00 AM - 06:00 PM',
    status: 'Confirmed',
    guests: 200,
  },
  {
    id: 'b2',
    venueId: 's1',
    date: '2026-06-02',
    time: '02:00 PM - 05:00 PM',
    status: 'Pending',
    guests: 2,
  },
];

export default function BookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Join bookings with venue data
  const bookings = MOCK_BOOKINGS.map(booking => {
    const venue = VENUES.find(v => v.id === booking.venueId);
    return { ...booking, venue };
  });

  const getStatusColor = (status: string) => {
    if (status === 'Confirmed') return Colors.primary;
    if (status === 'Pending') return '#F59E0B'; // Amber
    return Colors.textSecondary;
  };

  const renderItem = ({ item }: { item: typeof bookings[0] }) => {
    if (!item.venue) return null;
    return (
      <View style={styles.bookingCard}>
        <Image source={{ uri: item.venue.image }} style={styles.venueImage} />
        
        <View style={styles.bookingDetails}>
          <View style={styles.headerRow}>
            <Text style={styles.venueName} numberOfLines={1}>{item.venue.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText} numberOfLines={1}>{item.venue.city}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Calendar size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{item.date}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{item.time}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.textTertiary} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySubtitle}>When you book a venue, it will appear here.</Text>
            <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/search')}>
              <Text style={styles.exploreButtonText}>Explore Venues</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
    flexGrow: 1,
  },
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  venueImage: {
    width: '100%',
    height: 140,
  },
  bookingDetails: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  venueName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
