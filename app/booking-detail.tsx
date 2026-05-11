import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { Calendar, ChevronLeft, Clock, MapPin, Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
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
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { fetchVenueById, createBooking } from "@/lib/api";
import type { DbVenue } from "@/lib/types";

export default function BookingDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { dbUser } = useAuth();

    const [venue, setVenue] = useState<DbVenue | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");

    useEffect(() => {
        if (!id) return;
        loadVenue();
    }, [id]);

    const loadVenue = async () => {
        try {
            setLoading(true);
            const data = await fetchVenueById(id!);
            setVenue(data);
        } catch (err) {
            console.error("Failed to load venue:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !venue) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const hoursBooked = 4;
    const hourlyRate = venue.price_per_hour;
    const subtotal = hourlyRate * hoursBooked;
    const serviceFee = 500;
    const total = subtotal + serviceFee;

    const formatPrice = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

    const handleConfirm = async () => {
        if (!dbUser || submitting) return;
        try {
            setSubmitting(true);
            const booking = await createBooking({
                user_id: dbUser.id,
                venue_id: venue.id,
                booking_date: new Date().toISOString().split("T")[0],
                start_time: "10:00 AM",
                end_time: "02:00 PM",
                duration_hours: hoursBooked,
                guests: 200,
                subtotal,
                service_fee: serviceFee,
                total,
                payment_method: paymentMethod,
            });
            router.push({ pathname: "/booking-confirmed", params: { id: booking.id, venueId: venue.id } });
        } catch (err) {
            console.error("Failed to create booking:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack("/(tabs)/home")} style={styles.backButton}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.venueCard}>
                    <Image source={{ uri: venue.image_url ?? undefined }} style={styles.venueImage} />
                    <View style={styles.venueInfo}>
                        <Text style={styles.venueTitle} numberOfLines={2}>{venue.name}</Text>
                        <View style={styles.metaRow}>
                            <MapPin size={12} color={Colors.textSecondary} />
                            <Text style={styles.metaText}>{venue.city}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Users size={12} color={Colors.textSecondary} />
                            <Text style={styles.metaText}>Up to {venue.capacity} guests</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bookingInfoCard}>
                    <Text style={styles.sectionTitle}>Booking Info</Text>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Calendar size={16} color={Colors.primary} />
                            <Text style={styles.infoLabel}>Date</Text>
                            <Text style={styles.infoValue}>{new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</Text>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoItem}>
                            <Clock size={16} color={Colors.primary} />
                            <Text style={styles.infoLabel}>Duration</Text>
                            <Text style={styles.infoValue}>{hoursBooked} Hours</Text>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoItem}>
                            <Users size={16} color={Colors.primary} />
                            <Text style={styles.infoLabel}>Guests</Text>
                            <Text style={styles.infoValue}>200</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Booking Summary</Text>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{hoursBooked} hours × {formatPrice(hourlyRate)}</Text>
                    <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Service Fee</Text>
                    <Text style={styles.summaryValue}>{formatPrice(serviceFee)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatPrice(total)}</Text>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Payment Method</Text>

                <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === "card" && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod("card")}
                    activeOpacity={0.7}
                >
                    <View style={styles.paymentIconContainer}>
                        <View style={[styles.paymentDot, { backgroundColor: "#FF9900" }]} />
                        <View style={[styles.paymentDot, { backgroundColor: "#CC0000", marginLeft: -6 }]} />
                    </View>
                    <Text style={styles.paymentLabel}>Credit / Debit Card</Text>
                    <View style={[styles.radio, paymentMethod === "card" && styles.radioActive]}>
                        {paymentMethod === "card" && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === "paypal" && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod("paypal")}
                    activeOpacity={0.7}
                >
                    <View style={styles.paypalIcon}>
                        <Text style={styles.paypalText}>P</Text>
                    </View>
                    <Text style={styles.paymentLabel}>UPI / Paypal</Text>
                    <View style={[styles.radio, paymentMethod === "paypal" && styles.radioActive]}>
                        {paymentMethod === "paypal" && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                <View style={styles.priceColumn}>
                    <Text style={styles.priceLabelBottom}>Total Amount</Text>
                    <Text style={styles.priceAmount}>{formatPrice(total)}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.confirmButton, submitting && { opacity: 0.6 }]}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                    disabled={submitting}
                    testID="confirm-booking"
                >
                    <Text style={styles.confirmText}>{submitting ? "Booking..." : "Confirm Booking"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    venueCard: {
        flexDirection: "row",
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 12,
        gap: 12,
        marginBottom: 20,
    },
    venueImage: {
        width: 90,
        height: 90,
        borderRadius: 12,
    },
    venueInfo: {
        flex: 1,
        justifyContent: "center",
    },
    venueTitle: {
        fontSize: 15,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    metaText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    bookingInfoCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    infoItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    infoDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border,
    },
    infoLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: "700" as const,
        color: Colors.primary,
    },
    paymentOption: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        gap: 12,
    },
    paymentOptionActive: {
        borderColor: Colors.primary,
    },
    paymentIconContainer: {
        flexDirection: "row",
        width: 36,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    paymentDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        opacity: 0.9,
    },
    paymentLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500" as const,
        color: Colors.text,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Colors.inputBorder,
        alignItems: "center",
        justifyContent: "center",
    },
    radioActive: {
        borderColor: Colors.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
    },
    paypalIcon: {
        width: 36,
        height: 28,
        borderRadius: 6,
        backgroundColor: "#003087",
        alignItems: "center",
        justifyContent: "center",
    },
    paypalText: {
        fontSize: 16,
        fontWeight: "800" as const,
        color: Colors.white,
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    priceColumn: {},
    priceLabelBottom: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    priceAmount: {
        fontSize: 22,
        fontWeight: "800" as const,
        color: Colors.text,
    },
    confirmButton: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    confirmText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: "700" as const,
    },
});
