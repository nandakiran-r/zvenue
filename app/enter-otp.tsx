import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ChevronLeft } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function EnterOtpScreen() {
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [timer, setTimer] = useState<number>(52);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}s`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TouchableOpacity onPress={() => safeBack("/forgot-password")} style={styles.backButton}>
        <ChevronLeft size={24} color={Colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Enter OTP Code</Text>
      <Text style={styles.subtitle}>
        OTP code has been sent to (406) 555-0120
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            testID={`otp-input-${index}`}
          />
        ))}
      </View>

      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Resend code </Text>
        <Text style={styles.timerText}>{formatTimer(timer)}</Text>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push("/new-password")}
        activeOpacity={0.8}
        testID="otp-verify"
      >
        <Text style={styles.primaryButtonText}>Verify</Text>
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
    marginBottom: 32,
  },
  otpRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 14,
    fontSize: 24,
    fontWeight: "700" as const,
    textAlign: "center",
    color: Colors.text,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  resendText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  timerText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600" as const,
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
