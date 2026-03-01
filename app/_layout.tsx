import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="enter-otp" />
      <Stack.Screen name="new-password" />
      <Stack.Screen name="password-reset-success" options={{ presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="create-username" />
      <Stack.Screen name="select-profile" />
      <Stack.Screen name="select-favourite" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="venue-detail" />
      <Stack.Screen name="booking-detail" />
      <Stack.Screen name="booking-confirmed" options={{ presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="view-booking" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
