import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ChevronLeft, Eye, EyeOff, Lock } from "lucide-react-native";
import React, { useState } from "react";
import {
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

export default function NewPasswordScreen() {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <TouchableOpacity onPress={() => safeBack("/enter-otp")} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Enter New Password</Text>
        <Text style={styles.subtitle}>Please enter new password</Text>

        <View style={styles.inputContainer}>
          <Lock size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Enter New Password"
            placeholderTextColor={Colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            testID="new-password-input"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <Eye size={20} color={Colors.textSecondary} />
            ) : (
              <EyeOff size={20} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Re-Enter Password"
            placeholderTextColor={Colors.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            testID="confirm-password-input"
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? (
              <Eye size={20} color={Colors.textSecondary} />
            ) : (
              <EyeOff size={20} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/password-reset-success")}
          activeOpacity={0.8}
          testID="save-password"
        >
          <Text style={styles.primaryButtonText}>Save</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
  },
  flex: {
    flex: 1,
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
