import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Phone, UserPlus, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function LoginScreen() {
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const { isSignedIn } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) {
        router.replace("/(tabs)/home");
      }
    }, [isSignedIn])
  );

  const handlePhoneLogin = async () => {
    if (!phone.trim() || phone.length < 10) {
      Alert.alert("Required", "Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
      await api.post("/api/auth/send-otp", {
        phone_number: formattedPhone,
      });
      router.push({
        pathname: "/enter-otp",
        params: { phone: formattedPhone },
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setShowSignupPrompt(true);
      } else {
        const message = err.response?.data?.error || "Failed to send OTP.";
        Alert.alert("Login Error", message);
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignup = () => {
    setShowSignupPrompt(false);
    router.push({
      pathname: "/signup",
      params: { phone: phone }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            <View style={styles.logoWrapper}>
              <Image
                source={require("../assets/images/favicon.png")}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.brandText}>ZVENUE</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in with your mobile number to continue</Text>
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.formSection}>
              <View style={styles.inputLabelContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
              </View>
              <View style={styles.inputContainer}>
                <View style={styles.phoneIconWrapper}>
                  <Phone size={18} color={Colors.primary} />
                  <Text style={styles.countryCode}>+91</Text>
                  <View style={styles.separator} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={Colors.textTertiary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handlePhoneLogin}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>New to Zvenue? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={styles.linkText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Registration Prompt Modal */}
      <Modal
        visible={showSignupPrompt}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSignupPrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
              <TouchableOpacity 
                onPress={() => setShowSignupPrompt(false)}
                style={styles.closeButton}
              >
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.iconCircle}>
                <UserPlus size={32} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>User Not Found</Text>
              <Text style={styles.modalSubtitle}>
                The phone number <Text style={{fontWeight: '700', color: Colors.text}}>+91 {phone}</Text> is not registered with us yet.
              </Text>
              
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={navigateToSignup}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryButtonText}>Sign Up Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowSignupPrompt(false)}
                activeOpacity={0.6}
              >
                <Text style={styles.modalSecondaryButtonText}>Try Another Number</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FBFBFB' 
  },
  topSection: {
    position: 'absolute',
    top: -50,
    right: -50,
    left: -50,
    height: 300,
  },
  circle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#7a331710',
  },
  circle2: {
    position: 'absolute',
    top: 40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#7a331708',
  },
  flex: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: 28, 
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 40,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  logoImage: { width: 50, height: 50 },
  brandText: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: Colors.primary, 
    marginTop: 16, 
    letterSpacing: 4 
  },
  title: { 
    fontSize: 32, 
    fontWeight: "800", 
    color: Colors.text, 
    textAlign: "center", 
    marginTop: 12,
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 15, 
    color: Colors.textSecondary, 
    textAlign: "center",
    fontWeight: '500',
  },
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 10,
  },
  formSection: {
    gap: 0,
  },
  inputLabelContainer: {
    marginBottom: 8,
    marginLeft: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1.5, 
    borderColor: '#F0F0F0', 
    borderRadius: 18, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    marginBottom: 20, 
    backgroundColor: '#FBFBFB', 
    gap: 12 
  },
  phoneIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  countryCode: { fontSize: 16, fontWeight: "700", color: Colors.text },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: Colors.text,
    fontWeight: '500',
  },
  primaryButton: { 
    backgroundColor: Colors.primary, 
    borderRadius: 20, 
    paddingVertical: 20, 
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: Colors.white, fontSize: 17, fontWeight: "700" },
  bottomRow: { 
    flexDirection: "row", 
    justifyContent: "center", 
    marginTop: 32 
  },
  bottomText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
  linkText: { fontSize: 15, color: Colors.primary, fontWeight: "700" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    position: 'absolute',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  modalBody: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7a331710',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  modalPrimaryButton: {
    backgroundColor: Colors.primary,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalPrimaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalSecondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
