import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCircle, XCircle, AlertTriangle, Info, ShieldAlert } from "lucide-react-native";
import Colors from "@/constants/colors";

export type AlertType = "success" | "error" | "warning" | "info" | "confirm";

export interface AlertAction {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

export interface AlertConfig {
  type: AlertType;
  title: string;
  message?: string;
  actions?: AlertAction[];
  onDismiss?: () => void;
}

interface AppAlertProps {
  config: AlertConfig | null;
  onHide: () => void;
}

const ALERT_ICON_COLORS: Record<AlertType, { bg: string; icon: string }> = {
  success: { bg: "#DCFCE7", icon: "#16A34A" },
  error: { bg: "#FEE2E2", icon: "#DC2626" },
  warning: { bg: "#FEF3C7", icon: "#D97706" },
  info: { bg: Colors.primaryLight, icon: Colors.primary },
  confirm: { bg: Colors.primaryLight, icon: Colors.primary },
};

const ALERT_ICONS: Record<AlertType, (color: string) => React.ReactNode> = {
  success: (c) => <CheckCircle size={32} color={c} />,
  error: (c) => <XCircle size={32} color={c} />,
  warning: (c) => <AlertTriangle size={32} color={c} />,
  info: (c) => <Info size={32} color={c} />,
  confirm: (c) => <ShieldAlert size={32} color={c} />,
};

export function AppAlert({ config, onHide }: AppAlertProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (config) {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 10 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [config]);

  const dismiss = (action?: AlertAction) => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      action?.onPress?.();
      onHide();
      config?.onDismiss?.();
    });
  };

  if (!config) return null;

  const iconColors = ALERT_ICON_COLORS[config.type];
  const icon = ALERT_ICONS[config.type](iconColors.icon);
  const actions = config.actions || [{ text: "OK", style: "default" }];

  return (
    <Modal transparent visible={!!config} animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => dismiss()} />
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: iconColors.bg }]}>
            {icon}
          </View>

          {/* Title */}
          <Text style={styles.title}>{config.title}</Text>

          {/* Message */}
          {config.message ? <Text style={styles.message}>{config.message}</Text> : null}

          {/* Actions */}
          <View style={[styles.actionsRow, actions.length === 1 && styles.actionsRowSingle]}>
            {actions.map((action, index) => {
              const isDestructive = action.style === "destructive";
              const isCancel = action.style === "cancel";
              const isPrimary = !isCancel && !isDestructive;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    isPrimary && styles.actionButtonPrimary,
                    isCancel && styles.actionButtonCancel,
                    isDestructive && styles.actionButtonDestructive,
                    actions.length === 1 && styles.actionButtonFull,
                  ]}
                  onPress={() => dismiss(action)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.actionText,
                      isPrimary && styles.actionTextPrimary,
                      isCancel && styles.actionTextCancel,
                      isDestructive && styles.actionTextDestructive,
                    ]}
                  >
                    {action.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 4,
  },
  actionsRowSingle: {
    justifyContent: "center",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  actionButtonFull: {
    flex: undefined,
    width: "100%",
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  actionButtonCancel: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonDestructive: {
    backgroundColor: "#FEE2E2",
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  actionTextPrimary: {
    color: Colors.white,
  },
  actionTextCancel: {
    color: Colors.textSecondary,
  },
  actionTextDestructive: {
    color: "#DC2626",
  },
});
