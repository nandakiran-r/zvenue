import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ChevronLeft, Plus, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { PROFILE_IMAGES } from "@/mocks/venues";

export default function SelectProfileScreen() {
  const [selectedImage, setSelectedImage] = useState<string>(PROFILE_IMAGES[0]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TouchableOpacity onPress={() => safeBack("/create-username")} style={styles.backButton}>
        <ChevronLeft size={24} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.progressRow}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={styles.progressBar} />
      </View>

      <Text style={styles.title}>Choose your photo profile</Text>
      <Text style={styles.subtitle}>Username can be changed at any time.</Text>

      <View style={styles.mainImageContainer}>
        <Image source={{ uri: selectedImage }} style={styles.mainImage} />
        <TouchableOpacity style={styles.removeButton}>
          <X size={14} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.thumbnailRow}>
        {[1, 2, 3].map((_, index) => (
          <TouchableOpacity
            key={index}
            style={styles.thumbnailPlaceholder}
            activeOpacity={0.7}
            onPress={() => {
              if (PROFILE_IMAGES[index + 1]) {
                setSelectedImage(PROFILE_IMAGES[index + 1]);
              }
            }}
          >
            <Plus size={24} color={Colors.primary} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push("/select-favourite")}
        activeOpacity={0.8}
        testID="profile-next"
      >
        <Text style={styles.primaryButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressActive: {
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  mainImageContainer: {
    alignSelf: "center",
    position: "relative",
    marginBottom: 24,
  },
  mainImage: {
    width: 180,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  thumbnailPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
