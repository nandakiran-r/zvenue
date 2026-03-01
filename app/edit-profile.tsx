import { router } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { Calendar, Camera, ChevronLeft, Mail, Phone, User } from "lucide-react-native";
import React, { useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { PROFILE_IMAGES } from "@/mocks/events";

export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const [name, setName] = useState("Tanya Hill");
    const [email, setEmail] = useState("tanya.hill@example.com");
    const [phone, setPhone] = useState("+1 234 567 8900");
    const [dob, setDob] = useState("12 April 1995");

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack("/(tabs)/home")} style={styles.backButton}>
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
                            <Image source={{ uri: PROFILE_IMAGES[0] }} style={styles.profileImage} />
                            <TouchableOpacity style={styles.cameraButton} activeOpacity={0.8}>
                                <Camera size={20} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputContainer}>
                                <User size={20} color={Colors.textSecondary} />
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your name"
                                    placeholderTextColor={Colors.textTertiary}
                                />
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
                            <View style={styles.inputContainer}>
                                <Phone size={20} color={Colors.textSecondary} />
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Enter your phone number"
                                    placeholderTextColor={Colors.textTertiary}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Date of Birth</Text>
                            <View style={styles.inputContainer}>
                                <Calendar size={20} color={Colors.textSecondary} />
                                <TextInput
                                    style={styles.input}
                                    value={dob}
                                    onChangeText={setDob}
                                    placeholder="Enter your date of birth"
                                    placeholderTextColor={Colors.textTertiary}
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={() => safeBack("/(tabs)/home")}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
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
    input: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
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
