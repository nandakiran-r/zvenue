import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { Calendar, ChevronLeft, Clock, MapPin, Users, XCircle } from "lucide-react-native";
import React, { useEffect, useState, useRef } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { fetchVenueById, createBookingOrder, verifyPayment } from "@/lib/api";
import type { DbVenue } from "@/lib/types";
import Razorpay from "react-native-razorpay";

export default function BookingDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { dbUser, hasAccess, subscriptionInfo } = useAuth();

    const [venue, setVenue] = useState<DbVenue | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "upi">("razorpay");
    
    // New states for selection
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
    const [startTime, setStartTime] = useState("10:00 AM");
    const [endTime, setEndTime] = useState("02:00 PM");
    const [guests, setGuests] = useState("200");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [unavailableModal, setUnavailableModal] = useState(false);
    const [conflictDetails, setConflictDetails] = useState<any>(null);

    useEffect(() => {
        if (!id) return;
        loadVenue();
    }, [id]);

    // Check subscription access
    useEffect(() => {
        if (dbUser && !hasAccess && !loading) {
            setErrorMsg("You need an active trial or subscription to book venues.");
        }
    }, [dbUser, hasAccess, loading]);

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
        console.log("=== Confirm Booking Clicked ===");
        console.log("dbUser:", dbUser);
        console.log("submitting:", submitting);
        
        if (!dbUser) {
            console.log("No dbUser - showing auth alert");
            Alert.alert(
                "Authentication Required",
                "Please log in to book a venue.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Log In", onPress: () => router.push("/login" as any) }
                ]
            );
            return;
        }
        
        if (!hasAccess) {
            console.log("No subscription access - showing alert");
            Alert.alert(
                "Subscription Required",
                "You need an active trial or subscription to book venues. Would you like to subscribe now?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Subscribe",
                        onPress: () => router.push("/subscription" as any)
                    }
                ]
            );
            return;
        }
        
        if (submitting) {
            console.log("Already submitting - ignoring");
            return;
        }
        
        try {
            console.log("Starting booking payment...");
            setSubmitting(true);
            setErrorMsg(null);
            
            // Step 1: Create Razorpay order
            const orderData = {
                venue_id: venue.id,
                booking_date: bookingDate,
                start_time: startTime,
                end_time: endTime,
                guests: parseInt(guests),
                subtotal,
                service_fee: serviceFee,
                total,
            };
            
            console.log("Creating order with data:", orderData);
            const orderResponse = await createBookingOrder(orderData);
            console.log("Order created:", orderResponse);
            
            const { order, booking } = orderResponse;
            
            // Step 2: Open Razorpay checkout
            const options = {
                description: `Booking for ${venue.name}`,
                image: "https://your-logo-url.com/logo.png",
                currency: "INR",
                key: process.env.RAZORPAY_KEY_ID || "rzp_test_SpDyznKPQ9nviQ",
                amount: order.amount,
                order_id: order.id,
                name: "Zvenue",
                prefill: {
                    email: dbUser.email || "",
                    contact: dbUser.phone_number || "",
                    name: dbUser.full_name || "",
                },
                theme: {
                    color: "#7a3317",
                },
                modal: {
                    // For iOS
                    confirm_close: true,
                    // For Android
                    back_button_close: true,
                    // Avoid closing on outside touch
                    escape_exit: false,
                },
            };
            
            try {
                const paymentData = await Razorpay.open(options);
                console.log("Payment successful:", paymentData);
                
                // Verify payment and confirm booking
                await verifyPaymentOnServer(paymentData, booking.id);
            } catch (error: any) {
                console.log("Payment failed or cancelled:", error);
                setSubmitting(false);
                if (error.code && error.code === 0) {
                    // User cancelled
                    setErrorMsg("Payment was cancelled. Please try again.");
                    Alert.alert("Payment Cancelled", "The payment was cancelled. Please try again.");
                } else {
                    setErrorMsg("Payment failed. Please try again.");
                    Alert.alert("Payment Failed", "The payment could not be completed. Please try again.");
                }
            }
            
        } catch (err: any) {
            console.error("Failed to create booking:", err);
            
            if (err.response) {
                console.error("Response status:", err.response.status);
                console.error("Response data:", err.response.data);
            }
            
            const errorData = err.response?.data;
            const errorMsg = errorData?.error || "Failed to create booking.";
            
            // Check for venue unavailability
            if (errorData?.error === 'venue_unavailable') {
                setConflictDetails(errorData.conflict);
                setUnavailableModal(true);
            } else if (errorData?.code === 'SUBSCRIPTION_REQUIRED') {
                Alert.alert(
                    "Subscription Required",
                    "You need an active trial or subscription to book venues. Would you like to subscribe now?",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Subscribe",
                            onPress: () => router.push("/subscription" as any)
                        }
                    ]
                );
            } else {
                setErrorMsg(errorMsg);
                Alert.alert("Booking Failed", errorMsg);
            }
            setSubmitting(false);
        }
    };
    
    const verifyPaymentOnServer = async (paymentData: any, bookingId: string) => {
        try {
            console.log("Verifying payment on server...");
            const verifyData = {
                order_id: paymentData.orderId,
                payment_id: paymentData.paymentId,
                signature: paymentData.signature,
                booking_id: bookingId,
            };
            
            const response = await verifyPayment(verifyData);
            console.log("Payment verified:", response);
            
            setSubmitting(false);
            
            if (response.success) {
                Alert.alert(
                    "Payment Successful!",
                    "Your booking has been confirmed.",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                router.push({
                                    pathname: "/booking-confirmed",
                                    params: {
                                        id: response.booking.id,
                                        venueId: response.booking.venue_id
                                    }
                                });
                            }
                        }
                    ]
                );
            } else {
                Alert.alert("Verification Failed", "Could not verify payment. Please contact support.");
            }
        } catch (err: any) {
            console.error("Payment verification error:", err);
            setSubmitting(false);
            Alert.alert("Error", "Failed to verify payment. Please contact support.");
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
                    
                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
                        <TextInput 
                          style={styles.textInput}
                          value={bookingDate}
                          onChangeText={setBookingDate}
                          placeholder="2024-05-20"
                        />
                    </View>

                    <View style={styles.timeRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Start Time</Text>
                            <TextInput 
                              style={styles.textInput}
                              value={startTime}
                              onChangeText={setStartTime}
                              placeholder="10:00 AM"
                            />
                        </View>
                        <View style={{ width: 16 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>End Time</Text>
                            <TextInput 
                              style={styles.textInput}
                              value={endTime}
                              onChangeText={setEndTime}
                              placeholder="02:00 PM"
                            />
                        </View>
                    </View>

                    <View style={[styles.inputRow, { marginTop: 12 }]}>
                        <Text style={styles.inputLabel}>Number of Guests</Text>
                        <TextInput 
                          style={styles.textInput}
                          value={guests}
                          onChangeText={setGuests}
                          keyboardType="numeric"
                          placeholder="200"
                        />
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
                    style={[styles.paymentOption, paymentMethod === "razorpay" && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod("razorpay")}
                    activeOpacity={0.7}
                >
                    <View style={styles.razorpayIcon}>
                        <Text style={styles.razorpayText}>R</Text>
                    </View>
                    <Text style={styles.paymentLabel}>Razorpay (Card/UPI/Netbanking)</Text>
                    <View style={[styles.radio, paymentMethod === "razorpay" && styles.radioActive]}>
                        {paymentMethod === "razorpay" && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.paymentOption, paymentMethod === "upi" && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod("upi")}
                    activeOpacity={0.7}
                >
                    <View style={styles.upiIcon}>
                        <Text style={styles.upiText}>U</Text>
                    </View>
                    <Text style={styles.paymentLabel}>UPI (GPay/PhonePe/Paytm)</Text>
                    <View style={[styles.radio, paymentMethod === "upi" && styles.radioActive]}>
                        {paymentMethod === "upi" && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>
            </ScrollView>
            
            {/* Subscription Warning Banner */}
            {dbUser && !hasAccess && (
                <View style={styles.warningBanner}>
                    <View style={styles.warningIconContainer}>
                        <XCircle size={24} color="#F57C00" />
                    </View>
                    <View style={styles.warningTextContainer}>
                        <Text style={styles.warningTitle}>Subscription Required</Text>
                        <Text style={styles.warningMessage}>
                            You need an active trial or subscription to book venues.
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.warningButton}
                        onPress={() => router.push("/subscription" as any)}
                    >
                        <Text style={styles.warningButtonText}>Subscribe</Text>
                    </TouchableOpacity>
                </View>
            )}

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

            {/* Error Modal */}
            <Modal
                visible={!!errorMsg}
                transparent
                animationType="fade"
                onRequestClose={() => setErrorMsg(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                            <XCircle size={48} color="#F44336" />
                        </View>
                        <Text style={styles.modalTitle}>Booking Error</Text>
                        <Text style={styles.modalSubtitle}>{errorMsg}</Text>
                        <TouchableOpacity
                            style={[styles.primaryButton, { width: '100%', backgroundColor: '#F44336' }]}
                            onPress={() => setErrorMsg(null)}
                        >
                            <Text style={styles.primaryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Venue Unavailable Modal */}
            <Modal
                visible={unavailableModal}
                transparent
                animationType="fade"
                onRequestClose={() => setUnavailableModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxWidth: 400 }]}>
                        <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                            <Calendar size={48} color="#F57C00" />
                        </View>
                        <Text style={styles.modalTitle}>Venue Not Available</Text>
                        <Text style={styles.modalSubtitle}>
                            This venue is already booked on {conflictDetails?.date} from {conflictDetails?.start_time} to {conflictDetails?.end_time}.
                            Please choose a different date or time.
                        </Text>
                        <View style={styles.suggestionContainer}>
                            <Text style={styles.suggestionTitle}>Suggestions:</Text>
                            <Text style={styles.suggestionText}>• Check the venue's available dates</Text>
                            <Text style={styles.suggestionText}>• Try a different time slot</Text>
                            <Text style={styles.suggestionText}>• Contact the venue owner directly</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.primaryButton, { width: '100%', backgroundColor: Colors.primary }]}
                            onPress={() => setUnavailableModal(false)}
                        >
                            <Text style={styles.primaryButtonText}>Understood</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    scrollContent: {
        padding: 20,
    },
    venueCard: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 12,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    venueImage: {
        width: 100,
        height: 100,
        borderRadius: 16,
    },
    venueInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: "center",
    },
    venueTitle: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 8,
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
    razorpayIcon: {
        width: 36,
        height: 28,
        borderRadius: 6,
        backgroundColor: "#0046B5",
        alignItems: "center",
        justifyContent: "center",
    },
    razorpayText: {
        fontSize: 16,
        fontWeight: "800" as const,
        color: Colors.white,
    },
    upiIcon: {
        width: 36,
        height: 28,
        borderRadius: 6,
        backgroundColor: "#5F2B8A",
        alignItems: "center",
        justifyContent: "center",
    },
    upiText: {
        fontSize: 16,
        fontWeight: "800" as const,
        color: Colors.white,
    },
    suggestionContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        width: '100%',
    },
    suggestionTitle: {
        fontSize: 14,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 8,
    },
    suggestionText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 4,
        lineHeight: 18,
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
    inputRow: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
        marginLeft: 4,
    },
    textInput: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    timeRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 8,
        textAlign: "center",
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 20,
    },
    primaryButton: {
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: "700" as const,
    },
    // Subscription warning banner styles
    warningBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF3E0",
        padding: 12,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 12,
        gap: 12,
    },
    warningIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFE0B2",
        alignItems: "center",
        justifyContent: "center",
    },
    warningTextContainer: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: "700" as const,
        color: "#E65100",
        marginBottom: 2,
    },
    warningMessage: {
        fontSize: 12,
        color: "#F57C00",
        lineHeight: 16,
    },
    warningButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    warningButtonText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: "700" as const,
    },
});
