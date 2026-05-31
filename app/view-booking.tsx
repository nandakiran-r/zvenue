import { useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { CheckCircle, ChevronLeft, Circle, Clock } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
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

    const loadBooking = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await fetchBookingById(id);
            setBooking(data);
        } catch (err) {
            console.error("Failed to load booking:", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadBooking();
    }, [loadBooking]);

    // Auto-refresh on screen focus to pick up admin-side status changes
    useFocusEffect(
        useCallback(() => {
            if (id) loadBooking();
        }, [id, loadBooking])
    );

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const venue = booking?.venue;
    const displayName = dbUser?.full_name ?? "User";
    const isPreBooked = booking?.status === "pre_booked";
    const isConfirmed = booking?.status === "confirmed";
    const bookingDisplayId = booking?.booking_id_display || `#${(booking?.id ?? "").slice(0, 8)}`;

    const formatPrice = (amount: number | null | undefined) => {
        if (amount == null || isNaN(amount)) return "₹0";
        return `₹${amount.toLocaleString("en-IN")}`;
    };

    // QR code data: shows the ZBID prominently when scanned
    const qrData = JSON.stringify({
        booking_id: bookingDisplayId,
        venue: venue?.name,
        date: booking?.booking_date,
        time: `${booking?.start_time} - ${booking?.end_time}`,
        guests: booking?.guests,
        customer: displayName,
        status: booking?.status,
    });

    const getSessionLabel = () => {
        if (booking?.start_time === '08:00 AM' && booking?.end_time === '12:00 PM') return 'Morning Session';
        if (booking?.start_time === '01:00 PM' && booking?.end_time === '05:00 PM') return 'Afternoon Session';
        if (booking?.start_time === '08:00 AM' && booking?.end_time === '05:00 PM') return 'Full Day';
        return `${booking?.start_time} - ${booking?.end_time}`;
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack("/(tabs)/home")} style={styles.backButton}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Booking</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Booking ID - Prominent */}
                <View style={styles.bookingIdCard}>
                    <Text style={styles.bookingIdLabel}>Booking ID</Text>
                    <Text style={styles.bookingIdValue}>{bookingDisplayId}</Text>
                    <Text style={styles.bookingIdHint}>Use this ID when contacting our agent</Text>
                </View>

                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    {isConfirmed && (
                        <View style={[styles.statusBadgeLarge, styles.statusConfirmedBg]}>
                            <CheckCircle size={20} color="#2E7D32" />
                            <Text style={styles.statusTextConfirmedLarge}>Booking Confirmed</Text>
                        </View>
                    )}
                    {isPreBooked && (
                        <View style={[styles.statusBadgeLarge, styles.statusPreBookedBg]}>
                            <Clock size={20} color="#F57C00" />
                            <Text style={styles.statusTextPreBooked}>Pre-Booked — Awaiting Full Payment</Text>
                        </View>
                    )}
                    {!isConfirmed && !isPreBooked && booking?.status && (
                        <View style={[styles.statusBadgeLarge, styles.statusPendingBg]}>
                            <Text style={styles.statusTextPending}>⏳ {booking.status}</Text>
                        </View>
                    )}
                </View>

                {/* Progress Indicator (Pre-Booked only) */}
                {isPreBooked && (
                    <View style={styles.progressCard}>
                        <Text style={styles.progressTitle}>Booking Progress</Text>
                        <ProgressStep label="Registration Fee Paid" status="completed" />
                        <ProgressStep label="Agent Contact" status="in_progress" />
                        <ProgressStep label="Booking Confirmed" status="pending" isLast />
                    </View>
                )}

                {/* Confirmed Booking Summary Card */}
                {isConfirmed && (
                    <View style={styles.confirmedCard}>
                        <Text style={styles.confirmedCardTitle}>Booking Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Venue</Text>
                            <Text style={styles.summaryValue}>{venue?.name || "—"}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Date</Text>
                            <Text style={styles.summaryValue}>{booking?.booking_date}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Session</Text>
                            <Text style={styles.summaryValue}>{getSessionLabel()}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Guests</Text>
                            <Text style={styles.summaryValue}>{booking?.guests} People</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Registration Fee Paid</Text>
                            <Text style={styles.summaryValueGreen}>{formatPrice(booking?.registration_fee_paid)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Remaining Balance Paid</Text>
                            <Text style={styles.summaryValueGreen}>{formatPrice(booking?.remaining_balance)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total Paid</Text>
                            <Text style={styles.totalValue}>{formatPrice(booking?.total)}</Text>
                        </View>
                    </View>
                )}

                {/* QR Code Section */}
                <View style={styles.bookingContainer}>
                    <View style={styles.bookingTop}>
                        <Text style={styles.scanTitle}>Booking QR Code</Text>
                        <Text style={styles.scanSubtitle}>Show this at the venue entrance</Text>

                        <View style={styles.qrContainer}>
                            <QRCode
                                value={qrData}
                                size={140}
                                color={Colors.text}
                                backgroundColor={Colors.white}
                            />
                        </View>
                        <Text style={styles.qrBookingId}>{bookingDisplayId}</Text>
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
                                <Text style={styles.detailValue}>{getSessionLabel()}</Text>
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
                                <Text style={styles.detailValue}>{bookingDisplayId}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Reschedule note */}
            {(isConfirmed || isPreBooked) && (
                <Text style={{ textAlign: "center", fontSize: 12, color: Colors.textSecondary, paddingHorizontal: 20, paddingBottom: 16, fontStyle: "italic" }}>
                    Need to reschedule? Contact support at +91 7249111100 (at least 3 days before booking date)
                </Text>
            )}
        </View>
    );
}

// Progress Step Component
function ProgressStep({ label, status, isLast }: { label: string; status: "completed" | "in_progress" | "pending"; isLast?: boolean }) {
    return (
        <View style={progressStyles.row}>
            <View style={progressStyles.iconCol}>
                {status === "completed" && <CheckCircle size={20} color="#4CAF50" />}
                {status === "in_progress" && <View style={progressStyles.pulseDot} />}
                {status === "pending" && <Circle size={20} color={Colors.border} />}
                {!isLast && <View style={[progressStyles.line, status === "completed" ? progressStyles.lineCompleted : null]} />}
            </View>
            <Text style={[progressStyles.label, status === "completed" && progressStyles.labelCompleted, status === "pending" && progressStyles.labelPending]}>
                {label}
            </Text>
        </View>
    );
}

const progressStyles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "flex-start", minHeight: 40 },
    iconCol: { width: 24, alignItems: "center" },
    line: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
    lineCompleted: { backgroundColor: "#4CAF50" },
    pulseDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#FF9800", borderWidth: 3, borderColor: "#FFF3E0" },
    label: { fontSize: 14, color: Colors.text, marginLeft: 12, paddingTop: 1, fontWeight: "500" },
    labelCompleted: { color: "#4CAF50" },
    labelPending: { color: Colors.textSecondary },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
    // Booking ID
    bookingIdCard: { marginHorizontal: 20, backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
    bookingIdLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
    bookingIdValue: { fontSize: 22, fontWeight: "800", color: Colors.primary, letterSpacing: 1 },
    bookingIdHint: { fontSize: 11, color: Colors.textSecondary, marginTop: 6 },
    // Status
    statusContainer: { paddingHorizontal: 20, marginBottom: 16 },
    statusBadgeLarge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
    statusConfirmedBg: { backgroundColor: "#E8F5E9" },
    statusPreBookedBg: { backgroundColor: "#FFF3E0" },
    statusPendingBg: { backgroundColor: "#F5F5F5" },
    statusTextConfirmedLarge: { fontSize: 15, fontWeight: "700", color: "#2E7D32" },
    statusTextPreBooked: { fontSize: 14, fontWeight: "600", color: "#F57C00" },
    statusTextPending: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
    // Progress
    progressCard: { marginHorizontal: 20, backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
    progressTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 16 },
    // Confirmed card
    confirmedCard: { marginHorizontal: 20, backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
    confirmedCardTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 14 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    summaryLabel: { fontSize: 13, color: Colors.textSecondary },
    summaryValue: { fontSize: 13, fontWeight: "600", color: Colors.text },
    summaryValueGreen: { fontSize: 13, fontWeight: "600", color: "#4CAF50" },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
    totalLabel: { fontSize: 15, fontWeight: "700", color: Colors.text },
    totalValue: { fontSize: 15, fontWeight: "700", color: Colors.primary },
    // QR / Booking card
    bookingContainer: { marginHorizontal: 20, backgroundColor: Colors.white, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4, overflow: "hidden" },
    bookingTop: { padding: 24, alignItems: "center" },
    scanTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 4 },
    scanSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
    qrContainer: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    qrBookingId: { fontSize: 14, fontWeight: "700", color: Colors.primary, marginTop: 12, letterSpacing: 0.5 },
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
