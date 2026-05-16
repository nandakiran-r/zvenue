import { useAuth } from "@/context/AuthContext";
import { Redirect, Tabs } from "expo-router";
import { Heart, Home, Search, User } from "lucide-react-native";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  const { isSignedIn, isLoaded, hasAccess, subscriptionInfo, refreshSubscriptionInfo } = useAuth();

  // Wait for auth to load
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Redirect unauthenticated users to login
  if (!isSignedIn) {
    return <Redirect href="/login" />;
  }

  // Check subscription/trial status
  // If user has no access, redirect to subscription screen
  if (isSignedIn && !hasAccess && subscriptionInfo) {
    return <Redirect href="/subscription" />;
  }

  // If subscription info is loading, show loading state
  if (isSignedIn && subscriptionInfo === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: Colors.white,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
