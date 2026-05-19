import { router } from "expo-router";
import { Check, X, Shield, Zap, Gift, Clock, ArrowRight } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useAuth } from "@/context/AuthContext";
import { getSubscriptionStatus, createSubscription, getCheckoutOptions, confirmSubscription } from "@/lib/api";
import Colors from "@/constants/colors";

export default function SubscriptionScreen() {
  const { dbUser, refreshSubscriptionInfo, hasAccess } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);

  useEffect(() => {
    // If user already has access, redirect to home
    if (hasAccess) {
      router.replace("/(tabs)/home");
    } else {
      loadStatus();
    }
  }, [hasAccess]);

  const loadStatus = async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscriptionInfo(status);
    } catch (err) {
      console.error("Failed to load subscription status:", err);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // First, create a subscription
      const plan_id = "plan_Sph4tfi1RrzuEK"; // Using the user's actual Razorpay plan ID
      await createSubscription(plan_id, 1, 12);

      // Then get checkout options
      const { checkoutOptions } = await getCheckoutOptions();
      
      // Generate Razorpay checkout HTML
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          </head>
          <body style="background-color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
            <div style="text-align: center; font-family: sans-serif;">
              <h3 style="color: #333;">Loading secure payment gateway...</h3>
              <p style="color: #666; font-size: 14px;">Please do not close this window.</p>
            </div>
            <script>
              var options = ${JSON.stringify(checkoutOptions)};
              options.handler = function (response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', data: response }));
              };
              options.modal = {
                ondismiss: function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'cancel' }));
                }
              };
              var rzp = new Razorpay(options);
              rzp.on('payment.failed', function (response){
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'failed', data: response.error }));
              });
              rzp.open();
            </script>
          </body>
        </html>
      `;
      
      setCheckoutHtml(html);
      setCheckoutModalVisible(true);
    } catch (err: any) {
      Alert.alert("Error", err.error?.description || err.message || "Failed to initiate subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutClose = () => {
    setCheckoutModalVisible(false);
    setCheckoutHtml(null);
  };

  const handleCheckoutSuccess = async () => {
    setCheckoutModalVisible(false);
    setCheckoutHtml(null);
    
    try {
      // Directly confirm subscription with backend (don't rely on webhook)
      await confirmSubscription();
      
      // Refresh subscription info
      await refreshSubscriptionInfo();
      
      Alert.alert(
        "Subscription Successful!",
        "Your subscription has been activated. Enjoy unlimited venue bookings!",
        [{ text: "Let's Go!", onPress: () => router.replace("/(tabs)/home") }]
      );
    } catch (err) {
      console.error("Failed to confirm subscription:", err);
      // Even if confirm fails, try refreshing - webhook might have processed
      await refreshSubscriptionInfo();
      
      const status = await getSubscriptionStatus();
      if (status?.has_access) {
        router.replace("/(tabs)/home");
      } else {
        Alert.alert(
          "Payment Received",
          "Your payment was successful. Please restart the app if access isn't granted immediately.",
          [{ text: "OK", onPress: () => router.replace("/(tabs)/home") }]
        );
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysRemaining = () => {
    if (!subscriptionInfo?.trial_ends_at) return 0;
    const end = new Date(subscriptionInfo.trial_ends_at);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();

  if (hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Shield size={64} color={Colors.success} />
          <Text style={styles.successTitle}>You Have Access!</Text>
          <Text style={styles.successMessage}>
            {subscriptionInfo?.is_trial_active
              ? `Your trial is active for ${daysRemaining} more days`
              : "Your subscription is active"}
          </Text>
          
          {subscriptionInfo?.next_billing_at && (
            <Text style={styles.billingInfo}>
              Next billing: {formatDate(subscriptionInfo.next_billing_at)}
            </Text>
          )}

          <TouchableOpacity style={styles.continueButton} onPress={() => router.replace("/(tabs)/home")}>
            <Text style={styles.continueButtonText}>Continue to App</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Checkout Modal */}
      <Modal
        visible={checkoutModalVisible}
        onRequestClose={handleCheckoutClose}
        supportedOrientations={['portrait']}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCheckoutClose} style={styles.closeButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Complete Payment</Text>
          </View>
          {checkoutHtml && (
            <WebView
              source={{ html: checkoutHtml }}
              style={styles.webview}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.event === 'success') {
                    handleCheckoutSuccess();
                  } else if (data.event === 'cancel') {
                    handleCheckoutClose();
                  } else if (data.event === 'failed') {
                    handleCheckoutClose();
                    Alert.alert("Payment Failed", data.data?.description || "Your payment could not be processed. Please try again.");
                  }
                } catch (err) {
                  console.error('Failed to parse WebView message:', err);
                }
              }}
              onNavigationStateChange={(navState: WebViewNavigation) => {
                // Check if the URL contains a success callback (fallback)
                if (navState.url.includes('success') || navState.url.includes('payment_successful')) {
                  handleCheckoutSuccess();
                } else if (navState.url.includes('cancel') || navState.url.includes('payment_failed')) {
                  handleCheckoutClose();
                }
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading payment page...</Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upgrade to Pro</Text>
          <Text style={styles.headerSubtitle}>Unlock unlimited venue bookings</Text>
        </View>

        {/* Trial Status */}
        {subscriptionInfo?.trial_ends_at && daysRemaining > 0 && (
          <View style={[styles.trialCard, styles.activeTrialCard]}>
            <Clock size={20} color={Colors.success} />
            <View style={styles.trialInfo}>
              <Text style={styles.trialLabel}>Trial Active</Text>
              <Text style={styles.trialDate}>Expires in {daysRemaining} days</Text>
            </View>
          </View>
        )}
        
        {subscriptionInfo?.trial_ends_at && daysRemaining <= 0 && !subscriptionInfo?.subscription_status && (
          <View style={[styles.trialCard, styles.expiredTrialCard]}>
            <Clock size={20} color={Colors.error} />
            <View style={styles.trialInfo}>
              <Text style={styles.trialLabel}>Trial Expired</Text>
              <Text style={styles.trialDate}>Expired on: {formatDate(subscriptionInfo.trial_ends_at)}</Text>
            </View>
          </View>
        )}

        {/* Pricing Card */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingHeader}>
            <Text style={styles.planName}>Venue Pro Monthly</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.price}>49</Text>
              <Text style={styles.perMonth}>/month</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Check size={20} color={Colors.success} />
              <Text style={styles.featureText}>Unlimited venue bookings</Text>
            </View>
            <View style={styles.featureItem}>
              <Check size={20} color={Colors.success} />
              <Text style={styles.featureText}>Priority customer support</Text>
            </View>
            <View style={styles.featureItem}>
              <Check size={20} color={Colors.success} />
              <Text style={styles.featureText}>No booking fees</Text>
            </View>
            <View style={styles.featureItem}>
              <Check size={20} color={Colors.success} />
              <Text style={styles.featureText}>Exclusive venue deals</Text>
            </View>
            <View style={styles.featureItem}>
              <Check size={20} color={Colors.success} />
              <Text style={styles.featureText}>Cancel anytime</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.subscribeButton, loading && styles.disabledButton]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                <ArrowRight size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* What You Get Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why choose Venue Pro?</Text>
          
          <View style={styles.infoItem}>
            <Gift size={24} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>7-Day Free Trial</Text>
              <Text style={styles.infoDescription}>
                Try all premium features free for 7 days. No charges during trial.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Zap size={24} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Instant Access</Text>
              <Text style={styles.infoDescription}>
                Get immediate access to all premium venues and features.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Shield size={24} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Secure Payment</Text>
              <Text style={styles.infoDescription}>
                Powered by Razorpay with 256-bit encryption.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.secureBadge}>
          🔒 Your payment information is secure
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  trialCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  trialInfo: {
    flex: 1,
  },
  trialLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 4,
  },
  trialDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pricingCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pricingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currency: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.text,
  },
  perMonth: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  featuresList: {
    gap: 16,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  termsText: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 16,
  },
  infoSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  infoItem: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  secureBadge: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 8,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  billingInfo: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // Trial card variants
  activeTrialCard: {
    backgroundColor: Colors.successLight,
  },
  expiredTrialCard: {
    backgroundColor: Colors.errorLight || '#FFE5E5',
  },
});
