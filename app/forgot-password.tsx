import { safeBack } from "@/constants/navigation";
import { ChevronLeft, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const insets = useSafeAreaInsets();

  const handleSend = () => {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email address.");
      return;
    }
    Alert.alert(
      "Email Sent",
      "A password reset link has been sent to your email. Please check your inbox.",
      [{ text: "OK", onPress: () => safeBack("/login") }]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <TouchableOpacity onPress={() => safeBack("/login")} style={styles.backButton}>
        <ChevronLeft size={24} color={Colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you a link to reset your password.
      </Text>

      <View style={styles.inputContainer}>
        <Mail size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={Colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          testID="forgot-email"
        />
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSend}
        activeOpacity={0.8}
        testID="forgot-continue"
      >
        <Text style={styles.primaryButtonText}>Send Reset Link</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
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
    backgroundColor: Colors.white,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  spacer: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
