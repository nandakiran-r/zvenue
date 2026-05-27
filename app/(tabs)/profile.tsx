import { router } from "expo-router";
import { Bell, Calendar, ChevronRight, HelpCircle, LogOut, Settings, Trash2, User } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { useToast } from "@/context/ToastContext";
import { deleteMyAccount } from "@/lib/api";

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
  const { error: showError, showAlert } = useToast();

  const displayName = dbUser?.full_name ?? "User";
  const displayEmail = dbUser?.email ?? "";
  const displayAvatar = dbUser?.avatar_url ?? null;

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteModalVisible(true);
    setConfirmText("");
  };

  const confirmDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      showError("Error", 'Please type "DELETE" to confirm.');
      return;
    }

    try {
      setDeleting(true);
      await deleteMyAccount();
      // Clear all local data
      await AsyncStorage.clear();
      await signOut();
      showAlert({
        type: "success",
        title: "Account Deleted",
        message: "Your account has been permanently deleted.",
        actions: [{ text: "OK", style: "default", onPress: () => router.replace("/login") }],
      });
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to delete account. Please try again.";
      showError("Error", msg);
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
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
          <LogOut size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color="#7a3317" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Trash2 size={32} color="#7a3317" />
            </View>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalMessage}>
              This will permanently delete your account, all bookings, notifications, and personal data. Active subscriptions will be cancelled. This action cannot be undone.
            </Text>

            <Text style={styles.modalConfirmLabel}>Type "DELETE" to confirm:</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="DELETE"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.modalDeleteBtn, confirmText !== "DELETE" && { opacity: 0.4 }]}
              onPress={confirmDeleteAccount}
              disabled={confirmText !== "DELETE" || deleting}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDeleteBtnText}>{deleting ? "Deleting..." : "Permanently Delete"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => { setDeleteModalVisible(false); setConfirmText(""); }}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: '#7a3317',
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#7a3317",
    gap: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#7a3317",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF0F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalConfirmLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#7a3317",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 20,
  },
  modalDeleteBtn: {
    backgroundColor: "#7a3317",
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  modalDeleteBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700" as const,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  modalCancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "600" as const,
  },
});
