import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import Colors from "@/constants/colors";

const ONBOARDING_SEEN_KEY = "zvenue_onboarding_seen";

export default function IndexScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const navigate = async () => {
      if (isSignedIn) {
        router.replace("/(tabs)/home");
      } else {
        const onboardingSeen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
        if (!onboardingSeen) {
          router.replace("/onboarding");
        } else {
          router.replace("/login");
        }
      }
    };

    navigate();
  }, [isLoaded, isSignedIn]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
