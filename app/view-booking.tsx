import { useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ChevronLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { fetchBookingById } from "@/lib/api";
import type { DbBooking } from "@/lib/types";

export default function ViewBookingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { dbUser } = useAuth();

    const [booking, setBooking] = useState<DbBooking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        loadBooking();
    }, [id]);

    const loadBooking = async () => {
        try {
            setLoading(true);
            const data = await fetchBookingById(id!);
            setBooking(data);
        } catch (err) {
            console.error("Failed to load booking:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const venue = booking?.venue;
    const displayName = dbUser?.full_name ?? "User";

    // QR code data: JSON with booking details for venue staff to scan
    const qrData = JSON.stringify({
        booking_id: booking?.id,
        venue: venue?.name,
        date: booking?.booking_date,
        time: `${booking?.start_time} - ${booking?.end_time}`,
        guests: booking?.guests,
        customer: displayName,
        status: booking?.status,
    });

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack("/(tabs)/home")} style={styles.backButton}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Booking</Text>
                <View style={styles.backButton} />
            </View>

            <View style={styles.bookingContainer}>
                <View style={styles.bookingTop}>
                    <Text style={styles.scanTitle}>Booking QR Code</Text>
                    <Text style={styles.scanSubtitle}>Show this at the venue entrance</Text>

                    <View style={styles.qrContainer}>
                        <QRCode
                            value={qrData}
                            size={160}
                            color={Colors.text}
                            backgroundColor={Colors.white}
                        />
                    </View>

                    <View style={[styles.statusBadge, booking?.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending]}>
                        <Text style={[styles.statusText, booking?.status === 'confirmed' ? styles.statusTextConfirmed : styles.statusTextPending]}>
                            {booking?.status === "confirmed" ? "✓ Confirmed" : `⏳ ${booking?.status ?? "Pending"}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.bookingDivider}>
                    <View style={styles.dividerCircleLeft} />
                    <View style={styles.dashedLine}>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <View key={i} style={styles.dash} />
                        ))}
                    </View>
                    <View style={styles.dividerCircleRight} />
                </View>

                <View style={styles.bookingBottom}>
                    <Text style={styles.venueName}>{(venue?.name ?? "VENUE").toUpperCase().slice(0, 28)}</Text>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Booked By</Text>
                            <Text style={styles.detailValue}>{displayName}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Session</Text>
                            <Text style={styles.detailValue}>
                                {booking?.start_time === '08:00 AM' && booking?.end_time === '12:00 PM' ? 'Morning' :
                                 booking?.start_time === '01:00 PM' && booking?.end_time === '05:00 PM' ? 'Afternoon' :
                                 booking?.start_time === '08:00 AM' && booking?.end_time === '05:00 PM' ? 'Full Day' :
                                 `${booking?.start_time} - ${booking?.end_time}`}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Date</Text>
                            <Text style={styles.detailValue}>{booking?.booking_date ?? "N/A"}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Guests</Text>
                            <Text style={styles.detailValue}>{booking?.guests ?? 0} People</Text>
                        </View>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>City</Text>
                            <Text style={styles.detailValue}>{venue?.city ?? "N/A"}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Booking ID</Text>
                            <Text style={styles.detailValue}>#{(booking?.id ?? "").slice(0, 8)}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
    bookingContainer: { margin: 20, backgroundColor: Colors.white, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4, overflow: "hidden" },
    bookingTop: { padding: 24, alignItems: "center" },
    scanTitle: { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 4 },
    scanSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
    qrContainer: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, marginBottom: 16 },
    statusBadge: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
    statusConfirmed: { backgroundColor: "#E8F5E9" },
    statusPending: { backgroundColor: "#FFF3E0" },
    statusText: { fontSize: 14, fontWeight: "700" },
    statusTextConfirmed: { color: "#2E7D32" },
    statusTextPending: { color: "#F57C00" },
    bookingDivider: { flexDirection: "row", alignItems: "center" },
    dividerCircleLeft: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surface, marginLeft: -12 },
    dashedLine: { flex: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8 },
    dash: { width: 8, height: 1.5, backgroundColor: Colors.border, borderRadius: 1 },
    dividerCircleRight: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surface, marginRight: -12 },
    bookingBottom: { padding: 24 },
    venueName: { fontSize: 17, fontWeight: "700", color: Colors.text, textAlign: "center", marginBottom: 20 },
    detailsGrid: { flexDirection: "row", marginBottom: 16 },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
    detailValue: { fontSize: 15, fontWeight: "600", color: Colors.text },
});
