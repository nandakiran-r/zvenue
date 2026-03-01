import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { Calendar, ChevronLeft, MapPin } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { EVENTS } from "@/mocks/events";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const event = EVENTS.find((e) => e.id === id) ?? EVENTS[0];
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");

  const ticketPrice = 15.0;
  const quantity = 2;
  const subtotal = ticketPrice * quantity;
  const fees = 3.0;
  const total = subtotal + fees;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack("/(tabs)/home")} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Detail</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.eventCard}>
          <Image source={{ uri: event.image }} style={styles.eventImage} />
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
            <View style={styles.metaRow}>
              <Calendar size={12} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{event.date}</Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={12} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{event.location}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Order Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{quantity}x Ticket price</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fees</Text>
          <Text style={styles.summaryValue}>${fees.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>

        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === "card" && styles.paymentOptionActive]}
          onPress={() => setPaymentMethod("card")}
          activeOpacity={0.7}
        >
          <View style={styles.paymentIconContainer}>
            <View style={[styles.paymentDot, { backgroundColor: "#FF9900" }]} />
            <View style={[styles.paymentDot, { backgroundColor: "#CC0000", marginLeft: -6 }]} />
          </View>
          <Text style={styles.paymentLabel}>Credit/Debit Card</Text>
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
          <Text style={styles.paymentLabel}>Paypal</Text>
          <View style={[styles.radio, paymentMethod === "paypal" && styles.radioActive]}>
            {paymentMethod === "paypal" && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceAmount}>${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={() => router.push({ pathname: "/ticket-booked", params: { id: event.id } })}
          activeOpacity={0.8}
          testID="place-order"
        >
          <Text style={styles.placeOrderText}>Place Order</Text>
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
  eventCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    marginBottom: 24,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  eventInfo: {
    flex: 1,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
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
    color: Colors.text,
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
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  placeOrderButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  placeOrderText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700" as const,
  },
});
