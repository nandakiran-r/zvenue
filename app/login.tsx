import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Phone, UserPlus, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
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
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&h=400&fit=crop",
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
];

export default function LoginScreen() {
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const { warning, error: showError } = useToast();

  const { isSignedIn } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) {
        router.replace("/(tabs)/home");
      }
    }, [isSignedIn])
  );

  const handlePhoneLogin = async () => {
    if (!phone.trim() || phone.length < 10) {
      warning("Required", "Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
      await api.post("/api/auth/send-otp", {
        phone_number: formattedPhone,
      });
      router.push({
        pathname: "/enter-otp",
        params: { phone: formattedPhone },
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setShowSignupPrompt(true);
      } else {
        const message = err.response?.data?.error || "Failed to send OTP.";
        showError("Login Error", message);
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignup = () => {
    setShowSignupPrompt(false);
    router.push({
      pathname: "/signup",
      params: { phone: phone },
    });
  };

  return (
    <View style={styles.container} testID="login-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* Photo Grid Collage */}
          <View style={styles.collageContainer}>
            <View style={styles.collageRow}>
              <View style={[styles.collageTile, styles.tileTall]}>
                <Image source={{ uri: COLLAGE_IMAGES[0] }} style={styles.collageImage} />
              </View>
              <View style={styles.collageTile}>
                <Image source={{ uri: COLLAGE_IMAGES[1] }} style={styles.collageImage} />
              </View>
              <View style={[styles.collageTile, styles.tileWide]}>
                <Image source={{ uri: COLLAGE_IMAGES[2] }} style={styles.collageImage} />
              </View>
              <View style={[styles.collageTile, styles.tileTall]}>
                <Image source={{ uri: COLLAGE_IMAGES[3] }} style={styles.collageImage} />
              </View>
            </View>
            <View style={styles.collageRow}>
              <View style={[styles.collageTile, styles.tileTall]}>
                <Image source={{ uri: COLLAGE_IMAGES[4] }} style={styles.collageImage} />
              </View>
              <View style={[styles.collageTile, styles.tileWide]}>
                <Image source={{ uri: COLLAGE_IMAGES[5] }} style={styles.collageImage} />
              </View>
              <View style={styles.collageTile}>
                <Image source={{ uri: COLLAGE_IMAGES[6] }} style={styles.collageImage} />
              </View>
              <View style={styles.collageTile}>
                <Image source={{ uri: COLLAGE_IMAGES[7] }} style={styles.collageImage} />
              </View>
            </View>
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome to Zvenue</Text>
            <Text style={styles.welcomeSubtitle}>
              Discover and book the perfect venue for every occasion
            </Text>
          </View>

          {/* Phone Input */}
          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <View style={styles.phonePrefix}>
                <Phone size={18} color={Colors.primary} />
                <Text style={styles.countryCode}>+91</Text>
                <View style={styles.separator} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit number"
                placeholderTextColor={Colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                testID="login-phone-input"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handlePhoneLogin}
              activeOpacity={0.8}
              disabled={loading}
              testID="login-submit-button"
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Log in or Sign up</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Link */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>New to Zvenue? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={styles.linkText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Registration Prompt Modal */}
      <Modal
        visible={showSignupPrompt}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSignupPrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
              <TouchableOpacity
                onPress={() => setShowSignupPrompt(false)}
                style={styles.closeButton}
              >
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.iconCircle}>
                <UserPlus size={32} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>User Not Found</Text>
              <Text style={styles.modalSubtitle}>
                The phone number{" "}
                <Text style={{ fontWeight: "700", color: Colors.text }}>
                  +91 {phone}
                </Text>{" "}
                is not registered with us yet.
              </Text>

              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={navigateToSignup}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryButtonText}>Sign Up Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowSignupPrompt(false)}
                activeOpacity={0.6}
              >
                <Text style={styles.modalSecondaryButtonText}>
                  Try Another Number
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  collageRow: {
    flexDirection: "row",
    gap: GRID_GAP,
    height: TILE_SIZE * 1.2,
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

  // Welcome Section
  welcomeSection: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 8,
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
    paddingTop: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 12,
    marginBottom: 28,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    position: "absolute",
  },
  closeButton: {
    position: "absolute",
    right: 0,
    padding: 4,
  },
  modalBody: {
    alignItems: "center",
    paddingVertical: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#7a331710",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  modalPrimaryButton: {
    backgroundColor: Colors.primary,
    width: "100%",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalPrimaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  modalSecondaryButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSecondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
});
