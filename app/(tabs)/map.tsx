import { router } from "expo-router";
import {
  Minus,
  Navigation,
  Plus,
  Search as SearchIcon,
  Star,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { VENUES } from "@/mocks/venues";

// ─── Dummy map data ────────────────────────────────────────
const GRID_ROADS = {
  horizontal: [8, 18, 30, 42, 55, 67, 78, 88],   // % from top
  vertical: [6, 18, 32, 46, 60, 74, 85, 94],   // % from left
};

const MAJOR_ROAD_H = [30, 55];
const MAJOR_ROAD_V = [32, 60];

const BLOCKS = [
  { top: "9%", left: "7%", width: "10%", height: "8%", color: "#E8F4E8" },
  { top: "9%", left: "19%", width: "12%", height: "8%", color: "#FFF8E1" },
  { top: "9%", left: "33%", width: "12%", height: "8%", color: "#E3F2FD" },
  { top: "9%", left: "47%", width: "12%", height: "8%", color: "#FFF8E1" },
  { top: "9%", left: "61%", width: "12%", height: "8%", color: "#E8F4E8" },
  { top: "9%", left: "75%", width: "9%", height: "8%", color: "#E3F2FD" },

  { top: "19%", left: "7%", width: "10%", height: "10%", color: "#EDE7F6" },
  { top: "19%", left: "19%", width: "12%", height: "10%", color: "#E8F4E8" },
  { top: "19%", left: "33%", width: "12%", height: "10%", color: "#FFF3E0" },
  { top: "19%", left: "47%", width: "12%", height: "10%", color: "#E8F4E8" },
  { top: "19%", left: "61%", width: "12%", height: "10%", color: "#FFF8E1" },
  { top: "19%", left: "75%", width: "9%", height: "10%", color: "#EDE7F6" },

  { top: "31%", left: "7%", width: "10%", height: "11%", color: "#E3F2FD" },
  { top: "31%", left: "19%", width: "12%", height: "11%", color: "#FFF8E1" },
  { top: "31%", left: "47%", width: "12%", height: "11%", color: "#E8F4E8" },
  { top: "31%", left: "61%", width: "12%", height: "11%", color: "#EDE7F6" },
  { top: "31%", left: "75%", width: "9%", height: "11%", color: "#FFF3E0" },

  { top: "43%", left: "7%", width: "10%", height: "11%", color: "#FFF8E1" },
  { top: "43%", left: "19%", width: "12%", height: "11%", color: "#E8F4E8" },
  { top: "43%", left: "33%", width: "12%", height: "11%", color: "#EDE7F6" },
  { top: "43%", left: "47%", width: "12%", height: "11%", color: "#FFF3E0" },
  { top: "43%", left: "61%", width: "12%", height: "11%", color: "#E3F2FD" },
  { top: "43%", left: "75%", width: "9%", height: "11%", color: "#E8F4E8" },

  { top: "56%", left: "7%", width: "10%", height: "10%", color: "#E8F4E8" },
  { top: "56%", left: "19%", width: "12%", height: "10%", color: "#EDE7F6" },
  { top: "56%", left: "33%", width: "12%", height: "10%", color: "#FFF8E1" },
  { top: "56%", left: "47%", width: "12%", height: "10%", color: "#E3F2FD" },
  { top: "56%", left: "61%", width: "12%", height: "10%", color: "#FFF3E0" },
  { top: "56%", left: "75%", width: "9%", height: "10%", color: "#E8F4E8" },

  { top: "68%", left: "7%", width: "10%", height: "9%", color: "#FFF3E0" },
  { top: "68%", left: "19%", width: "12%", height: "9%", color: "#E3F2FD" },
  { top: "68%", left: "33%", width: "12%", height: "9%", color: "#E8F4E8" },
  { top: "68%", left: "47%", width: "12%", height: "9%", color: "#EDE7F6" },
  { top: "68%", left: "61%", width: "12%", height: "9%", color: "#FFF8E1" },
  { top: "68%", left: "75%", width: "9%", height: "9%", color: "#FFF3E0" },

  { top: "79%", left: "7%", width: "10%", height: "8%", color: "#E3F2FD" },
  { top: "79%", left: "19%", width: "12%", height: "8%", color: "#FFF8E1" },
  { top: "79%", left: "33%", width: "12%", height: "8%", color: "#EDE7F6" },
  { top: "79%", left: "47%", width: "12%", height: "8%", color: "#FFF3E0" },
  { top: "79%", left: "61%", width: "12%", height: "8%", color: "#E8F4E8" },
  { top: "79%", left: "75%", width: "9%", height: "8%", color: "#E3F2FD" },
];

// Green area (park)
const PARKS = [
  { top: "31%", left: "33%", width: "12%", height: "11%" },
];

const VENUE_PINS = [
  { id: "1", top: "22%", left: "20%", label: "Crystal Hall" },
  { id: "2", top: "36%", left: "49%", label: "Grand Ballroom" },
  { id: "3", top: "48%", left: "63%", label: "The Terrace" },
  { id: "4", top: "60%", left: "21%", label: "Heritage Palace" },
  { id: "5", top: "72%", left: "47%", label: "Sky Lounge" },
];

// ──────────────────────────────────────────────────────────

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [zoom, setZoom] = useState(1);
  const [activeVenue, setActiveVenue] = useState<string | null>(null);
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: panX, dy: panY }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => { }, // keep position after drag
    })
  ).current;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2.0));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.6));

  const selectedVenueData = VENUES.find((v) => v.id === activeVenue) ?? VENUES[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Map</Text>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues on map…"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
      </View>

      {/* ── Dummy Map ── */}
      <View style={styles.mapWrapper}>
        <Animated.View
          style={[
            styles.mapCanvas,
            {
              transform: [
                { translateX: panX },
                { translateY: panY },
                { scale: zoom },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Background */}
          <View style={styles.mapBg} />

          {/* Building blocks */}
          {BLOCKS.map((b, i) => (
            <View
              key={i}
              style={[
                styles.block,
                { top: b.top, left: b.left, width: b.width, height: b.height, backgroundColor: b.color },
              ]}
            />
          ))}

          {/* Parks */}
          {PARKS.map((p, i) => (
            <View
              key={`park-${i}`}
              style={[styles.park, { top: p.top, left: p.left, width: p.width, height: p.height }]}
            />
          ))}

          {/* Minor horizontal roads */}
          {GRID_ROADS.horizontal.map((pct, i) => {
            const isMajor = MAJOR_ROAD_H.includes(pct);
            return (
              <View
                key={`h${i}`}
                style={[
                  styles.roadH,
                  {
                    top: `${pct}%`,
                    height: isMajor ? 6 : 3,
                    backgroundColor: isMajor ? "#D8CFC4" : "#E6E0D8",
                  },
                ]}
              />
            );
          })}

          {/* Minor vertical roads */}
          {GRID_ROADS.vertical.map((pct, i) => {
            const isMajor = MAJOR_ROAD_V.includes(pct);
            return (
              <View
                key={`v${i}`}
                style={[
                  styles.roadV,
                  {
                    left: `${pct}%`,
                    width: isMajor ? 6 : 3,
                    backgroundColor: isMajor ? "#D8CFC4" : "#E6E0D8",
                  },
                ]}
              />
            );
          })}

          {/* Road labels */}
          <Text style={[styles.roadLabel, { top: "28%", left: "8%" }]}>MG Road</Text>
          <Text style={[styles.roadLabel, { top: "53%", left: "8%" }]}>SG Highway</Text>
          <Text style={[styles.roadLabelV, { top: "12%", left: "30%" }]}>Ring Rd</Text>
          <Text style={[styles.roadLabelV, { top: "12%", left: "58%" }]}>CG Road</Text>

          {/* Venue pins */}
          {VENUE_PINS.map((pin) => (
            <TouchableOpacity
              key={pin.id}
              style={[styles.pinWrapper, { top: pin.top, left: pin.left }]}
              onPress={() => setActiveVenue(pin.id === activeVenue ? null : pin.id)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.pin,
                  activeVenue === pin.id && styles.pinActive,
                ]}
              >
                <Text style={styles.pinIcon}>🏛</Text>
              </View>
              <View style={styles.pinTip} />
              {activeVenue === pin.id && (
                <View style={styles.pinLabel}>
                  <Text style={styles.pinLabelText}>{pin.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* User location dot */}
          <View style={[styles.userDot, { top: "44%", left: "35%" }]}>
            <View style={styles.userDotInner} />
            <View style={styles.userDotRing} />
          </View>
        </Animated.View>

        {/* ── Map controls ── */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={handleZoomIn}>
            <Plus size={18} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.controlDivider} />
          <TouchableOpacity style={styles.controlBtn} onPress={handleZoomOut}>
            <Minus size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Locate me */}
        <TouchableOpacity
          style={styles.locateMeBtn}
          onPress={() => {
            panX.setValue(0);
            panY.setValue(0);
            setZoom(1);
          }}
        >
          <Navigation size={18} color={Colors.primary} />
        </TouchableOpacity>

        {/* Map attribution */}
        <Text style={styles.attribution}>© ZVenue Maps (Demo)</Text>
      </View>

      {/* ── Bottom venue card ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardScroll}
        style={styles.cardScrollWrapper}
      >
        {VENUES.slice(0, 5).map((venue) => (
          <TouchableOpacity
            key={venue.id}
            style={[
              styles.venueCard,
              activeVenue === venue.id && styles.venueCardActive,
            ]}
            onPress={() => {
              setActiveVenue(venue.id);
              router.push({ pathname: "/venue-detail", params: { id: venue.id } });
            }}
            activeOpacity={0.85}
          >
            <View style={styles.venueCardLeft}>
              <Text style={styles.venueCardName} numberOfLines={1}>
                {venue.name}
              </Text>
              <Text style={styles.venueCardCity} numberOfLines={1}>
                {venue.city}
              </Text>
              <View style={styles.venueCardFooter}>
                <Star size={11} color="#FFB800" fill="#FFB800" />
                <Text style={styles.venueCardRating}>{venue.rating}</Text>
                <Text style={styles.venueCardPrice}>{venue.pricePerDay}</Text>
              </View>
            </View>
            <View
              style={[
                styles.venueCardTag,
                activeVenue === venue.id && styles.venueCardTagActive,
              ]}
            >
              <Text
                style={[
                  styles.venueCardTagText,
                  activeVenue === venue.id && styles.venueCardTagTextActive,
                ]}
              >
                {venue.category}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },

  // ── Map canvas ──
  mapWrapper: {
    flex: 1,
    backgroundColor: "#F0ECE4",
    overflow: "hidden",
    position: "relative",
  },
  mapCanvas: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
  },
  mapBg: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#F0ECE4",
  },
  block: {
    position: "absolute",
    borderRadius: 3,
  },
  park: {
    position: "absolute",
    backgroundColor: "#C8E6C9",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  roadH: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  roadV: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  roadLabel: {
    position: "absolute",
    fontSize: 9,
    color: "#888",
    fontWeight: "600" as const,
    backgroundColor: "rgba(240,236,228,0.85)",
    paddingHorizontal: 3,
  },
  roadLabelV: {
    position: "absolute",
    fontSize: 9,
    color: "#888",
    fontWeight: "600" as const,
    backgroundColor: "rgba(240,236,228,0.85)",
    transform: [{ rotate: "90deg" }],
    paddingHorizontal: 3,
  },

  // ── Venue pins ──
  pinWrapper: {
    position: "absolute",
    alignItems: "center",
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.15 }],
  },
  pinIcon: {
    fontSize: 16,
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.primary,
    marginTop: -1,
  },
  pinLabel: {
    position: "absolute",
    top: -28,
    backgroundColor: Colors.text,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 90,
    alignItems: "center",
  },
  pinLabelText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: "600" as const,
  },

  // ── User dot ──
  userDot: {
    position: "absolute",
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  userDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2196F3",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userDotRing: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(33,150,243,0.2)",
    borderWidth: 1,
    borderColor: "rgba(33,150,243,0.4)",
  },

  // ── Map controls ──
  controls: {
    position: "absolute",
    right: 14,
    top: 14,
    backgroundColor: Colors.white,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  controlBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  controlDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  locateMeBtn: {
    position: "absolute",
    right: 14,
    top: 110,
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  attribution: {
    position: "absolute",
    bottom: 6,
    right: 8,
    fontSize: 9,
    color: "#999",
  },

  // ── Bottom cards ──
  cardScrollWrapper: {
    maxHeight: 90,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardScroll: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  venueCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 200,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  venueCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  venueCardLeft: {
    flex: 1,
  },
  venueCardName: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  venueCardCity: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  venueCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  venueCardRating: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: "600" as const,
    flex: 1,
  },
  venueCardPrice: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  venueCardTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.border,
    marginLeft: 8,
  },
  venueCardTagActive: {
    backgroundColor: Colors.primary,
  },
  venueCardTagText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  venueCardTagTextActive: {
    color: Colors.white,
  },
});
