import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { Camera, ChevronLeft, ImageIcon, Mail, Phone, User, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { updateUser, fetchUser } from "@/lib/api";

export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const { dbUser, userId, refreshProfile } = useAuth();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [imageSheetVisible, setImageSheetVisible] = useState(false);
    const sheetAnim = useRef(new Animated.Value(0)).current;
    const { success, error: showError, warning, showAlert } = useToast();

    // Validation errors
    const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({});

    // Fetch fresh profile data from DB on mount
    const loadProfile = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const freshUser = await fetchUser(userId);
            if (freshUser) {
                setFirstName(freshUser.first_name ?? "");
                setLastName(freshUser.last_name ?? "");
                setEmail(freshUser.email ?? "");
                setPhoneNumber(freshUser.phone_number ?? "");
                setAvatarUrl(freshUser.avatar_url ?? null);
            }
        } catch (err) {
            // Fallback to cached data from auth store
            if (dbUser) {
                setFirstName(dbUser.first_name ?? "");
                setLastName(dbUser.last_name ?? "");
                setEmail(dbUser.email ?? "");
                setPhoneNumber(dbUser.phone_number ?? "");
                setAvatarUrl(dbUser.avatar_url ?? null);
            }
        } finally {
            setLoading(false);
        }
    }, [userId, dbUser]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // Validation logic
    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!firstName.trim()) {
            newErrors.firstName = "First name is required";
        } else if (firstName.trim().length < 2) {
            newErrors.firstName = "Must be at least 2 characters";
        }

        if (!lastName.trim()) {
            newErrors.lastName = "Last name is required";
        } else if (lastName.trim().length < 1) {
            newErrors.lastName = "Must be at least 1 character";
        }

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                newErrors.email = "Enter a valid email address";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Clear individual field error on change
    const handleFirstNameChange = (text: string) => {
        setFirstName(text);
        if (errors.firstName) setErrors(prev => ({ ...prev, firstName: undefined }));
    };

    const handleLastNameChange = (text: string) => {
        setLastName(text);
        if (errors.lastName) setErrors(prev => ({ ...prev, lastName: undefined }));
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
        if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            warning("Permission Required", "Please allow access to your gallery to set a profile picture.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            if (asset.base64) {
                const mimeType = asset.mimeType || "image/jpeg";
                const dataUri = `data:${mimeType};base64,${asset.base64}`;
                setAvatarUrl(dataUri);
            } else if (asset.uri) {
                setAvatarUrl(asset.uri);
            }
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            warning("Permission Required", "Please allow camera access to take a profile picture.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            if (asset.base64) {
                const mimeType = asset.mimeType || "image/jpeg";
                const dataUri = `data:${mimeType};base64,${asset.base64}`;
                setAvatarUrl(dataUri);
            } else if (asset.uri) {
                setAvatarUrl(asset.uri);
            }
        }
    };

    const openImageSheet = () => {
        setImageSheetVisible(true);
        Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 12 }).start();
    };

    const closeImageSheet = () => {
        Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setImageSheetVisible(false);
        });
    };

    const handleImagePress = () => {
        openImageSheet();
    };

    const handleSave = async () => {
        if (!userId || saving) return;

        // Run validation
        if (!validate()) return;

        try {
            setSaving(true);
            await updateUser(userId, {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
                email: email.trim(),
                avatar_url: avatarUrl,
            });
            await refreshProfile();
            showAlert({
                type: "success",
                title: "Success",
                message: "Profile updated successfully!",
                actions: [{ text: "OK", style: "default", onPress: () => safeBack("/(tabs)/profile") }],
            });
        } catch (err: any) {
            console.error("Failed to save profile:", err);
            const msg = err.response?.data?.error || "Failed to save profile. Please try again.";
            showError("Error", msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack("/(tabs)/profile")} style={styles.backButton}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={styles.placeholder} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.flex}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.imageSection}>
                        <View style={styles.imageWrapper}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
                            ) : (
                                <View style={[styles.profileImage, styles.profilePlaceholder]}>
                                    <User size={40} color={Colors.textSecondary} />
                                </View>
                            )}
                            <TouchableOpacity style={styles.cameraButton} activeOpacity={0.8} onPress={handleImagePress}>
                                <Camera size={20} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.changePhotoText}>Tap camera to change photo</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>First Name</Text>
                                <View style={[styles.inputContainer, errors.firstName ? styles.inputError : null]}>
                                    <User size={18} color={errors.firstName ? Colors.error : Colors.textSecondary} />
                                    <TextInput
                                        style={styles.input}
                                        value={firstName}
                                        onChangeText={handleFirstNameChange}
                                        placeholder="First name"
                                        placeholderTextColor={Colors.textTertiary}
                                        autoCapitalize="words"
                                    />
                                </View>
                                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Last Name</Text>
                                <View style={[styles.inputContainer, errors.lastName ? styles.inputError : null]}>
                                    <User size={18} color={errors.lastName ? Colors.error : Colors.textSecondary} />
                                    <TextInput
                                        style={styles.input}
                                        value={lastName}
                                        onChangeText={handleLastNameChange}
                                        placeholder="Last name"
                                        placeholderTextColor={Colors.textTertiary}
                                        autoCapitalize="words"
                                    />
                                </View>
                                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
                                <Mail size={20} color={errors.email ? Colors.error : Colors.textSecondary} />
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={handleEmailChange}
                                    placeholder="Enter your email"
                                    placeholderTextColor={Colors.textTertiary}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={[styles.inputContainer, styles.inputDisabled]}>
                                <Phone size={20} color={Colors.textSecondary} />
                                <TextInput
                                    style={[styles.input, { color: Colors.textSecondary }]}
                                    value={phoneNumber}
                                    editable={false}
                                    placeholder="Phone number"
                                    placeholderTextColor={Colors.textTertiary}
                                />
                            </View>
                            <Text style={styles.hintText}>Phone number cannot be changed</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        activeOpacity={0.8}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
                )}
            </KeyboardAvoidingView>

            {/* Profile Picture Bottom Sheet */}
            <Modal visible={imageSheetVisible} transparent animationType="none" onRequestClose={closeImageSheet}>
                <Pressable style={styles.sheetOverlay} onPress={closeImageSheet}>
                    <Animated.View
                        style={[
                            styles.sheetContainer,
                            {
                                transform: [{
                                    translateY: sheetAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [300, 0],
                                    }),
                                }],
                                opacity: sheetAnim,
                            },
                        ]}
                    >
                        {/* Handle indicator */}
                        <View style={styles.sheetHandle} />

                        {/* Title */}
                        <Text style={styles.sheetTitle}>Profile Picture</Text>
                        <Text style={styles.sheetMessage}>
                            Choose how you'd like to update your profile photo
                        </Text>

                        {/* Take Photo Button */}
                        <TouchableOpacity
                            style={styles.sheetButtonPrimary}
                            onPress={() => { closeImageSheet(); setTimeout(handleTakePhoto, 300); }}
                            activeOpacity={0.8}
                        >
                            <Camera size={18} color={Colors.white} />
                            <Text style={styles.sheetButtonPrimaryText}>Take Photo</Text>
                        </TouchableOpacity>

                        {/* Choose from Gallery Button */}
                        <TouchableOpacity
                            style={styles.sheetButtonOutline}
                            onPress={() => { closeImageSheet(); setTimeout(handlePickImage, 300); }}
                            activeOpacity={0.8}
                        >
                            <ImageIcon size={18} color={Colors.text} />
                            <Text style={styles.sheetButtonOutlineText}>Choose from Gallery</Text>
                        </TouchableOpacity>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            style={styles.sheetButtonCancel}
                            onPress={closeImageSheet}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.sheetButtonCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    placeholder: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    imageSection: {
        alignItems: "center",
        marginVertical: 32,
    },
    imageWrapper: {
        position: "relative",
    },
    profileImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
    },
    profilePlaceholder: {
        backgroundColor: Colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    cameraButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: Colors.white,
    },
    changePhotoText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 10,
    },
    form: {
        gap: 20,
        marginBottom: 32,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.text,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: Colors.white,
        gap: 12,
    },
    inputDisabled: {
        backgroundColor: Colors.surface,
        opacity: 0.7,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
    },
    hintText: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    errorText: {
        fontSize: 11,
        color: Colors.error,
        marginLeft: 4,
        marginTop: 2,
    },
    inputError: {
        borderColor: Colors.error,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: "center",
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "700" as const,
    },
    // Bottom Sheet Styles
    sheetOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    sheetContainer: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 40,
        alignItems: "center",
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
        marginBottom: 24,
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: "700" as const,
        color: Colors.text,
        textAlign: "center",
        marginBottom: 8,
    },
    sheetMessage: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 28,
        paddingHorizontal: 16,
    },
    sheetButtonPrimary: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 50,
        marginBottom: 14,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    sheetButtonPrimaryText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "700" as const,
    },
    sheetButtonOutline: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        backgroundColor: Colors.white,
        paddingVertical: 18,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: Colors.text,
        marginBottom: 14,
    },
    sheetButtonOutlineText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: "600" as const,
    },
    sheetButtonCancel: {
        width: "100%",
        paddingVertical: 14,
        alignItems: "center",
    },
    sheetButtonCancelText: {
        color: Colors.textSecondary,
        fontSize: 15,
        fontWeight: "500" as const,
    },
});
