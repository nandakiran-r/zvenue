import { safeBack } from "@/constants/navigation";
import { ChevronLeft, Bell, Shield, Moon, Globe } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const [pushNotifications, setPushNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const push = await AsyncStorage.getItem("settings_push_notifications");
            const sms = await AsyncStorage.getItem("settings_sms_notifications");
            if (push !== null) setPushNotifications(push === "true");
            if (sms !== null) setSmsNotifications(sms === "true");
        } catch {}
    };

    const togglePush = async (value: boolean) => {
        setPushNotifications(value);
        await AsyncStorage.setItem("settings_push_notifications", String(value));
    };

    const toggleSms = async (value: boolean) => {
        setSmsNotifications(value);
        await AsyncStorage.setItem("settings_sms_notifications", String(value));
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack("/(tabs)/profile")} style={styles.backBtn}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Bell size={20} color={Colors.primary} />
                        <Text style={styles.settingLabel}>Push Notifications</Text>
                    </View>
                    <Switch value={pushNotifications} onValueChange={togglePush} trackColor={{ true: Colors.primary, false: '#ccc' }} thumbColor={pushNotifications ? '#FFFFFF' : '#f4f3f4'} ios_backgroundColor="#ccc" />
                </View>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Globe size={20} color={Colors.primary} />
                        <Text style={styles.settingLabel}>SMS Notifications</Text>
                    </View>
                    <Switch value={smsNotifications} onValueChange={toggleSms} trackColor={{ true: Colors.primary, false: '#ccc' }} thumbColor={smsNotifications ? '#FFFFFF' : '#f4f3f4'} ios_backgroundColor="#ccc" />
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Account</Text>
                <TouchableOpacity style={styles.settingRow} onPress={() => Linking.openURL("https://zvenue.com/privacy")}>
                    <View style={styles.settingInfo}>
                        <Shield size={20} color={Colors.primary} />
                        <Text style={styles.settingLabel}>Privacy Policy</Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Moon size={20} color={Colors.primary} />
                        <Text style={styles.settingLabel}>App Version</Text>
                    </View>
                    <Text style={styles.versionText}>1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
    content: { padding: 20 },
    sectionTitle: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
    settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    settingInfo: { flexDirection: "row", alignItems: "center", gap: 14 },
    settingLabel: { fontSize: 15, fontWeight: "500", color: Colors.text },
    versionText: { fontSize: 14, color: Colors.textSecondary },
});
