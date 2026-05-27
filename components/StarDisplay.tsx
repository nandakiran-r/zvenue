import React from "react";
import { StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";
import Colors from "@/constants/colors";

interface StarDisplayProps {
  rating: number;
  size?: number;
  color?: string;
}

export default function StarDisplay({ rating, size = 14, color = Colors.primary }: StarDisplayProps) {
  return (
    <View style={styles.container} accessibilityLabel={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          color={color}
          fill={star <= Math.round(rating) ? color : "transparent"}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
