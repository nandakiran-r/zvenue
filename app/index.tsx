import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";

export default function SplashScreen() {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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

    const timer = setTimeout(() => {
      router.replace("/onboarding");
    }, 2500);
    return () => clearTimeout(timer);
  }, [scaleAnim, opacityAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <View style={styles.logoCircle}>
          <View style={styles.logoInner} />
          <View style={styles.logoSlice} />
        </View>
        <Animated.Text style={styles.brandText}>CITY EVENT</Animated.Text>
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
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    overflow: "hidden",
    position: "relative",
  },
  logoInner: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  logoSlice: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 50,
    height: 100,
    backgroundColor: "rgba(255,100,150,0.5)",
    transform: [{ rotate: "-15deg" }],
  },
  brandText: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.primary,
    marginTop: 12,
    letterSpacing: 2,
  },
});
