import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react-native";
import Colors from "@/constants/colors";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 3500
  onDismiss?: () => void;
}

interface AppToastProps {
  config: ToastConfig | null;
  onHide: () => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: "#F0FDF4", border: "#BBF7D0", icon: "#16A34A" },
  error: { bg: "#FEF2F2", border: "#FECACA", icon: "#DC2626" },
  warning: { bg: "#FFFBEB", border: "#FDE68A", icon: "#D97706" },
  info: { bg: "#F0F9FF", border: "#BAE6FD", icon: Colors.primary },
};

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={22} color="#16A34A" />,
  error: <XCircle size={22} color="#DC2626" />,
  warning: <AlertTriangle size={22} color="#D97706" />,
  info: <Info size={22} color={Colors.primary} />,
};

export function AppToast({ config, onHide }: AppToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          dismiss();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (config) {
      show();
      const duration = config.duration ?? 3500;
      timerRef.current = setTimeout(() => dismiss(), duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [config]);

  const show = () => {
    translateY.setValue(100);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: 120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onHide();
      config?.onDismiss?.();
    });
  };

  if (!config) return null;

  const colors = TOAST_COLORS[config.type];
  const icon = TOAST_ICONS[config.type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderColor: colors.border, transform: [{ translateY }], opacity },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{config.title}</Text>
        {config.message ? <Text style={styles.message}>{config.message}</Text> : null}
      </View>
      <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
