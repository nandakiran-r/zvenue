
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();


function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="enter-otp" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="venue-detail" />
      <Stack.Screen name="booking-detail" />
      <Stack.Screen name="booking-confirmed" options={{ presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="view-booking" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="category-venues" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
      <Stack.Screen name="write-review" />
      <Stack.Screen name="venue-reviews" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <FavoritesProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </QueryClientProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
