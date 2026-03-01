import { router } from "expo-router";
import { Bell, ChevronRight, CreditCard, Heart, HelpCircle, LogOut, Settings, User } from "lucide-react-native";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { PROFILE_IMAGES } from "@/mocks/events";

const MENU_ITEMS = [
  { icon: User, label: "Edit Profile", route: "/edit-profile" },
  { icon: CreditCard, label: "Payment Methods", route: "" },
  { icon: Bell, label: "Notifications", route: "" },
  { icon: Heart, label: "My Favorites", route: "" },
  { icon: Settings, label: "Settings", route: "" },
  { icon: HelpCircle, label: "Help & Support", route: "" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.profileCard}>
          <Image source={{ uri: PROFILE_IMAGES[0] }} style={styles.profileImage} />
          <Text style={styles.profileName}>Tanya Hill</Text>
          <Text style={styles.profileEmail}>tanya.hill@example.com</Text>
        </View>

        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              activeOpacity={0.6}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={styles.menuIconContainer}>
                <item.icon size={20} color={Colors.text} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace("/login")}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={Colors.primary} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 24,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  menuContainer: {
    paddingHorizontal: 20,
    gap: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});
