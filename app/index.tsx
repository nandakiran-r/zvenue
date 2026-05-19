import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";

const ONBOARDING_SEEN_KEY = "zvenue_onboarding_seen";

export default function SplashScreen() {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { isLoaded, isSignedIn, hasAccess, subscriptionInfo } = useAuth();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      if (!isLoaded) return;

      // Check if onboarding has been seen before
      const onboardingSeen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);

      if (!isSignedIn) {
        // Not logged in: show onboarding if first time, otherwise login
        if (!onboardingSeen) {
          router.replace("/onboarding");
        } else {
          router.replace("/login");
        }
      } else {
        // Logged in: check access
        if (hasAccess) {
          router.replace("/(tabs)/home");
        } else if (subscriptionInfo && !hasAccess) {
          // Trial expired, no subscription → subscription page
          router.replace("/subscription");
        } else {
          // Still loading subscription info, go to home (tabs layout will gate)
          router.replace("/(tabs)/home");
        }
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, hasAccess, subscriptionInfo]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <Image
          source={require("../assets/images/favicon.png")}
          style={styles.logoImage}
        />
        <Animated.Text style={styles.brandText}>ZVENUE</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 22,
  },
  brandText: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.primary,
    marginTop: 12,
    letterSpacing: 2,
  },
});
