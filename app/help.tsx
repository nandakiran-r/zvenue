import { safeBack } from "@/constants/navigation";
import { ChevronLeft, Mail, Phone, MessageCircle, ExternalLink } from "lucide-react-native";
import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const FAQ = [
    { q: "How do I book a venue?", a: "Browse venues from the home screen, select one, pick a date and time, then confirm and pay." },
    { q: "Can I cancel a booking?", a: "Contact our support team via WhatsApp or email for cancellation requests." },
    { q: "What are subscriber benefits?", a: "Subscribers get free perks like parking, welcome drinks, and discounts at partner venues for ₹49/month." },
    { q: "How do I get a refund?", a: "Refunds are processed within 5-7 business days after cancellation approval." },
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
                    <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('mailto:support@zvenue.com')}>
                        <Mail size={24} color={Colors.primary} />
                        <Text style={styles.contactLabel}>Email</Text>
                        <Text style={styles.contactValue}>support@zvenue.com</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('tel:+918547475710')}>
                        <Phone size={24} color={Colors.primary} />
                        <Text style={styles.contactLabel}>Phone</Text>
                        <Text style={styles.contactValue}>+91 85474 75710</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.whatsappBtn} onPress={() => Linking.openURL('https://wa.me/918547475710?text=Hi, I need help with ZVenue')}>
                    <MessageCircle size={20} color={Colors.white} />
                    <Text style={styles.whatsappText}>Chat on WhatsApp</Text>
                </TouchableOpacity>

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
    whatsappBtn: { backgroundColor: "#25D366", borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
    whatsappText: { color: Colors.white, fontSize: 15, fontWeight: "700" },
    faqItem: { marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 12, padding: 16 },
    faqQ: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 6 },
    faqA: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
