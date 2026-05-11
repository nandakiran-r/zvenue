import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Eye, EyeOff, Lock, Mail, Phone } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("phone");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const { isSignedIn, login } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) {
        router.replace("/(tabs)/home");
      }
    }, [isSignedIn])
  );

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Required", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/sign-in", {
        email: email.trim(),
        password,
      });
      await login(response.data.token, response.data.user);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      const message = err.response?.data?.error || "Login failed. Please check your credentials.";
      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

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
      const message = err.response?.data?.error || "Failed to send OTP.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/favicon.png")}
              style={styles.logoImage}
            />
            <Text style={styles.brandText}>ZVENUE</Text>
          </View>

          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Login to access your account</Text>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, loginMethod === "phone" && styles.toggleBtnActive]}
              onPress={() => setLoginMethod("phone")}
            >
              <Text style={[styles.toggleText, loginMethod === "phone" && styles.toggleTextActive]}>Mobile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, loginMethod === "email" && styles.toggleBtnActive]}
              onPress={() => setLoginMethod("email")}
            >
              <Text style={[styles.toggleText, loginMethod === "email" && styles.toggleTextActive]}>Email</Text>
            </TouchableOpacity>
          </View>

          {loginMethod === "phone" ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Mobile Number"
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
                  <Text style={styles.primaryButtonText}>Get OTP</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Mail size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Email Address"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Password"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <Eye size={20} color={Colors.textSecondary} />
                  ) : (
                    <EyeOff size={20} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/forgot-password")}
                style={styles.forgotRow}
              >
                <Text style={styles.forgotText}>Forgot Password ?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleEmailLogin}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={styles.linkText}>Signup</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 32 },
  logoContainer: { alignItems: "center", marginTop: 24, marginBottom: 24 },
  logoImage: { width: 70, height: 70, borderRadius: 16 },
  brandText: { fontSize: 14, fontWeight: "800", color: Colors.primary, marginTop: 6, letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: "700", color: Colors.text, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", marginBottom: 32 },
  toggleContainer: { flexDirection: "row", backgroundColor: Colors.background, borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  toggleBtnActive: { backgroundColor: Colors.white, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  toggleTextActive: { color: Colors.primary },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, backgroundColor: Colors.white, gap: 12 },
  countryCode: { fontSize: 15, fontWeight: "600", color: Colors.text },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  forgotRow: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { fontSize: 13, color: Colors.text, fontWeight: "500" },
  primaryButton: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center", marginBottom: 20 },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  bottomText: { fontSize: 14, color: Colors.textSecondary },
  linkText: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
});
