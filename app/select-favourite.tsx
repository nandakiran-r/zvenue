import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ChevronLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { FAVOURITE_CATEGORIES } from "@/mocks/events";

export default function SelectFavouriteScreen() {
  const [selected, setSelected] = useState<string[]>(["3"]);
  const insets = useSafeAreaInsets();

  const toggleCategory = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TouchableOpacity onPress={() => safeBack("/select-profile")} style={styles.backButton}>
        <ChevronLeft size={24} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.progressRow}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={[styles.progressBar, styles.progressActive]} />
      </View>

      <Text style={styles.title}>Choose your favorite event</Text>
      <Text style={styles.subtitle}>Get personalized event recommendation.</Text>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        <View style={styles.categoriesWrap}>
          {FAVOURITE_CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => toggleCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[styles.categoryText, isSelected && styles.categoryTextActive]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.replace("/(tabs)/home")}
        activeOpacity={0.8}
        testID="favourite-finish"
      >
        <Text style={styles.primaryButtonText}>Finish</Text>
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
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  categoriesContainer: {
    paddingBottom: 16,
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: "#FFF0F5",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  categoryTextActive: {
    color: Colors.primary,
    fontWeight: "600" as const,
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
