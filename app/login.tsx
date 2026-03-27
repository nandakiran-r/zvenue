import { router } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
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
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

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
          <Text style={styles.subtitle}>Use Credentials to access your account</Text>

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
              testID="login-email"
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
              testID="login-password"
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
            <Text style={styles.forgotText}>Forgot Password ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("/(tabs)/home")}
            activeOpacity={0.8}
            testID="login-button"
          >
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>Or</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={styles.socialButton}
            activeOpacity={0.7}
            onPress={() => router.replace("/(tabs)/home")}
          >
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Login with Google</Text>
          </TouchableOpacity>

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
  logoContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
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
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
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
  forgotRow: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 20,
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
    marginTop: 20,
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
