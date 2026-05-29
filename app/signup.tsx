import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { api } from "@/lib/api";
import { ChevronLeft, Mail, User, Phone } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useToast } from "@/context/ToastContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 6;
const GRID_COLS = 4;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS + 1)) / GRID_COLS;

// Venue-related placeholder images for the collage
const COLLAGE_IMAGES = [
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop",
];

export default function SignupScreen() {
  const params = useLocalSearchParams();
  const initialPhone = params.phone
    ? (params.phone as string).replace("+91", "")
    : "";

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>(initialPhone);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { warning, error: showError } = useToast();

  const handleSignup = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      phone.length < 10
    ) {
      warning(
        "Required",
        "Please fill in all mandatory fields with a valid phone number."
      );
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      warning("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

      // Step 1: Create account (do NOT login yet — OTP verification required first)
      await api.post("/api/auth/sign-up", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone_number: formattedPhone,
      });

      // Step 2: Send OTP for phone verification
      await api.post("/api/auth/send-otp", { phone_number: formattedPhone });

      // Step 3: Navigate to OTP screen — login happens AFTER successful verification
      router.replace({
        pathname: "/enter-otp",
        params: { phone: formattedPhone, full_name: `${firstName.trim()} ${lastName.trim()}` },
      });
    } catch (err: any) {
      const message =
        err.response?.data?.error || "Signup failed. Please try again.";
      showError("Signup Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Grid Collage */}
          <View style={styles.collageContainer}>
            {/* Back button overlaid on collage */}
            <TouchableOpacity
              onPress={() => safeBack("/login")}
              style={[styles.backButton, { top: insets.top + 8 }]}
            >
              <ChevronLeft size={22} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.collageRow}>
              <View style={[styles.collageTile, styles.tileTall]}>
                <Image
                  source={{ uri: COLLAGE_IMAGES[0] }}
                  style={styles.collageImage}
                />
              </View>
              <View style={styles.collageTile}>
                <Image
                  source={{ uri: COLLAGE_IMAGES[1] }}
                  style={styles.collageImage}
                />
              </View>
              <View style={[styles.collageTile, styles.tileWide]}>
                <Image
                  source={{ uri: COLLAGE_IMAGES[2] }}
                  style={styles.collageImage}
                />
              </View>
              <View style={[styles.collageTile, styles.tileTall]}>
                <Image
                  source={{ uri: COLLAGE_IMAGES[3] }}
                  style={styles.collageImage}
                />
              </View>
            </View>
            <View style={styles.collageRow}>
              <View style={[styles.collageTile, styles.tileTall]}>
                <Image
                  source={{ uri: COLLAGE_IMAGES[4] }}
                  style={styles.collageImage}
                />
              </View>
              <View style={[styles.collageTile, styles.tileWide]}>
                <Image
                  source={{ uri: COLLAGE_IMAGES[5] }}
                  style={styles.collageImage}
                />
              </View>
              <View style={styles.collageTile}>
                <Image
                  source={{ uri: COLLAGE_IMAGES[6] }}
                  style={styles.collageImage}
                />
              </View>
              <View style={styles.collageTile}>
                <Image
                  source={{ uri: COLLAGE_IMAGES[7] }}
                  style={styles.collageImage}
                />
              </View>
            </View>
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Join Zvenue</Text>
            <Text style={styles.welcomeSubtitle}>
              Create your account to start booking venues
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    placeholderTextColor={Colors.textTertiary}
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
              </View>
              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    placeholderTextColor={Colors.textTertiary}
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>
            </View>

            {/* Email */}
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone */}
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <View style={styles.phonePrefix}>
                <Phone size={18} color={Colors.primary} />
                <Text style={styles.countryCode}>+91</Text>
                <View style={styles.separator} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="10-digit number"
                placeholderTextColor={Colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleSignup}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Link */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => safeBack("/login")}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },

  // Photo Grid Collage
  collageContainer: {
    paddingHorizontal: GRID_GAP,
    paddingTop: GRID_GAP,
    gap: GRID_GAP,
    position: "relative",
  },
  collageRow: {
    flexDirection: "row",
    gap: GRID_GAP,
    height: TILE_SIZE * 1.1,
  },
  collageTile: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  tileTall: {
    flex: 1.1,
  },
  tileWide: {
    flex: 1.3,
  },
  collageImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  backButton: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Welcome Section
  welcomeSection: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 4,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Form Section
  formSection: {
    paddingHorizontal: 28,
    paddingTop: 20,
  },
  nameRow: {
    flexDirection: "row",
    gap: 16,
  },
  nameField: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 12,
    gap: 10,
  },
  phonePrefix: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: "#E0E0E0",
    marginLeft: 4,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  // Bottom
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  bottomText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  linkText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "700",
  },
});
