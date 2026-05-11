import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { safeBack } from "@/constants/navigation";
import { api } from "@/lib/api";
import { ChevronLeft, Mail, User, Phone, Lock, CheckCircle2, XCircle } from "lucide-react-native";
import React, { useState } from "react";
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

export default function SignupScreen() {
  const params = useLocalSearchParams();
  const initialPhone = params.phone ? (params.phone as string).replace("+91", "") : "";

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>(initialPhone);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const { login } = useAuth();

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || phone.length < 10) {
      Alert.alert("Required", "Please fill in all mandatory fields with a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
      const response = await api.post("/api/auth/sign-up", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone_number: formattedPhone,
      });
      
      // Show custom success modal
      setShowSuccessModal(true);
    } catch (err: any) {
      const message = err.response?.data?.error || "Signup failed. Please try again.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
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
          <TouchableOpacity onPress={() => safeBack("/login")} style={styles.backButton}>
            <View style={styles.backButtonInner}>
              <ChevronLeft size={20} color={Colors.text} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <View style={styles.logoWrapper}>
              <Image
                source={require("../assets/images/favicon.png")}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.brandText}>ZVENUE</Text>
            <Text style={styles.title}>Join Zvenue</Text>
            <Text style={styles.subtitle}>Create your professional account</Text>
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.formSection}>
              
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <View style={styles.inputLabelContainer}>
                    <Text style={styles.inputLabel}>First Name *</Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <User size={16} color={Colors.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="John"
                      placeholderTextColor={Colors.textTertiary}
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <View style={styles.inputLabelContainer}>
                    <Text style={styles.inputLabel}>Last Name *</Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <User size={16} color={Colors.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor={Colors.textTertiary}
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputLabelContainer}>
                <Text style={styles.inputLabel}>Email Address *</Text>
              </View>
              <View style={styles.inputContainer}>
                <Mail size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputLabelContainer}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
              </View>
              <View style={styles.inputContainer}>
                <View style={styles.phoneIconWrapper}>
                  <Phone size={18} color={Colors.primary} />
                  <Text style={styles.countryCode}>+91</Text>
                  <View style={styles.separator} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit number"
                  placeholderTextColor={Colors.textTertiary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleSignup}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => safeBack("/login")}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <CheckCircle2 size={48} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitle}>Signup Successful!</Text>
            <Text style={styles.modalSubtitle}>
              Your account has been created. Please log in with your mobile number to start booking.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { width: '100%' }]}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace("/login");
              }}
            >
              <Text style={styles.primaryButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={!!errorMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorMsg(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
              <XCircle size={48} color="#F44336" />
            </View>
            <Text style={styles.modalTitle}>Signup Failed</Text>
            <Text style={styles.modalSubtitle}>{errorMsg}</Text>
            <TouchableOpacity
              style={[styles.primaryButton, { width: '100%', backgroundColor: '#F44336' }]}
              onPress={() => setErrorMsg(null)}
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
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
  },
  backButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  logoImage: { width: 44, height: 44 },
  brandText: { 
    fontSize: 14, 
    fontWeight: "800", 
    color: Colors.primary, 
    marginTop: 12, 
    letterSpacing: 4 
  },
  title: { 
    fontSize: 28, 
    fontWeight: "800", 
    color: Colors.text, 
    textAlign: "center", 
    marginTop: 8,
    marginBottom: 6 
  },
  subtitle: { 
    fontSize: 14, 
    color: Colors.textSecondary, 
    textAlign: "center",
    fontWeight: '500',
    paddingHorizontal: 20,
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
  row: {
    flexDirection: 'row',
  },
  formSection: {
    gap: 0,
  },
  inputLabelContainer: {
    marginBottom: 6,
    marginLeft: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1.5, 
    borderColor: '#F0F0F0', 
    borderRadius: 18, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    marginBottom: 16, 
    backgroundColor: '#FBFBFB', 
    gap: 10 
  },
  phoneIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  separator: {
    width: 1,
    height: 18,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 2,
  },
  countryCode: { fontSize: 15, fontWeight: "700", color: Colors.text },
  input: { 
    flex: 1, 
    fontSize: 15, 
    color: Colors.text,
    fontWeight: '500',
  },
  primaryButton: { 
    backgroundColor: Colors.primary, 
    borderRadius: 20, 
    paddingVertical: 18, 
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 24, marginBottom: 20 },
  bottomText: { fontSize: 15, color: Colors.textSecondary },
  linkText: { fontSize: 15, color: Colors.primary, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 32,
    padding: 32,
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
});
