import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ChevronLeft, Mail, MessageCircle } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function ForgotPasswordScreen() {
  const [selectedMethod, setSelectedMethod] = useState<"sms" | "email">("sms");
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TouchableOpacity onPress={() => safeBack("/login")} style={styles.backButton}>
        <ChevronLeft size={24} color={Colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Select which contact details should we use to reset your password
      </Text>

      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === "sms" && styles.methodCardActive]}
        onPress={() => setSelectedMethod("sms")}
        activeOpacity={0.7}
      >
        <View style={[styles.methodIcon, selectedMethod === "sms" && styles.methodIconActive]}>
          <MessageCircle size={22} color={selectedMethod === "sms" ? Colors.white : Colors.textSecondary} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodLabel}>Send OTP via SMS</Text>
          <Text style={styles.methodValue}>(406) 555-0120</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === "email" && styles.methodCardActive]}
        onPress={() => setSelectedMethod("email")}
        activeOpacity={0.7}
      >
        <View style={[styles.methodIcon, selectedMethod === "email" && styles.methodIconActive]}>
          <Mail size={22} color={selectedMethod === "email" ? Colors.white : Colors.textSecondary} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodLabel}>Send OTP via Email</Text>
          <Text style={styles.methodValue}>tanya.hill@example.com</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push("/enter-otp")}
        activeOpacity={0.8}
        testID="forgot-continue"
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
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
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    gap: 14,
  },
  methodCardActive: {
    borderColor: Colors.primary,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  methodIconActive: {
    backgroundColor: Colors.primary,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  methodValue: {
    fontSize: 15,
    fontWeight: "600" as const,
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
