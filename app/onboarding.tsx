import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
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
const ONBOARDING_SEEN_KEY = "zvenue_onboarding_seen";

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
    subtitle: "Instant booking confirmation with secure payments. Start with a 7-day free trial!",
    images: ONBOARDING_IMAGES[2],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    // Mark onboarding as seen
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    router.replace("/login");
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    router.replace("/login");
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

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={[styles.slide, { width }]}>
      {renderImageGrid(item.images)}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Skip button */}
      <TouchableOpacity style={[styles.skipButton, { top: insets.top + 12 }]} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

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
        >
          <Text style={styles.buttonText}>
            {isLastSlide ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: "absolute",
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  slide: {
    flex: 1,
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
    fontWeight: "700",
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
    fontWeight: "700",
  },
});
