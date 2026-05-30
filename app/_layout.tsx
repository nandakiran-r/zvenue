
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { ToastProvider } from "@/context/ToastContext";
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
      {/* Service Marketplace Screens */}
      <Stack.Screen name="service-listings" />
      <Stack.Screen name="service-detail" />
      <Stack.Screen name="service-booking-confirmed" options={{ presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="view-service-booking" />
      <Stack.Screen name="write-service-review" />
      <Stack.Screen name="service-reviews" />
      <Stack.Screen name="legal-content" />
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
              <ToastProvider>
                <RootLayoutNav />
              </ToastProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
