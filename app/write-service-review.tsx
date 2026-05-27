import { safeBack } from "@/constants/navigation";
import { ChevronLeft, CheckCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import StarRating from "@/components/StarRating";
import { checkServiceReviewEligibility, submitServiceReview, fetchServiceListingById } from "@/lib/serviceApi";
import type { DbServiceReview } from "@/lib/serviceTypes";

const MAX_COMMENT_LENGTH = 500;

export default function WriteServiceReviewScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [existingReview, setExistingReview] = useState<DbServiceReview | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (listingId) loadData();
  }, [listingId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listingData, eligibilityData] = await Promise.all([
        fetchServiceListingById(listingId!),
        checkServiceReviewEligibility(listingId!),
      ]);
      setServiceName(listingData?.name || "Service");
      setEligible(eligibilityData.eligible);
      if (eligibilityData.existing_review) {
        setExistingReview(eligibilityData.existing_review);
        setRating(eligibilityData.existing_review.rating);
        setComment(eligibilityData.existing_review.comment || "");
      }
    } catch (err) {
      setError("Failed to load review data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please select a star rating"); return; }
    setError("");
    setSubmitting(true);
    try {
      await submitServiceReview(listingId!, rating, comment.trim() || undefined);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack(`/service-detail?id=${listingId}`)} style={styles.backBtn}><ChevronLeft size={24} color={Colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{existingReview ? "Edit Review" : "Write a Review"}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.serviceName}>{serviceName}</Text>
        {!eligible ? (
          <View style={styles.ineligible}><Text style={styles.ineligibleText}>You need a confirmed booking for this service before you can leave a review.</Text></View>
        ) : (
          <>
            <Text style={styles.label}>Your Rating</Text>
            <View style={styles.ratingContainer}><StarRating rating={rating} onRatingChange={setRating} size={36} /></View>
            <Text style={styles.label}>Your Review (optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.textInput} placeholder="Share your experience..." placeholderTextColor={Colors.textTertiary} multiline maxLength={MAX_COMMENT_LENGTH} value={comment} onChangeText={setComment} textAlignVertical="top" />
              <Text style={styles.charCount}>{comment.length}/{MAX_COMMENT_LENGTH}</Text>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.submitButtonText}>{existingReview ? "Update Review" : "Submit Review"}</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}><CheckCircle size={48} color={Colors.primary} /></View>
            <Text style={styles.modalTitle}>{existingReview ? "Review Updated" : "Review Submitted"}</Text>
            <Text style={styles.modalMessage}>Thank you for sharing your experience!</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => { setShowSuccess(false); safeBack(`/service-detail?id=${listingId}`); }}>
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  content: { padding: 20 },
  serviceName: { fontSize: 16, fontWeight: "600", color: Colors.text, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  ratingContainer: { marginBottom: 24, alignItems: "center" },
  inputContainer: { backgroundColor: Colors.inputBackground, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 12, padding: 14, marginBottom: 16, minHeight: 120 },
  textInput: { fontSize: 15, color: Colors.text, flex: 1, minHeight: 80 },
  charCount: { fontSize: 12, color: Colors.textTertiary, textAlign: "right", marginTop: 8 },
  errorText: { fontSize: 13, color: Colors.error, marginBottom: 16, textAlign: "center" },
  submitButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  submitButtonText: { fontSize: 16, fontWeight: "700", color: Colors.white },
  ineligible: { backgroundColor: Colors.surface, padding: 20, borderRadius: 12, alignItems: "center" },
  ineligibleText: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  modalCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 32, alignItems: "center", width: "100%" },
  modalIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  modalMessage: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", marginBottom: 24 },
  modalButton: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 48, borderRadius: 12, width: "100%", alignItems: "center" },
  modalButtonText: { fontSize: 16, fontWeight: "700", color: Colors.white },
});
