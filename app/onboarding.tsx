import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { activateTrial } from "@/lib/api";
import { Check, Clock, Gift, Shield, Zap } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { ONBOARDING_IMAGES } from "@/mocks/venues";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Find the perfect\nvenue for your event",
    subtitle: "Discover wedding halls, party venues, and banquet spaces near you.",
    images: ONBOARDING_IMAGES[0],
  },
  {
    id: "2",
    title: "Explore halls\nnear your location",
    subtitle: "Browse hundreds of verified venues with photos, amenities and pricing.",
    images: ONBOARDING_IMAGES[1],
  },
  {
    id: "3",
    title: "Book your dream\nvenue in minutes",
    subtitle: "Instant booking confirmation, no hassle. Your event, your way.",
    images: ONBOARDING_IMAGES[2],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const { dbUser, refreshSubscriptionInfo, hasAccess, isLoaded } = useAuth();
  
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [trialActivated, setTrialActivated] = useState(false);

  // Redirect if user already has access (trial or subscription active)
  useEffect(() => {
    if (isLoaded && hasAccess) {
      router.replace("/(tabs)/home");
    }
  }, [isLoaded, hasAccess]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // On last slide - activate trial and proceed
      await activateTrialAndContinue();
    }
  };
  
  const activateTrialAndContinue = async () => {
    setActivatingTrial(true);
    try {
      const response = await activateTrial();
      if (response.success) {
        setTrialActivated(true);
        await refreshSubscriptionInfo();
        // Show success and navigate to app
        setTimeout(() => {
          router.replace("/(tabs)/home");
        }, 1500);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to activate trial. Please try again.";
      Alert.alert("Activation Failed", message);
    } finally {
      setActivatingTrial(false);
    }
  };

  const renderImageGrid = (images: string[]) => (
    <View style={styles.imageGrid}>
      <View style={styles.imageColumn}>
        <Image source={{ uri: images[0] }} style={styles.imageTall} />
        <Image source={{ uri: images[3] }} style={styles.imageShort} />
      </View>
      <View style={styles.imageColumn}>
        <Image source={{ uri: images[1] }} style={styles.imageShort} />
        <Image source={{ uri: images[4] }} style={styles.imageTall} />
      </View>
      <View style={styles.imageColumn}>
        <Image source={{ uri: images[2] }} style={styles.imageTall} />
        <Image source={{ uri: images[5] }} style={styles.imageShort} />
      </View>
    </View>
  );

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => {
    // If this is the last slide and trial is being activated or activated, show trial activation UI
    if (item.id === "3" && currentIndex === SLIDES.length - 1) {
      return (
        <View style={[styles.slide, { width }, styles.trialSlide]}>
          <View style={styles.trialContent}>
            <View style={styles.trialIconContainer}>
              <Gift size={48} color={Colors.primary} />
            </View>
            <Text style={styles.trialTitle}>Start Your 7-Day Free Trial</Text>
            <Text style={styles.trialSubtitle}>
              Get unlimited access to all premium venues and features
            </Text>
            
            <View style={styles.trialFeatures}>
              <View style={styles.trialFeatureItem}>
                <Check size={20} color={Colors.success} />
                <Text style={styles.trialFeatureText}>Unlimited venue bookings</Text>
              </View>
              <View style={styles.trialFeatureItem}>
                <Check size={20} color={Colors.success} />
                <Text style={styles.trialFeatureText}>No booking fees</Text>
              </View>
              <View style={styles.trialFeatureItem}>
                <Check size={20} color={Colors.success} />
                <Text style={styles.trialFeatureText}>Priority support</Text>
              </View>
              <View style={styles.trialFeatureItem}>
                <Check size={20} color={Colors.success} />
                <Text style={styles.trialFeatureText}>Exclusive deals</Text>
              </View>
            </View>

            {trialActivated ? (
              <View style={styles.successContainer}>
                <Shield size={32} color={Colors.success} />
                <Text style={styles.successText}>Trial Activated!</Text>
                <Text style={styles.successSubtext}>Welcome to Zvenue Pro</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.activateButton, activatingTrial && styles.disabledButton]}
                onPress={handleNext}
                disabled={activatingTrial}
              >
                {activatingTrial ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.activateButtonText}>Start Free Trial</Text>
                    <Clock size={20} color={Colors.white} />
                  </>
                )}
              </TouchableOpacity>
            )}

            <Text style={styles.trialNote}>
              Phone verification required. No charges during trial.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.slide, { width }]}>
        {renderImageGrid(item.images)}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      {currentIndex < SLIDES.length - 1 && (
        <View style={styles.footer}>
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
            activeOpacity={0.8}
            testID="onboarding-next"
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  slide: {
    flex: 1,
  },
  trialSlide: {
    backgroundColor: Colors.background,
  },
  imageGrid: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    padding: 4,
  },
  imageColumn: {
    flex: 1,
    gap: 8,
  },
  imageTall: {
    flex: 3,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  imageShort: {
    flex: 2,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  textContainer: {
    paddingHorizontal: 32,
    paddingTop: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 20,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 28,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.textTertiary,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  // Trial activation styles
  trialContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    alignItems: "center",
  },
  trialIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  trialTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  trialSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  trialFeatures: {
    width: "100%",
    marginBottom: 32,
    gap: 16,
  },
  trialFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trialFeatureText: {
    fontSize: 14,
    color: Colors.text,
  },
  activateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  activateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  trialNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  successContainer: {
    alignItems: "center",
    gap: 12,
  },
  successText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.success,
  },
  successSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
