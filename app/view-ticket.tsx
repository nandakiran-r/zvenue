import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { EVENTS } from "@/mocks/events";

export default function ViewTicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const event = EVENTS.find((e) => e.id === id) ?? EVENTS[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack("/(tabs)/home")} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View Ticket</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.ticketContainer}>
        <View style={styles.ticketTop}>
          <Text style={styles.scanTitle}>Scan This QR</Text>
          <Text style={styles.scanSubtitle}>point this qr to the scan place</Text>

          <View style={styles.qrContainer}>
            <View style={styles.qrCode}>
              {Array.from({ length: 8 }).map((_, row) => (
                <View key={row} style={styles.qrRow}>
                  {Array.from({ length: 8 }).map((__, col) => {
                    const isFilled = (row + col) % 3 !== 0 || (row * col) % 5 === 0;
                    const isPink = row >= 3 && row <= 4;
                    return (
                      <View
                        key={col}
                        style={[
                          styles.qrBlock,
                          isFilled && styles.qrBlockFilled,
                          isPink && isFilled && styles.qrBlockPink,
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.ticketDivider}>
          <View style={styles.dividerCircleLeft} />
          <View style={styles.dashedLine}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={styles.dash} />
            ))}
          </View>
          <View style={styles.dividerCircleRight} />
        </View>

        <View style={styles.ticketBottom}>
          <Text style={styles.eventName}>{event.title.toUpperCase().slice(0, 20)}</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>Esmeralda</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Hour</Text>
              <Text style={styles.detailValue}>10:00 AM</Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>27 Dec 2022</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Seat</Text>
              <Text style={styles.detailValue}>A1 , A2</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
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
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  ticketContainer: {
    margin: 20,
    backgroundColor: Colors.white,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  ticketTop: {
    padding: 24,
    alignItems: "center",
  },
  scanTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  scanSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  qrCode: {
    width: 160,
    height: 160,
    gap: 2,
  },
  qrRow: {
    flexDirection: "row",
    flex: 1,
    gap: 2,
  },
  qrBlock: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: Colors.surface,
  },
  qrBlockFilled: {
    backgroundColor: Colors.text,
  },
  qrBlockPink: {
    backgroundColor: Colors.primary,
  },
  ticketDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 0,
  },
  dividerCircleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginLeft: -12,
  },
  dashedLine: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  dash: {
    width: 8,
    height: 1.5,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  dividerCircleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginRight: -12,
  },
  ticketBottom: {
    padding: 24,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
});
