import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ArrowRight, Check, ChevronLeft, Crown, Shield, XCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { cancelSubscription, fetchSubscriptionBenefits } from "@/lib/api";

export default function MySubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { isSubscribed, subscriptionInfo, dbUser, refreshSubscriptionInfo } = useAuth();
  const { error: showError, success, showAlert } = useToast();

  const [cancelling, setCancelling] = useState(false);
  const [benefits, setBenefits] = useState<string[]>([]);

  useEffect(() => {
    refreshSubscriptionInfo();
    fetchSubscriptionBenefits().then(setBenefits).catch(() => {});
  }, []);

  const status = subscriptionInfo?.subscription_status || dbUser?.subscription_status || 'none';
  const nextBillingAt = subscriptionInfo?.next_billing_at || dbUser?.next_billing_at;
  const isActive = status === 'active' || status === 'authenticated';
  const isCancelled = status === 'cancelled';

  const handleUnsubscribe = () => {
    showAlert({
      type: "confirm",
      title: "Unsubscribe from Pro?",
      message: "Your subscription will remain active until the end of the current billing period. No refund will be issued for the remaining period.",
      actions: [
        { text: "Keep Subscription", style: "cancel" },
        { text: "Unsubscribe", style: "destructive", onPress: confirmUnsubscribe },
      ],
    });
  };

  const confirmUnsubscribe = async () => {
    setCancelling(true);
    try {
      await cancelSubscription();
      await refreshSubscriptionInfo();
      success("Unsubscribed", "Your Pro access continues until the end of the billing period.");
    } catch (err: any) {
      showError("Error", err.response?.data?.error || "Failed to cancel subscription.");
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack("/(tabs)/profile")} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        {isActive ? (
          <View style={styles.statusCard}>
            <View style={styles.statusIconRow}>
              <Shield size={32} color={Colors.primary} />
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.statusTitle}>ZVenue Pro Active</Text>
            <Text style={styles.statusSubtitle}>You're enjoying premium benefits</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Plan</Text>
                <Text style={styles.detailValue}>Pro Plan</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#2E7D32' }]}>Active</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Next Billing</Text>
                <Text style={styles.detailValue}>{formatDate(nextBillingAt)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Member Since</Text>
                <Text style={styles.detailValue}>{formatDate(dbUser?.created_at)}</Text>
              </View>
            </View>
          </View>
        ) : isCancelled ? (
          <View style={styles.statusCard}>
            <View style={styles.statusIconRow}>
              <XCircle size={32} color="#F57C00" />
            </View>
            <Text style={styles.statusTitle}>Subscription Cancelled</Text>
            <Text style={styles.statusSubtitle}>
              {nextBillingAt
                ? `Your Pro access continues until ${formatDate(nextBillingAt)}`
                : "Your Pro access has ended"}
            </Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#F57C00' }]}>Cancelled</Text>
                </View>
              </View>
              {nextBillingAt && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Access Until</Text>
                  <Text style={styles.detailValue}>{formatDate(nextBillingAt)}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.statusCard}>
            <View style={styles.statusIconRow}>
              <Crown size={32} color="#F9A825" />
            </View>
            <Text style={styles.statusTitle}>Free Plan</Text>
            <Text style={styles.statusSubtitle}>Upgrade to Pro for exclusive benefits</Text>
          </View>
        )}

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>
            {isActive ? "Your Pro Benefits" : "Pro Benefits"}
          </Text>
          {benefits.map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <Check size={16} color={isActive ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.benefitText, !isActive && { color: Colors.textSecondary }]}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        {!isActive && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/subscription" as any)}
            activeOpacity={0.8}
          >
            <Crown size={20} color={Colors.white} />
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            <ArrowRight size={18} color={Colors.white} />
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity
            style={[styles.unsubscribeButton, cancelling && { opacity: 0.6 }]}
            onPress={handleUnsubscribe}
            disabled={cancelling}
            activeOpacity={0.7}
          >
            <Text style={styles.unsubscribeText}>
              {cancelling ? "Cancelling..." : "Unsubscribe"}
            </Text>
          </TouchableOpacity>
        )}

        {isActive && (
          <Text style={styles.noRefundNote}>
            Cancellation takes effect at the end of your billing period. No refund will be issued.
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* End of scroll */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  // Status card
  statusCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, marginBottom: 20, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  statusIconRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  proBadge: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  proBadgeText: { color: Colors.white, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  statusTitle: { fontSize: 22, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  statusSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", marginBottom: 16 },
  detailsGrid: { width: "100%", gap: 12, marginTop: 8 },
  detailItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailLabel: { fontSize: 14, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: "600", color: Colors.text },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  // Benefits
  benefitsCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 24 },
  benefitsTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 14 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  benefitText: { fontSize: 14, color: Colors.text, flex: 1 },
  // Buttons
  upgradeButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 },
  upgradeButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  unsubscribeButton: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginBottom: 8 },
  unsubscribeText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
  noRefundNote: { fontSize: 12, color: Colors.textTertiary, textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },
});
