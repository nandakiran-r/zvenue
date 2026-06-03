import { router, useLocalSearchParams } from "expo-router";
import { Check, X, Shield, ArrowRight, Crown } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useAuth } from "@/context/AuthContext";
import { createSubscription, getCheckoutOptions, confirmSubscription, fetchSubscriptionBenefits } from "@/lib/api";
import Colors from "@/constants/colors";
import { useToast } from "@/context/ToastContext";

// Plan configuration — swap plan IDs when Razorpay plans are created
const PLANS = [
  { id: 'plan_SvGo8rbDqfx0q3', key: 'monthly',    label: 'Monthly',   price: '₹9',  period: '/month',     totalCount: 12, perMonth: '₹9/mo',   disclosure: 'Billed ₹9/month. Renews automatically. Cancel anytime.' },
  { id: 'plan_SvGp6d5YEO6Cch', key: 'halfyearly', label: '6 Months',  price: '₹29', period: '/6 months',  totalCount: 2,  perMonth: '~₹5/mo',  disclosure: 'Billed ₹29 every 6 months. Renews automatically. Cancel anytime.', badge: 'Popular' },
  { id: 'plan_SvGpYM5pa5FSJU', key: 'yearly',     label: 'Yearly',    price: '₹59', period: '/year',      totalCount: 1,  perMonth: '~₹5/mo',  disclosure: 'Billed ₹59/year. Renews automatically. Cancel anytime.', badge: 'Best Value' },
];

export default function SubscriptionScreen() {
  const { dbUser, refreshSubscriptionInfo, isSubscribed } = useAuth();
  const { returnTo, fromSignup } = useLocalSearchParams<{ returnTo?: string; fromSignup?: string }>();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[2]); // Default to yearly (best value)
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
  const [benefits, setBenefits] = useState<string[]>([]);
  const { error: showError, showAlert } = useToast();

  const isFromSignup = fromSignup === 'true';

  useEffect(() => {
    if (isSubscribed) {
      navigateBack();
    }
  }, [isSubscribed]);

  useEffect(() => {
    fetchSubscriptionBenefits().then(setBenefits).catch(() => {});
  }, []);

  const navigateBack = () => {
    if (returnTo) {
      router.replace(returnTo as any);
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await createSubscription(selectedPlan.id, 1, selectedPlan.totalCount);
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

  const handleCheckoutSuccess = async () => {
    setCheckoutModalVisible(false);
    setCheckoutHtml(null);
    try {
      await confirmSubscription();
      await refreshSubscriptionInfo();
      showAlert({
        type: "success",
        title: "Subscribed!",
        message: "You now have access to premium benefits with every booking.",
        actions: [{ text: "Let's Go!", style: "default", onPress: () => navigateBack() }],
      });
    } catch (err: any) {
      // The confirm endpoint now returns 402 when Razorpay hasn't settled yet,
      // and 502 if Razorpay was unreachable. In both cases the webhook will sync
      // the correct status shortly — so we still refresh and let the user proceed.
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;

      if (status === 402) {
        // Payment not yet confirmed on Razorpay's side — webhook will fix it soon
        await refreshSubscriptionInfo();
        showAlert({
          type: "info",
          title: "Payment Processing",
          message: serverMessage || "Your payment is being processed. Your subscription will activate shortly — you'll receive a notification once it's confirmed.",
          actions: [{ text: "OK", style: "default", onPress: () => navigateBack() }],
        });
      } else if (status === 502) {
        // Razorpay unreachable — webhook is still reliable
        await refreshSubscriptionInfo();
        showAlert({
          type: "info",
          title: "Verification Delayed",
          message: serverMessage || "We couldn't verify your payment right now, but your subscription will be activated automatically once confirmed. Check back in a minute.",
          actions: [{ text: "OK", style: "default", onPress: () => navigateBack() }],
        });
      } else {
        // Unexpected error — still refresh in case webhook already updated things
        await refreshSubscriptionInfo();
        navigateBack();
      }
    }
  };

  if (isSubscribed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Shield size={64} color={Colors.success} />
          <Text style={styles.successTitle}>You're Subscribed!</Text>
          <Text style={styles.successMessage}>Enjoy premium benefits with every venue booking.</Text>
          <TouchableOpacity style={styles.continueButton} onPress={() => navigateBack()}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={checkoutModalVisible} onRequestClose={() => { setCheckoutModalVisible(false); setCheckoutHtml(null); }}>
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setCheckoutModalVisible(false); setCheckoutHtml(null); }} style={{ padding: 8 }}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.text }}>Complete Payment</Text>
            <View style={{ width: 40 }} />
          </View>
          {checkoutHtml && (
            <WebView
              source={{ html: checkoutHtml }}
              style={{ flex: 1 }}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.event === 'success') handleCheckoutSuccess();
                  else if (data.event === 'cancel') { setCheckoutModalVisible(false); setCheckoutHtml(null); }
                  else if (data.event === 'failed') { setCheckoutModalVisible(false); setCheckoutHtml(null); showError("Payment Failed", data.data?.description || "Please try again."); }
                } catch (err) { console.error(err); }
              }}
            />
          )}
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => isFromSignup ? router.replace("/(tabs)/home") : router.back()}>
          <Text style={{ fontSize: 15, color: Colors.textSecondary }}>{isFromSignup ? "← Skip" : "← Back"}</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Crown size={40} color="#F9A825" />
          <Text style={styles.headerTitle}>ZVenue Pro</Text>
          <Text style={styles.headerSubtitle}>Get exclusive benefits with every venue & service booking</Text>
        </View>

        {/* Plan Selection */}
        <View style={styles.plansRow}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan.key === plan.key;
            return (
              <TouchableOpacity
                key={plan.key}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => setSelectedPlan(plan)}
                activeOpacity={0.7}
              >
                {plan.badge && (
                  <View style={[styles.planBadge, isSelected && styles.planBadgeSelected]}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                )}
                <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>{plan.label}</Text>
                <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>{plan.price}</Text>
                <Text style={[styles.planPeriod, isSelected && styles.planPeriodSelected]}>{plan.period}</Text>
                {plan.perMonth && plan.key !== 'monthly' && (
                  <Text style={[styles.planPerMonth, isSelected && styles.planPerMonthSelected]}>{plan.perMonth}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <View style={styles.featuresList}>
            {benefits.map((text, i) => (
              <FeatureItem key={i} text={text} />
            ))}
            {benefits.length === 0 && (
              <>
                <FeatureItem text="Free parking & valet at partner venues" />
                <FeatureItem text="Complimentary welcome drinks & refreshments" />
                <FeatureItem text="10-15% off on catering & food packages" />
                <FeatureItem text="Free decoration & stage setup" />
                <FeatureItem text="Priority booking & dedicated coordinator" />
                <FeatureItem text="Cancel renewal anytime" />
              </>
            )}
          </View>
        </View>

        {/* Subscribe Button */}
        <View style={styles.subscribeSection}>
          {/* Billing disclosure — shown above subscribe button */}
          <Text style={styles.billingDisclosure}>{selectedPlan.disclosure}</Text>

          <TouchableOpacity
            style={[styles.subscribeButton, loading && { opacity: 0.6 }]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={Colors.white} /> : (
              <>
                <Text style={styles.subscribeButtonText}>Subscribe — {selectedPlan.price}</Text>
                <ArrowRight size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.secureBadge}>🔒 Secure payment powered by Razorpay</Text>
        </View>

        {isFromSignup && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace("/(tabs)/home")}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <Check size={18} color={Colors.success} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 40 },
  backBtn: { paddingHorizontal: 24, paddingTop: 12 },
  header: { alignItems: "center", paddingTop: 24, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: Colors.text, marginTop: 12 },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: "center", paddingHorizontal: 40 },
  // Plan cards
  plansRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  planCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 14, alignItems: "center",
    borderWidth: 2, borderColor: Colors.border, position: "relative",
  },
  planCardSelected: { borderColor: Colors.primary, backgroundColor: '#FFF5F0' },
  planBadge: { position: "absolute", top: -10, backgroundColor: '#F9A825', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  planBadgeSelected: { backgroundColor: Colors.primary },
  planBadgeText: { fontSize: 9, fontWeight: "800", color: Colors.white, textTransform: "uppercase" },
  planLabel: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginTop: 8, marginBottom: 6 },
  planLabelSelected: { color: Colors.primary },
  planPrice: { fontSize: 24, fontWeight: "800", color: Colors.text },
  planPriceSelected: { color: Colors.primary },
  planPeriod: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  planPeriodSelected: { color: Colors.primary },
  planPerMonth: { fontSize: 10, color: Colors.textTertiary, marginTop: 4 },
  planPerMonthSelected: { color: Colors.primary },
  // Benefits
  benefitsCard: { marginHorizontal: 24, backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 20 },
  featuresList: { gap: 14 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureText: { fontSize: 14, color: Colors.text, flex: 1 },
  // Subscribe
  subscribeSection: { paddingHorizontal: 24 },
  billingDisclosure: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  subscribeButton: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  subscribeButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  secureBadge: { fontSize: 12, color: Colors.textSecondary, textAlign: "center", marginTop: 12 },
  skipButton: { alignItems: "center", paddingVertical: 16, marginTop: 4 },
  skipButtonText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
  // Success state
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  successTitle: { fontSize: 24, fontWeight: "700", color: Colors.text, marginTop: 16 },
  successMessage: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", marginTop: 8, marginBottom: 32 },
  continueButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32 },
  continueButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  // Modal
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
});
