import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import React from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Colors from "@/constants/colors";

export default function BookingConfirmedScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <Modal animationType="fade" transparent visible onRequestClose={() => router.back()}>
            <Pressable style={styles.overlay} onPress={() => { }}>
                <View style={styles.card}>
                    <View style={styles.checkCircle}>
                        <Check size={32} color={Colors.white} strokeWidth={3} />
                    </View>
                    <Text style={styles.title}>Booking Confirmed!</Text>
                    <Text style={styles.subtitle}>
                        Your venue has been successfully{"\n"}booked. Get ready for{"\n"}an amazing event!
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace({ pathname: "/view-booking", params: { id: id ?? "1" } })}
                        activeOpacity={0.8}
                        testID="view-booking"
                    >
                        <Text style={styles.primaryButtonText}>View Booking</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={() => router.replace("/(tabs)/home")}
                        activeOpacity={0.7}
                        testID="go-home"
                    >
                        <Text style={styles.outlineButtonText}>Go to Home</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 32,
        marginHorizontal: 32,
        alignItems: "center",
        width: "85%",
    },
    checkCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.success,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "700" as const,
        color: Colors.text,
        textAlign: "center",
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 28,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        width: "100%",
        marginBottom: 12,
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "700" as const,
    },
    outlineButton: {
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        width: "100%",
    },
    outlineButtonText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: "700" as const,
    },
});
