import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { Calendar, ChevronLeft, Clock, Heart, MapPin, MessageCircle, Star, Users, Wifi, Wind, Car, Utensils, Music, Tv } from "lucide-react-native";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { VENUES } from "@/mocks/venues";
import { useFavorites } from "@/context/FavoritesContext";

const AMENITY_ICONS: Record<string, any> = {
    'AC': Wind,
    'Parking': Car,
    'Catering': Utensils,
    'DJ Setup': Music,
    'Wi-Fi': Wifi,
    'Projector': Tv,
};

export default function VenueDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const venue = VENUES.find((v) => v.id === id) ?? VENUES[0];
    const { isFavorite, toggleFavorite } = useFavorites();
    const isFav = isFavorite(venue.id);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: venue.image }} style={styles.heroImage} />
                    <View style={[styles.imageOverlay, { paddingTop: insets.top }]}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => safeBack("/(tabs)/home")}>
                            <ChevronLeft size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={() => toggleFavorite(venue.id)}>
                            <Heart size={22} color={isFav ? Colors.primary : Colors.white} fill={isFav ? Colors.primary : "none"} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{venue.category}</Text>
                    </View>
                </View>

                <View style={styles.contentCard}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleInfo}>
                            <Text style={styles.title}>{venue.name}</Text>
                            <View style={styles.metaRow}>
                                <MapPin size={14} color={Colors.textSecondary} />
                                <Text style={styles.metaText}>{venue.location}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <Star size={14} color="#FFB800" fill="#FFB800" />
                                <Text style={styles.metaText}>{venue.rating} ({venue.reviewCount} reviews)</Text>
                            </View>
                        </View>
                        <View style={styles.pricingBlock}>
                            <Text style={styles.price}>{venue.pricePerHour}</Text>
                            <Text style={styles.priceLabel}>/hour</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Users size={18} color={Colors.primary} />
                            <Text style={styles.statValue}>{venue.capacity}</Text>
                            <Text style={styles.statLabel}>Capacity</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <MaterialIcons name="square-foot" size={18} color={Colors.primary} />
                            <Text style={styles.statValue}>{venue.area}</Text>
                            <Text style={styles.statLabel}>Area</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Clock size={18} color={Colors.primary} />
                            <Text style={styles.statValue}>{venue.pricePerDay}</Text>
                            <Text style={styles.statLabel}>Per Day</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About This Venue</Text>
                    <Text style={styles.description}>{venue.description}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Amenities</Text>
                    <View style={styles.amenitiesWrap}>
                        {venue.amenities.map((amenity, i) => {
                            const Icon = AMENITY_ICONS[amenity];
                            return (
                                <View key={i} style={styles.amenityChip}>
                                    {Icon ? <Icon size={14} color={Colors.primary} /> : <MaterialIcons name="check-circle" size={14} color={Colors.primary} />}
                                    <Text style={styles.amenityText}>{amenity}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Venue Owner</Text>
                    <View style={styles.ownerRow}>
                        <Image source={{ uri: venue.ownerImage }} style={styles.ownerAvatar} />
                        <View style={styles.ownerInfo}>
                            <Text style={styles.ownerLabel}>Owner / Manager</Text>
                            <Text style={styles.ownerName}>{venue.ownerName}</Text>
                        </View>
                        <TouchableOpacity style={styles.chatButton}>
                            <MessageCircle size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Available Dates</Text>
                    <View style={styles.datesRow}>
                        {venue.availableDates.map((date, i) => (
                            <View key={i} style={styles.dateChip}>
                                <Calendar size={13} color={Colors.primary} />
                                <Text style={styles.dateText}>{date}</Text>
                            </View>
                        ))}
                    </View>
                </View>


            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => router.push({ pathname: "/booking-detail", params: { id: venue.id } })}
                    activeOpacity={0.8}
                    testID="book-venue"
                >
                    <Text style={styles.bookButtonText}>Book This Venue</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    imageContainer: {
        height: 280,
        position: "relative",
    },
    heroImage: {
        width: "100%",
        height: "100%",
    },
    imageOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    categoryBadge: {
        position: "absolute",
        bottom: 16,
        left: 20,
        backgroundColor: Colors.primary,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    categoryBadgeText: {
        fontSize: 12,
        color: Colors.white,
        fontWeight: "700" as const,
    },
    contentCard: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
    },
    titleInfo: {
        flex: 1,
        marginRight: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 8,
        lineHeight: 28,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    metaText: {
        fontSize: 13,
        color: Colors.textSecondary,
        flexShrink: 1,
    },
    pricingBlock: {
        alignItems: "flex-end",
    },
    price: {
        fontSize: 22,
        fontWeight: "800" as const,
        color: Colors.primary,
    },
    priceLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surface,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    statValue: {
        fontSize: 13,
        fontWeight: "700" as const,
        color: Colors.text,
        textAlign: "center",
    },
    statLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: Colors.border,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    amenitiesWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    amenityChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#FFF0F5",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.primaryLight,
    },
    amenityText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: "500" as const,
    },
    ownerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    ownerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    ownerInfo: {
        flex: 1,
        marginLeft: 4,
    },
    ownerLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    ownerName: {
        fontSize: 15,
        fontWeight: "600" as const,
        color: Colors.text,
    },
    chatButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    datesRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    dateChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dateText: {
        fontSize: 13,
        color: Colors.text,
        fontWeight: "500" as const,
    },

    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    bookButton: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: "center",
    },
    bookButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "700" as const,
    },
});
