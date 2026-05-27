import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ChevronLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useToast } from "@/context/ToastContext";

export default function EnterOtpScreen() {
  const { phone, full_name } = useLocalSearchParams<{ phone: string; full_name?: string }>();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState<number>(52);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const insets = useSafeAreaInsets();
  const { success, error: showError, warning } = useToast();
  
  const { login } = useAuth();

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
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (value && index === otp.length - 1) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}s`;
  };

  const handleResend = useCallback(async () => {
    try {
      if (phone) {
        await api.post("/api/auth/send-otp", { phone_number: phone });
      }
      setTimer(52);
      success("Code Sent", "A new verification code has been sent.");
    } catch (err: any) {
      showError("Error", "Could not resend code. Please try again.");
    }
  }, [phone]);

  const handleVerify = useCallback(async () => {
    const code = otp.join("");
    if (code.length < 6) {
      warning("Required", "Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/verify-otp", {
        phone_number: phone,
        otp: code,
        full_name: full_name
      });
      await login(response.data.token, response.data.user);
      // Navigate to home - tabs layout will gate access (redirect to /subscription if needed)
      router.replace("/(tabs)/home");
    } catch (err: any) {
      const message = err.response?.data?.error || "Invalid code. Please try again.";
      showError("Verification Failed", message);
    } finally {
      setLoading(false);
    }
  }, [otp, phone, full_name, login]);


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            onPress={() => safeBack("/login")}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Enter OTP Code</Text>
          <Text style={styles.subtitle}>
            A 6-digit verification code has been sent to {phone ?? "your number"}.
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
            {timer > 0 ? (
              <Text style={styles.timerText}>{formatTimer(timer)}</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.spacer} />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={loading}
            testID="otp-verify"
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24 },
  backButton: { marginTop: 8, marginBottom: 16, width: 40, height: 40, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 32 },
  otpRow: { flexDirection: "row", gap: 10, marginBottom: 20, justifyContent: "center" },
  otpInput: { width: 48, height: 56, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 14, fontSize: 22, fontWeight: "700", textAlign: "center", color: Colors.text },
  otpInputFilled: { borderColor: Colors.primary },
  resendRow: { flexDirection: "row", justifyContent: "flex-end" },
  resendText: { fontSize: 13, color: Colors.textSecondary },
  timerText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  resendLink: { fontSize: 13, color: Colors.primary, fontWeight: "700" },
  spacer: { flex: 1 },
  primaryButton: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: "center", marginBottom: 16 },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
