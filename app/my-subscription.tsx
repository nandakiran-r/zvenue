import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ArrowRight, Check, ChevronLeft, Crown, Shield, XCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { cancelSubscription, createSubscription, getCheckoutOptions, confirmSubscription } from "@/lib/api";

const BENEFITS = [
  "Free parking & valet at partner venues",
  "Complimentary welcome drinks & refreshments",
  "10-15% off on catering & food packages",
  "Free decoration & stage setup",
  "Priority booking & dedicated coordinator",
  "Cancel anytime",
];

export default function MySubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { isSubscribed, subscriptionInfo, dbUser, refreshSubscriptionInfo } = useAuth();
  const { error: showError, success, showAlert } = useToast();

  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);

  useEffect(() => {
    refreshSubscriptionInfo();
  }, []);

  const status = subscriptionInfo?.subscription_status || dbUser?.subscription_status || 'none';
  const nextBillingAt = subscriptionInfo?.next_billing_at || dbUser?.next_billing_at;
  const isActive = status === 'active' || status === 'authenticated';
  const isCancelled = status === 'cancelled';

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const plan_id = "plan_Sph4tfi1RrzuEK";
      await createSubscription(plan_id, 1, 12);
      const { checkoutOptions } = await getCheckoutOptions();

      const html = `
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script></head>
        <body style="background:#fff;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;">
          <div style="text-align:center;"><h3 style="color:#333;">Loading payment...</h3></div>
          <script>
            var options = ${JSON.stringify(checkoutOptions)};
            options.handler = function(response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', data: response }));
            };
            options.modal = { ondismiss: function() { window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'cancel' })); } };
            var rzp = new Razorpay(options);
            rzp.on('payment.failed', function(response) { window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'failed', data: response.error })); });
            rzp.open();
          </script>
        </body></html>
      `;
      setCheckoutHtml(html);
      setCheckoutModalVisible(true);
    } catch (err: any) {
      showError("Error", err.response?.data?.error || err.message || "Failed to initiate subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'success') {
        setCheckoutModalVisible(false);
        setCheckoutHtml(null);
        try {
          await confirmSubscription();
          await refreshSubscriptionInfo();
          success("Subscribed!", "You now have access to ZVenue Pro benefits.");
        } catch {
          await refreshSubscriptionInfo();
        }
      } else if (data.event === 'cancel') {
        setCheckoutModalVisible(false);
        setCheckoutHtml(null);
      } else if (data.event === 'failed') {
        setCheckoutModalVisible(false);
        setCheckoutHtml(null);
        showError("Payment Failed", data.data?.description || "Please try again.");
      }
    } catch (err) {
      console.error(err);
    }
  };

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
                <Text style={styles.detailValue}>₹49/month</Text>
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
          {BENEFITS.map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <Check size={16} color={isActive ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.benefitText, !isActive && { color: Colors.textSecondary }]}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        {!isActive && (
          <TouchableOpacity
            style={[styles.upgradeButton, loading && { opacity: 0.6 }]}
            onPress={handleUpgrade}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Crown size={20} color={Colors.white} />
                <Text style={styles.upgradeButtonText}>Upgrade to Pro — ₹49/month</Text>
                <ArrowRight size={18} color={Colors.white} />
              </>
            )}
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

      {/* Payment WebView Modal */}
      <Modal visible={checkoutModalVisible} onRequestClose={() => { setCheckoutModalVisible(false); setCheckoutHtml(null); }}>
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setCheckoutModalVisible(false); setCheckoutHtml(null); }} style={{ padding: 8 }}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.text }}>Complete Payment</Text>
            <View style={{ width: 40 }} />
          </View>
          {checkoutHtml && (
            <WebView source={{ html: checkoutHtml }} style={{ flex: 1 }} onMessage={handleCheckoutMessage} />
          )}
        </View>
      </Modal>
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
  // Modal
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
});
