import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { CheckCircle, ChevronLeft, User } from "lucide-react-native";
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

export default function CreateUsernameScreen() {
  const [username, setUsername] = useState<string>("Tanya Hill");
  const insets = useSafeAreaInsets();

  const isValid = username.trim().length > 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <TouchableOpacity onPress={() => safeBack("/signup")} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.progressRow}>
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
        </View>

        <Text style={styles.title}>Create username</Text>
        <Text style={styles.subtitle}>Photo profile can be changed at any time.</Text>

        <View style={[styles.inputContainer, isValid && styles.inputContainerActive]}>
          <User size={20} color={isValid ? Colors.success : Colors.textSecondary} />
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor={Colors.textTertiary}
            testID="username-input"
          />
          {isValid && <CheckCircle size={22} color={Colors.success} />}
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.primaryButton, !isValid && styles.buttonDisabled]}
          onPress={() => router.push("/select-profile")}
          activeOpacity={0.8}
          disabled={!isValid}
          testID="username-next"
        >
          <Text style={styles.primaryButtonText}>Next</Text>
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
  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressActive: {
    backgroundColor: Colors.primary,
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
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputContainerActive: {
    borderColor: Colors.primary,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
