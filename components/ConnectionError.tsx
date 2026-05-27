import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WifiOff, RefreshCw, Home } from "lucide-react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";

export type ErrorVariant = "network" | "server" | "generic";

interface ConnectionErrorProps {
  variant?: ErrorVariant;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

const VARIANTS: Record<ErrorVariant, { title: string; message: string }> = {
  network: {
    title: "No Internet Connection",
    message: "Please check your network connection and try again. Make sure you're connected to Wi-Fi or mobile data.",
  },
  server: {
    title: "Server Unavailable",
    message: "We're having trouble reaching our servers. This is usually temporary — please try again in a moment.",
  },
  generic: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again or contact support if the issue persists.",
  },
};

export function ConnectionError({
  variant = "generic",
  title,
  message,
  onRetry,
  showHomeButton = true,
}: ConnectionErrorProps) {
  const defaults = VARIANTS[variant];

  return (
    <View style={styles.container}>
      {/* Decorative background circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <WifiOff size={36} color={Colors.primary} />
          </View>
        </View>
      </View>

      {/* Text */}
      <Text style={styles.title}>{title || defaults.title}</Text>
      <Text style={styles.message}>{message || defaults.message}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
            <RefreshCw size={18} color={Colors.white} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}

        {showHomeButton && (
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace("/(tabs)/home")}
            activeOpacity={0.8}
          >
            <Home size={18} color={Colors.primary} />
            <Text style={styles.homeText}>Go Home</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Support note */}
      <Text style={styles.supportText}>
        If this keeps happening, contact us at support@zvenue.in
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  bgCircle1: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryLight,
    opacity: 0.3,
  },
  bgCircle2: {
    position: "absolute",
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primaryLight,
    opacity: 0.2,
  },
  iconContainer: {
    marginBottom: 28,
  },
  iconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 280,
  },
  actions: {
    width: "100%",
    gap: 12,
    alignItems: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    maxWidth: 260,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    maxWidth: 260,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  homeText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  supportText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 32,
  },
});
