import { router } from "expo-router";
import { Check } from "lucide-react-native";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "@/constants/colors";

export default function PasswordResetSuccessScreen() {
  return (
    <Modal animationType="fade" transparent visible onRequestClose={() => router.back()}>
      <Pressable style={styles.overlay} onPress={() => {}}>
        <View style={styles.card}>
          <View style={styles.checkCircle}>
            <Check size={32} color={Colors.white} strokeWidth={3} />
          </View>
          <Text style={styles.title}>Password Update{"\n"}Successfully</Text>
          <Text style={styles.subtitle}>
            Your password has been{"\n"}updated successfully
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("/login")}
            activeOpacity={0.8}
            testID="back-to-home"
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 32,
    alignItems: "center",
    width: "85%",
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: "center",
    width: "100%",
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
