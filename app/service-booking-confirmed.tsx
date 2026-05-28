import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle, ArrowRight } from "lucide-react-native";
import React, { useEffect } from "react";
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function ServiceBookingConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    bookingDisplayId: string;
    serviceName: string;
    quantity: string;
    total: string;
    bookingDate: string;
    session: string;
  }>();

  // Prevent back to payment flow
  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/(tabs)/home");
      return true;
    });
    return () => handler.remove();
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

        <Text style={styles.title}>Booking Confirmed!</Text>

        {params.bookingDisplayId && (
          <View style={styles.bookingIdBadge}>
            <Text style={styles.bookingIdText}>{params.bookingDisplayId}</Text>
          </View>
        )}

        <Text style={styles.subtitle}>
          Your service has been booked successfully. No further action needed.
        </Text>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{params.serviceName || "Service"}</Text>
          </View>
          {params.bookingDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{new Date(params.bookingDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
          )}
          {params.session && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Session</Text>
              <Text style={styles.detailValue}>{params.session}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity</Text>
            <Text style={styles.detailValue}>{params.quantity || "1"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>{formatPrice(params.total)}</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => router.replace({ pathname: "/view-service-booking" as any, params: { id: params.id } })}
          activeOpacity={0.8}
        >
          <Text style={styles.viewButtonText}>View Booking</Text>
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
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#E8F5E9", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700", color: Colors.text, textAlign: "center", marginBottom: 8 },
  bookingIdBadge: { backgroundColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 12 },
  bookingIdText: { fontSize: 18, fontWeight: "800", color: Colors.primary, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 24, paddingHorizontal: 16 },
  detailsCard: { width: "100%", backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  detailLabel: { fontSize: 14, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: "600", color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: Colors.text },
  totalValue: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  viewButton: { width: "100%", backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  viewButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  homeButton: { width: "100%", backgroundColor: Colors.surface, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: Colors.border },
  homeButtonText: { color: Colors.text, fontSize: 15, fontWeight: "600" },
});
