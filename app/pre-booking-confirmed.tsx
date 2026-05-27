import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle, Calendar, Clock, CreditCard, ArrowRight } from "lucide-react-native";
import React, { useEffect } from "react";
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function PreBookingConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    venueId: string;
    venueName: string;
    bookingDate: string;
    session: string;
    registrationFeePaid: string;
    remainingBalance: string;
    total: string;
    bookingDisplayId: string;
  }>();

  // Prevent hardware back button from going back to payment flow
  // This screen is one-time only — back should go to home
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/(tabs)/home");
      return true; // prevent default back behavior
    });
    return () => backHandler.remove();
  }, []);

  const formatPrice = (amount: string | undefined) => {
    if (!amount) return "₹0";
    const num = parseFloat(amount);
    if (isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <CheckCircle size={64} color="#4CAF50" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Pre-Booking Successful!</Text>

        {/* Booking ID - Prominent */}
        {params.bookingDisplayId && (
          <View style={styles.bookingIdBadge}>
            <Text style={styles.bookingIdText}>{params.bookingDisplayId}</Text>
          </View>
        )}

        <Text style={styles.subtitle}>
          Your pre-booking is confirmed and our agent will contact you for further proceedings.
        </Text>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={16} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Venue</Text>
              <Text style={styles.detailValue}>{params.venueName || "Venue"}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={16} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{params.bookingDate || "—"}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Clock size={16} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Session</Text>
              <Text style={styles.detailValue}>{params.session || "—"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Payment Summary */}
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Registration Fee Paid</Text>
            <Text style={styles.paymentValueGreen}>{formatPrice(params.registrationFeePaid)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Remaining Balance (via Agent)</Text>
            <Text style={styles.paymentValue}>{formatPrice(params.remainingBalance)}</Text>
          </View>
          <View style={[styles.divider, { marginVertical: 8 }]} />
          <View style={styles.paymentRow}>
            <Text style={styles.totalLabel}>Total Venue Cost</Text>
            <Text style={styles.totalValue}>{formatPrice(params.total)}</Text>
          </View>
        </View>

        {/* Next Steps Card */}
        <View style={styles.stepsCard}>
          <Text style={styles.cardTitle}>What Happens Next?</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>Our agent will contact you within 24 hours</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>Complete the remaining payment as guided by the agent</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepText}>Share your transaction ID in the app</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
            <Text style={styles.stepText}>Receive full booking confirmation</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.viewBookingButton}
          onPress={() => router.replace({ pathname: "/view-booking", params: { id: params.id } })}
          activeOpacity={0.8}
        >
          <Text style={styles.viewBookingText}>View Booking</Text>
          <ArrowRight size={18} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/(tabs)/home")}
          activeOpacity={0.8}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 24, alignItems: "center" },
  iconContainer: { marginTop: 20, marginBottom: 20 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#E8F5E9", alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "700", color: Colors.text, textAlign: "center", marginBottom: 8 },
  bookingIdBadge: {
    backgroundColor: Colors.primaryLight || "#FFF0F5", borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10, marginBottom: 12, alignSelf: "center",
  },
  bookingIdText: { fontSize: 18, fontWeight: "800", color: Colors.primary, letterSpacing: 1 },
  subtitle: {
    fontSize: 14, color: Colors.textSecondary, textAlign: "center",
    lineHeight: 22, marginBottom: 24, paddingHorizontal: 16,
  },
  detailsCard: {
    width: "100%", backgroundColor: Colors.white, borderRadius: 16,
    padding: 20, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  detailIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: "#FFF0F5",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: "600", color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  paymentLabel: { fontSize: 13, color: Colors.textSecondary },
  paymentValue: { fontSize: 13, fontWeight: "600", color: Colors.text },
  paymentValueGreen: { fontSize: 13, fontWeight: "600", color: "#4CAF50" },
  totalLabel: { fontSize: 15, fontWeight: "700", color: Colors.text },
  totalValue: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  stepsCard: {
    width: "100%", backgroundColor: Colors.white, borderRadius: 16,
    padding: 20, marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  stepNumber: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  stepNumberText: { fontSize: 12, fontWeight: "700", color: Colors.white },
  stepText: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 18 },
  viewBookingButton: {
    width: "100%", backgroundColor: Colors.primary, borderRadius: 16,
    paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  viewBookingText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  homeButton: {
    width: "100%", backgroundColor: Colors.surface, borderRadius: 16,
    paddingVertical: 16, alignItems: "center", marginTop: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  homeButtonText: { color: Colors.text, fontSize: 15, fontWeight: "600" },
});
