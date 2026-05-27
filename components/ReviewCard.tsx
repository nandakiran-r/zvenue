import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Cloud, User } from "lucide-react-native";
import Colors from "@/constants/colors";
import StarDisplay from "./StarDisplay";
import type { DbReview } from "@/lib/types";

interface ReviewCardProps {
  review: DbReview;
  isPending?: boolean;
  compact?: boolean;
  onPress?: (review: DbReview) => void;
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
}

export default function ReviewCard({ review, isPending = false, compact = false, onPress }: ReviewCardProps) {
  const comment = review.comment || "";
  const MAX_LINES = compact ? 3 : 100;

  const content = (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {review.user?.avatar_url ? (
            <Image source={{ uri: review.user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={16} color={Colors.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {review.user?.full_name || "Anonymous"}
          </Text>
          <View style={styles.ratingRow}>
            <StarDisplay rating={review.rating} size={12} />
            <Text style={styles.timestamp}>{getRelativeTime(review.created_at)}</Text>
          </View>
        </View>
        {isPending && (
          <View style={styles.pendingBadge}>
            <Cloud size={12} color={Colors.textSecondary} />
            <Text style={styles.pendingText}>Syncing</Text>
          </View>
        )}
      </View>
      {comment.length > 0 && (
        <View style={styles.commentContainer}>
          <Text style={styles.comment} numberOfLines={MAX_LINES}>
            {comment}
          </Text>
          {compact && comment.length > 120 && (
            <Text style={styles.readMore}>Tap to read more</Text>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(review)}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  compactContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderBottomWidth: 0,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  commentContainer: {
    marginTop: 8,
    marginLeft: 48,
  },
  comment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  readMore: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500",
    marginTop: 4,
  },
});
