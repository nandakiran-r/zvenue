import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import * as WebBrowser from "expo-web-browser";
import { ChevronLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
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

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const { signUp, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  // ── Email / Password Sign-Up ────────────────────────────────────────────────
  const handleSignup = useCallback(async () => {
    if (!isLoaded || !signUp) return;
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Required", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        firstName: name.trim().split(" ")[0],
        lastName: name.trim().split(" ").slice(1).join(" ") || undefined,
        emailAddress: email.trim(),
        password,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Navigate to OTP screen for email verification
      router.push({
        pathname: "/enter-otp",
        params: { mode: "verify", email: email.trim() },
      });
    } catch (err: any) {
      const message = err?.errors?.[0]?.longMessage ?? err?.message ?? "Signup failed. Please try again.";
      Alert.alert("Signup Failed", message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, name, email, password]);

  // ── Google OAuth ────────────────────────────────────────────────────────────
  const handleGoogleSignup = useCallback(async () => {
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)/home");
      }
    } catch (err: any) {
      const message = err?.errors?.[0]?.longMessage ?? "Google sign-up failed. Please try again.";
      Alert.alert("Google Sign-Up Failed", message);
    } finally {
      setGoogleLoading(false);
    }
  }, [startOAuthFlow]);

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
          <TouchableOpacity onPress={() => safeBack("/login")} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/favicon.png")}
              style={styles.logoImage}
            />
            <Text style={styles.brandText}>ZVENUE</Text>
          </View>

          <Text style={styles.title}>Create an Account</Text>
          <Text style={styles.subtitle}>Please fill this detail to create an account</Text>

          <View style={styles.inputContainer}>
            <User size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              testID="signup-name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="signup-email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              testID="signup-password"
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
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleSignup}
            activeOpacity={0.8}
            disabled={loading}
            testID="signup-button"
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Signup</Text>
            )}
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>Or</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, googleLoading && styles.disabledButton]}
            activeOpacity={0.7}
            onPress={handleGoogleSignup}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Sign up with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => safeBack("/login")}>
              <Text style={styles.linkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
  },
  brandText: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: Colors.primary,
    marginTop: 6,
    letterSpacing: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: Colors.white,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 10,
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  socialText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  bottomText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
});
