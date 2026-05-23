import { safeBack } from "@/constants/navigation";
import { ChevronLeft, Bell, Shield, Moon, Globe } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const [pushNotifications, setPushNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(true);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack("/(tabs)/home")} style={styles.backBtn}>
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
                    <Switch value={pushNotifications} onValueChange={setPushNotifications} trackColor={{ true: Colors.primary }} />
                </View>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Globe size={20} color={Colors.primary} />
                        <Text style={styles.settingLabel}>SMS Notifications</Text>
                    </View>
                    <Switch value={smsNotifications} onValueChange={setSmsNotifications} trackColor={{ true: Colors.primary }} />
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Account</Text>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Shield size={20} color={Colors.primary} />
                        <Text style={styles.settingLabel}>Privacy Policy</Text>
                    </View>
                </View>
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
    container: { flex: 1, backgroundColor: Colors.white },
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
