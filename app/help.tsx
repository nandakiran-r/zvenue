import { safeBack } from "@/constants/navigation";
import { ChevronLeft, Mail, Phone } from "lucide-react-native";
import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const FAQ = [
    { q: "How do I book a venue?", a: "Browse venues from the home screen, select one, pick a date and time, then confirm and pay." },
    { q: "Can I cancel a booking?", a: "Contact our support team via phone or email for cancellation requests. We provide free rescheduling." },
    { q: "What are subscriber benefits?", a: "Subscribers get free perks like parking, welcome drinks, and discounts at partner venues. Plans start from ₹9/month." },
    { q: "How do I get a refund?", a: "We do not provide refunds. However, free rescheduling is available for all bookings." },
];

export default function HelpScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack("/(tabs)/home")} style={styles.backBtn}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Contact Us</Text>
                <View style={styles.contactRow}>
                    <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('mailto:support.zvenue@gmail.com')}>
                        <Mail size={24} color={Colors.primary} />
                        <Text style={styles.contactLabel}>Email</Text>
                        <Text style={styles.contactValue}>support.zvenue@gmail.com</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('tel:+917249111100')}>
                        <Phone size={24} color={Colors.primary} />
                        <Text style={styles.contactLabel}>Phone</Text>
                        <Text style={styles.contactValue}>+91 7249111100</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Frequently Asked Questions</Text>
                {FAQ.map((item, i) => (
                    <View key={i} style={styles.faqItem}>
                        <Text style={styles.faqQ}>{item.q}</Text>
                        <Text style={styles.faqA}>{item.a}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
    content: { padding: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
    contactRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
    contactCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, alignItems: "center", gap: 8, borderWidth: 1, borderColor: Colors.border },
    contactLabel: { fontSize: 12, color: Colors.textSecondary },
    contactValue: { fontSize: 13, fontWeight: "600", color: Colors.text, textAlign: "center" },
    faqItem: { marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 12, padding: 16 },
    faqQ: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 6 },
    faqA: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
