import { router } from "expo-router";
import { Bell, Calendar, ChevronRight, HelpCircle, LogOut, Settings, User } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
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

const MENU_ITEMS = [
  { icon: User, label: "Edit Profile", route: "/edit-profile" },
  { icon: Calendar, label: "My Bookings", route: "/bookings" },
  { icon: Bell, label: "Notifications", route: "/notifications" },
  { icon: Settings, label: "Settings", route: "/settings" },
  { icon: HelpCircle, label: "Help & Support", route: "/help" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, dbUser } = useAuth();

  const displayName = dbUser?.full_name ?? "User";
  const displayEmail = dbUser?.email ?? "";
  const displayAvatar = dbUser?.avatar_url ?? null;

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.profileCard}>
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.profilePlaceholder]}>
              <User size={36} color={Colors.textSecondary} />
            </View>
          )}
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail || dbUser?.phone_number || ""}</Text>
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
          onPress={handleLogout}
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
    paddingBottom: 90,
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
  profilePlaceholder: {
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
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
