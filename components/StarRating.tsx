import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Star } from "lucide-react-native";
import Colors from "@/constants/colors";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
}

export default function StarRating({ rating, onRatingChange, size = 32 }: StarRatingProps) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRatingChange(star)}
          style={styles.starButton}
          accessibilityLabel={`Rate ${star} star${star > 1 ? "s" : ""}`}
          accessibilityRole="button"
        >
          <Star
            size={size}
            color={Colors.primary}
            fill={star <= rating ? Colors.primary : "transparent"}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  starButton: {
    padding: 4,
  },
});
