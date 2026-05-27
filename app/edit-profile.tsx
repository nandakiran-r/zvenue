import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { Camera, ChevronLeft, Mail, Phone, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
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
import { updateUser } from "@/lib/api";

export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const { dbUser, userId, refreshProfile } = useAuth();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (dbUser) {
            setFirstName(dbUser.first_name ?? "");
            setLastName(dbUser.last_name ?? "");
            setEmail(dbUser.email ?? "");
            setPhoneNumber(dbUser.phone_number ?? "");
            setAvatarUrl(dbUser.avatar_url ?? null);
        }
    }, [dbUser]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission Required", "Please allow access to your photo library to upload a profile picture.");
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
            Alert.alert("Permission Required", "Please allow camera access to take a profile picture.");
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

    const handleImagePress = () => {
        Alert.alert("Profile Picture", "Choose an option", [
            { text: "Take Photo", onPress: handleTakePhoto },
            { text: "Choose from Library", onPress: handlePickImage },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const handleSave = async () => {
        if (!userId || saving) return;
        try {
            setSaving(true);
            await updateUser(userId, {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
                email: email.trim(),
                phone_number: phoneNumber.trim(),
                avatar_url: avatarUrl,
            });
            await refreshProfile();
            Alert.alert("Success", "Profile updated successfully!", [
                { text: "OK", onPress: () => safeBack("/(tabs)/profile") }
            ]);
        } catch (err: any) {
            console.error("Failed to save profile:", err);
            const msg = err.response?.data?.error || "Failed to save profile. Please try again.";
            Alert.alert("Error", msg);
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
                                <View style={styles.inputContainer}>
                                    <User size={18} color={Colors.textSecondary} />
                                    <TextInput
                                        style={styles.input}
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        placeholder="First name"
                                        placeholderTextColor={Colors.textTertiary}
                                    />
                                </View>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Last Name</Text>
                                <View style={styles.inputContainer}>
                                    <User size={18} color={Colors.textSecondary} />
                                    <TextInput
                                        style={styles.input}
                                        value={lastName}
                                        onChangeText={setLastName}
                                        placeholder="Last name"
                                        placeholderTextColor={Colors.textTertiary}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputContainer}>
                                <Mail size={20} color={Colors.textSecondary} />
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
                                    placeholderTextColor={Colors.textTertiary}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
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
                        <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Changes"}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
});
