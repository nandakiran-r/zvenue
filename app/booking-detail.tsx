import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { Calendar, ChevronLeft, ChevronRight, Clock, Crown, MapPin, Users, XCircle, X } from "lucide-react-native";
import React, { useEffect, useState, useMemo } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { fetchVenueById, fetchVenueBookedDates, createBookingOrder, verifyPayment } from "@/lib/api";
import type { DbVenue } from "@/lib/types";

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

export default function BookingDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { dbUser, isSubscribed } = useAuth();

    const [venue, setVenue] = useState<DbVenue | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [bookedDates, setBookedDates] = useState<{ booking_date: string; start_time: string; end_time: string }[]>([]);
    const [blockedDates, setBlockedDates] = useState<string[]>([]);

    // Session state
    const [selectedSession, setSelectedSession] = useState<string | null>(null);

    // Guests
    const [guests, setGuests] = useState("50");

    // Modals
    const [unavailableModal, setUnavailableModal] = useState(false);
    const [conflictDetails, setConflictDetails] = useState<any>(null);
    
    // Payment WebView modal
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
    const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

    // Subscribe prompt (shown to non-subscribers before booking)
    const [showSubscribePrompt, setShowSubscribePrompt] = useState(false);

    useEffect(() => {
        if (!id) return;
        loadVenue();
        loadBookedDates();
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

    const loadBookedDates = async () => {
        try {
            const data = await fetchVenueBookedDates(id!);
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

        // Empty slots for days before the 1st
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
            // A session is booked if any existing booking overlaps with it
            const isBooked = dateBookings.some(b => {
                // Full day blocks everything
                if (b.start_time === '08:00 AM' && b.end_time === '05:00 PM') return true;
                if (session.id === 'fullday') return dateBookings.length > 0;
                // Morning/afternoon check
                return b.start_time === session.start && b.end_time === session.end;
            });
            if (isBooked) booked.push(session.id);
        }
        return booked;
    }, [selectedDate, bookedDates]);

    const isSessionBooked = (sessionId: string) => bookedSessionsForDate.includes(sessionId);

    // Get selected session details
    const currentSession = SESSIONS.find(s => s.id === selectedSession);

    // Pricing calculation
    const hoursBooked = currentSession?.hours ?? 0;
    const hourlyRate = venue?.price_per_hour ?? 0;
    const subtotal = hourlyRate * hoursBooked;
    const serviceFee = hoursBooked > 0 ? 500 : 0;
    const total = subtotal + serviceFee;
    
    // Registration fee: what customer pays now (if set by admin)
    const registrationFee = (venue as any)?.registration_fee || 0;
    const payNow = registrationFee > 0 ? registrationFee : total;
    const balanceAtVenue = registrationFee > 0 ? total - registrationFee : 0;

    const formatPrice = (amount: number | null | undefined) => {
        if (amount == null || isNaN(amount)) return "₹0";
        return `₹${amount.toLocaleString("en-IN")}`;
    };

    const canBook = selectedDate && selectedSession && hoursBooked > 0 && parseInt(guests) > 0;

    const handleConfirm = async () => {
        if (!dbUser) {
            Alert.alert("Authentication Required", "Please log in to book a venue.", [
                { text: "Cancel", style: "cancel" },
                { text: "Log In", onPress: () => router.push("/login" as any) }
            ]);
            return;
        }

        if (!canBook || submitting) return;

        await proceedWithBooking();
    };

    const proceedWithBooking = async () => {
        setShowSubscribePrompt(false);
        
        try {
            setSubmitting(true);

            const orderData = {
                venue_id: venue!.id,
                booking_date: selectedDate!,
                start_time: currentSession!.start,
                end_time: currentSession!.end,
                guests: parseInt(guests),
                subtotal,
                service_fee: serviceFee,
                total,
            };

            const orderResponse = await createBookingOrder(orderData);
            const { order, booking } = orderResponse;

            setPendingBookingId(booking.id);

            // Generate Razorpay checkout HTML for WebView
            const html = `
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
                </head>
                <body style="background:#fff;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;">
                    <div style="text-align:center;">
                        <h3 style="color:#333;">Loading payment...</h3>
                        <p style="color:#666;font-size:14px;">Please do not close this window.</p>
                    </div>
                    <script>
                        var options = {
                            key: "${process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_test_SpDyznKPQ9nviQ'}",
                            amount: ${order.amount},
                            currency: "INR",
                            name: "Zvenue",
                            description: "Booking for ${venue!.name.replace(/"/g, '\\"')}",
                            order_id: "${order.id}",
                            prefill: {
                                email: "${dbUser.email || ''}",
                                contact: "${dbUser.phone_number || ''}",
                                name: "${dbUser.full_name || ''}"
                            },
                            theme: { color: "#7a3317" },
                            handler: function(response) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    event: 'success',
                                    data: {
                                        orderId: response.razorpay_order_id,
                                        paymentId: response.razorpay_payment_id,
                                        signature: response.razorpay_signature
                                    }
                                }));
                            },
                            modal: {
                                ondismiss: function() {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'cancel' }));
                                }
                            }
                        };
                        var rzp = new Razorpay(options);
                        rzp.on('payment.failed', function(response) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                event: 'failed',
                                data: response.error
                            }));
                        });
                        rzp.open();
                    </script>
                </body>
                </html>
            `;

            setPaymentHtml(html);
            setPaymentModalVisible(true);
            setSubmitting(false);
        } catch (err: any) {
            setSubmitting(false);
            const errorData = err.response?.data;
            if (errorData?.error === 'venue_unavailable') {
                setConflictDetails(errorData.conflict);
                setUnavailableModal(true);
            } else {
                Alert.alert("Booking Failed", errorData?.error || errorData?.message || "Failed to create booking.");
            }
        }
    };

    const handlePaymentMessage = async (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.event === 'success') {
                setPaymentModalVisible(false);
                setPaymentHtml(null);

                // Verify payment on server
                const response = await verifyPayment({
                    order_id: data.data.orderId,
                    payment_id: data.data.paymentId,
                    signature: data.data.signature,
                    booking_id: pendingBookingId!,
                });

                if (response.success) {
                    if (response.is_pre_booking) {
                        router.push({
                            pathname: "/pre-booking-confirmed",
                            params: {
                                id: response.booking.id,
                                venueId: response.booking.venue_id,
                                venueName: venue!.name,
                                bookingDate: selectedDate!,
                                session: currentSession?.label || '',
                                registrationFeePaid: String(response.registration_fee_paid || 0),
                                remainingBalance: String(response.remaining_balance || 0),
                                total: String(total),
                                bookingDisplayId: response.booking.booking_id_display || '',
                            }
                        });
                    } else {
                        router.push({
                            pathname: "/booking-confirmed",
                            params: { id: response.booking.id, venueId: response.booking.venue_id }
                        });
                    }
                } else {
                    Alert.alert("Verification Failed", "Payment received but verification failed. Contact support.");
                }
            } else if (data.event === 'cancel') {
                setPaymentModalVisible(false);
                setPaymentHtml(null);
                Alert.alert("Payment Cancelled", "You cancelled the payment. Your booking is still pending.");
            } else if (data.event === 'failed') {
                setPaymentModalVisible(false);
                setPaymentHtml(null);
                Alert.alert("Payment Failed", data.data?.description || "Payment could not be processed.");
            }
        } catch (err) {
            console.error("Failed to parse payment message:", err);
        }
    };

    const handlePaymentClose = () => {
        setPaymentModalVisible(false);
        setPaymentHtml(null);
    };

    if (loading || !venue) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack("/(tabs)/home")} style={styles.backButton}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Venue</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Venue Card */}
                <View style={styles.venueCard}>
                    <Image source={{ uri: venue.image_url ?? undefined }} style={styles.venueImage} />
                    <View style={styles.venueInfo}>
                        <Text style={styles.venueTitle} numberOfLines={2}>{venue.name}</Text>
                        <View style={styles.metaRow}>
                            <MapPin size={12} color={Colors.textSecondary} />
                            <Text style={styles.metaText}>{venue.city}</Text>
                        </View>
                        <Text style={styles.venuePrice}>{formatPrice(venue.price_per_hour)}/hr</Text>
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
                    <View style={styles.timeSection}>
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

                {/* Guests */}
                {selectedDate && selectedSession && (
                    <View style={styles.guestsSection}>
                        <Text style={styles.sectionTitle}>
                            <Users size={16} color={Colors.primary} /> Number of Guests
                        </Text>
                        <View style={styles.guestsRow}>
                            <TouchableOpacity style={styles.guestBtn} onPress={() => setGuests(String(Math.max(1, parseInt(guests) - 10)))}>
                                <Text style={styles.guestBtnText}>−</Text>
                            </TouchableOpacity>
                            <TextInput
                                style={styles.guestInput}
                                value={guests}
                                onChangeText={setGuests}
                                keyboardType="numeric"
                            />
                            <TouchableOpacity style={styles.guestBtn} onPress={() => setGuests(String(Math.min(venue.capacity, parseInt(guests) + 10)))}>
                                <Text style={styles.guestBtnText}>+</Text>
                            </TouchableOpacity>
                            <Text style={styles.capacityHint}>Max: {venue.capacity}</Text>
                        </View>
                    </View>
                )}

                {/* Booking Summary */}
                {canBook && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.sectionTitle}>Booking Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Date</Text>
                            <Text style={styles.summaryValue}>{selectedDate}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Session</Text>
                            <Text style={styles.summaryValue}>{currentSession?.label}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Time</Text>
                            <Text style={styles.summaryValue}>{currentSession?.time}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{hoursBooked} hrs × {formatPrice(hourlyRate)}</Text>
                            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Service Fee</Text>
                            <Text style={styles.summaryValue}>{formatPrice(serviceFee)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Venue Total</Text>
                            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
                        </View>

                        {registrationFee > 0 && (
                            <>
                                <View style={[styles.divider, { marginTop: 8 }]} />
                                <View style={[styles.summaryRow, { backgroundColor: '#E8F5E9', marginHorizontal: -16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, marginTop: 8 }]}>
                                    <Text style={[styles.totalLabel, { color: '#2E7D32' }]}>💳 Pay Now (Registration Fee)</Text>
                                    <Text style={[styles.totalValue, { color: '#2E7D32' }]}>{formatPrice(payNow)}</Text>
                                </View>
                                <View style={[styles.summaryRow, { marginTop: 8 }]}>
                                    <Text style={styles.summaryLabel}>🏛️ Balance Due (via Agent)</Text>
                                    <Text style={styles.summaryValue}>{formatPrice(balanceAtVenue)}</Text>
                                </View>
                            </>
                        )}
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                <View style={styles.priceColumn}>
                    <Text style={styles.priceLabelBottom}>{registrationFee > 0 ? 'Registration Fee' : 'Total'}</Text>
                    <Text style={styles.priceAmount}>{canBook ? formatPrice(payNow) : "—"}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.confirmButton, (!canBook || submitting) && { opacity: 0.5 }]}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                    disabled={!canBook || submitting}
                >
                    <Text style={styles.confirmText}>{submitting ? "Processing..." : registrationFee > 0 ? "Pre-Book & Pay" : "Confirm & Pay"}</Text>
                </TouchableOpacity>
            </View>

            {/* Subscribe Benefits Prompt */}
            <Modal visible={showSubscribePrompt} transparent animationType="fade" onRequestClose={() => setShowSubscribePrompt(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.iconCircle, { backgroundColor: '#FFF8E1' }]}>
                            <Crown size={48} color="#F9A825" />
                        </View>
                        <Text style={styles.modalTitle}>Unlock Premium Benefits!</Text>
                        <Text style={styles.modalSubtitle}>
                            Subscribe for ₹49/month to get exclusive benefits with every booking:
                        </Text>
                        {venue?.subscriber_benefits && venue.subscriber_benefits.length > 0 && (
                            <View style={{ width: '100%', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                                {(venue.subscriber_benefits as string[]).map((benefit, i) => (
                                    <Text key={i} style={{ fontSize: 13, color: Colors.text, marginBottom: 6 }}>✓ {benefit}</Text>
                                ))}
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.modalButton, { marginBottom: 10 }]}
                            onPress={() => { setShowSubscribePrompt(false); router.push("/subscription" as any); }}
                        >
                            <Text style={styles.modalButtonText}>Subscribe Now — ₹49/mo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]}
                            onPress={proceedWithBooking}
                        >
                            <Text style={[styles.modalButtonText, { color: Colors.text }]}>Skip & Continue Booking</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Payment WebView Modal */}
            <Modal visible={paymentModalVisible} animationType="slide" onRequestClose={handlePaymentClose}>
                <View style={{ flex: 1, backgroundColor: Colors.white }}>
                    <View style={styles.paymentModalHeader}>
                        <TouchableOpacity onPress={handlePaymentClose} style={{ padding: 8 }}>
                            <X size={24} color={Colors.text} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.text }}>Complete Payment</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    {paymentHtml && (
                        <WebView
                            source={{ html: paymentHtml }}
                            style={{ flex: 1 }}
                            onMessage={handlePaymentMessage}
                            javaScriptEnabled
                            domStorageEnabled
                            startInLoadingState
                            renderLoading={() => (
                                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.white }}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Loading payment gateway...</Text>
                                </View>
                            )}
                        />
                    )}
                </View>
            </Modal>

            {/* Venue Unavailable Modal */}
            <Modal visible={unavailableModal} transparent animationType="fade" onRequestClose={() => setUnavailableModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                            <Calendar size={48} color="#F57C00" />
                        </View>
                        <Text style={styles.modalTitle}>Venue Not Available</Text>
                        <Text style={styles.modalSubtitle}>
                            This venue is already booked on {conflictDetails?.date} from {conflictDetails?.start_time} to {conflictDetails?.end_time}.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => { setUnavailableModal(false); loadBookedDates(); }}
                        >
                            <Text style={styles.modalButtonText}>Choose Another Slot</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.white,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
    scrollContent: { padding: 20 },
    // Venue card
    venueCard: {
        flexDirection: "row", backgroundColor: Colors.white, borderRadius: 16,
        padding: 12, marginBottom: 20, shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    venueImage: { width: 80, height: 80, borderRadius: 12 },
    venueInfo: { flex: 1, marginLeft: 14, justifyContent: "center" },
    venueTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 4 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
    metaText: { fontSize: 12, color: Colors.textSecondary },
    venuePrice: { fontSize: 14, fontWeight: "700", color: Colors.primary },
    // Calendar
    calendarCard: {
        backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 20,
        borderWidth: 1.5, borderColor: Colors.primary,
    },
    calendarHeader: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20,
    },
    calNavBtn: { padding: 8 },
    calMonthText: { fontSize: 20, fontWeight: "700", color: Colors.text },
    calDaysHeader: { flexDirection: "row", marginBottom: 16 },
    calDayLabel: { flex: 1, textAlign: "center", fontSize: 14, fontWeight: "700", color: Colors.textSecondary },
    calGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 8, paddingHorizontal: 4 },
    calCell: {
        width: "14.28%", height: 40, alignItems: "center", justifyContent: "center", borderRadius: 8, marginVertical: 2,
    },
    calCellSelected: { backgroundColor: '#7a3317', width: "12%", marginHorizontal: "1.14%" },
    calCellToday: { backgroundColor: Colors.primaryLight, width: "12%", marginHorizontal: "1.14%" },
    calCellBooked: { backgroundColor: "#FFF3E0", width: "12%", marginHorizontal: "1.14%", borderRadius: 8 },
    calCellText: { fontSize: 16, fontWeight: "500", color: Colors.text },
    calCellTextSelected: { color: Colors.white, fontWeight: "700" },
    calCellTextDisabled: { color: "#CCCCCC" },
    calCellTextBooked: { color: "#F57C00" },
    bookedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#FF9800", marginTop: 2 },
    calLegend: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, color: Colors.textSecondary },
    // Time/Session
    timeSection: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },
    sessionCard: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
    },
    sessionCardActive: { borderColor: Colors.primary, backgroundColor: '#FFF0F0' },
    sessionCardBooked: { borderColor: '#FFCDD2', backgroundColor: '#FFEBEE', opacity: 0.7 },
    sessionLabel: { fontSize: 15, fontWeight: "600", color: Colors.text, marginBottom: 2 },
    sessionLabelActive: { color: Colors.primary },
    sessionLabelBooked: { color: '#EF5350', textDecorationLine: "line-through" },
    sessionTime: { fontSize: 12, color: Colors.textSecondary },
    sessionHours: { fontSize: 14, fontWeight: "700", color: Colors.text },
    // Guests
    guestsSection: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 20 },
    guestsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    guestBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surface,
        alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border,
    },
    guestBtnText: { fontSize: 20, fontWeight: "700", color: Colors.primary },
    guestInput: {
        width: 70, textAlign: "center", fontSize: 18, fontWeight: "700", color: Colors.text,
        borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 8,
    },
    capacityHint: { fontSize: 12, color: Colors.textSecondary, marginLeft: 8 },
    // Summary
    summaryCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 20 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    summaryLabel: { fontSize: 14, color: Colors.textSecondary },
    summaryValue: { fontSize: 14, fontWeight: "600", color: Colors.text },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
    totalLabel: { fontSize: 16, fontWeight: "700", color: Colors.text },
    totalValue: { fontSize: 16, fontWeight: "700", color: Colors.primary },
    // Bottom bar
    bottomBar: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.white,
        borderTopWidth: 1, borderTopColor: Colors.border,
    },
    priceColumn: {},
    priceLabelBottom: { fontSize: 12, color: Colors.textSecondary },
    priceAmount: { fontSize: 22, fontWeight: "800", color: Colors.text },
    confirmButton: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 28 },
    confirmText: { color: Colors.white, fontSize: 15, fontWeight: "700" },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
    modalContent: { backgroundColor: Colors.white, borderRadius: 24, padding: 28, alignItems: "center", width: "100%" },
    iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 8 },
    modalSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 20 },
    modalButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, width: "100%", alignItems: "center" },
    modalButtonText: { color: Colors.white, fontSize: 15, fontWeight: "700" },
    // Payment modal
    paymentModalHeader: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
});
