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
import { createSubscription, getCheckoutOptions, confirmSubscription } from "@/lib/api";
import Colors from "@/constants/colors";
import { useToast } from "@/context/ToastContext";

export default function SubscriptionScreen() {
  const { dbUser, refreshSubscriptionInfo, isSubscribed } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [loading, setLoading] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
  const { error: showError, showAlert } = useToast();

  useEffect(() => {
    if (isSubscribed) {
      navigateBack();
    }
  }, [isSubscribed]);

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
    } catch (err) {
      await refreshSubscriptionInfo();
      navigateBack();
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 15, color: Colors.textSecondary }}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Crown size={40} color="#F9A825" />
          <Text style={styles.headerTitle}>ZVenue Pro</Text>
          <Text style={styles.headerSubtitle}>Get exclusive benefits with every venue booking</Text>
        </View>

        <View style={styles.pricingCard}>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.price}>49</Text>
            <Text style={styles.perMonth}>/month</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.featuresList}>
            <FeatureItem text="Free parking & valet at partner venues" />
            <FeatureItem text="Complimentary welcome drinks & refreshments" />
            <FeatureItem text="10-15% off on catering & food packages" />
            <FeatureItem text="Free decoration & stage setup" />
            <FeatureItem text="Priority booking & dedicated coordinator" />
            <FeatureItem text="Cancel anytime" />
          </View>

          <TouchableOpacity
            style={[styles.subscribeButton, loading && { opacity: 0.6 }]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={Colors.white} /> : (
              <>
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                <ArrowRight size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.secureBadge}>🔒 Secure payment powered by Razorpay</Text>
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
  scrollContent: { paddingBottom: 32 },
  backBtn: { paddingHorizontal: 24, paddingTop: 12 },
  header: { alignItems: "center", paddingTop: 24, paddingBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: Colors.text, marginTop: 12 },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: "center", paddingHorizontal: 40 },
  pricingCard: {
    backgroundColor: Colors.white, marginHorizontal: 24, borderRadius: 20, padding: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  priceContainer: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", marginBottom: 16 },
  currency: { fontSize: 22, fontWeight: "600", color: Colors.text },
  price: { fontSize: 48, fontWeight: "800", color: Colors.text },
  perMonth: { fontSize: 16, color: Colors.textSecondary, marginLeft: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 20 },
  featuresList: { gap: 14, marginBottom: 24 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureText: { fontSize: 14, color: Colors.text, flex: 1 },
  subscribeButton: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  subscribeButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  secureBadge: { fontSize: 12, color: Colors.textSecondary, textAlign: "center", marginTop: 20 },
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
