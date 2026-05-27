import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "@/constants/navigation";
import { Calendar, ChevronLeft, Clock, Crown, Heart, MapPin, MessageCircle, Star, Users, Wifi, Wind, Car, Utensils, Music, Tv } from "lucide-react-native";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { fetchVenueById } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { VenueMap } from "@/components/VenueMap";
import type { DbVenue } from "@/lib/types";

const AMENITY_ICONS: Record<string, any> = {
    'AC': Wind,
    'Parking': Car,
    'Catering': Utensils,
    'DJ Setup': Music,
    'Wi-Fi': Wifi,
    'WiFi': Wifi,
    'Projector': Tv,
};

export default function VenueDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    
    const { isFavorite, toggleFavorite } = useFavorites();
    const { isSubscribed } = useAuth();

    const [venue, setVenue] = useState<DbVenue | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showSubscribePrompt, setShowSubscribePrompt] = useState(false);
    const flatListRef = React.useRef<FlatList>(null);

    useEffect(() => {
        if (!id) return;
        loadVenue();
    }, [id]);

    // Auto-scroll images every 3 seconds
    useEffect(() => {
        const images = venue?.images?.length || (venue?.image_url ? 1 : 0);
        if (images <= 1) return;
        const interval = setInterval(() => {
            setActiveImageIndex((prev) => {
                const next = (prev + 1) % images;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [venue]);

    const loadVenue = async () => {
        if (!id) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await fetchVenueById(id);
            setVenue(data);
        } catch (err) {
            console.error("Failed to load venue:", err);
            setVenue(null);
        } finally {
            setLoading(false);
        }
    };

    // formatPrice is imported from @/lib/utils

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!venue) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ color: Colors.textSecondary }}>Venue not found</Text>
            </View>
        );
    }

    const isFav = isFavorite(venue.id);
    const amenities = venue.amenities ?? [];
    const availableDates = venue.available_dates ?? [];
    const venueImages = (venue.images && venue.images.length > 0) ? venue.images : (venue.image_url ? [venue.image_url] : []);
    const screenWidth = Dimensions.get('window').width;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Image Gallery */}
                <View style={styles.imageContainer}>
                    {venueImages.length > 0 ? (
                        <FlatList
                            ref={flatListRef}
                            data={venueImages}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
                            keyExtractor={(_, i) => String(i)}
                            renderItem={({ item }) => (
                                <Image source={{ uri: item }} style={[styles.heroImage, { width: screenWidth }]} />
                            )}
                            getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
                        />
                    ) : (
                        <View style={[styles.heroImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ color: Colors.textSecondary }}>No images</Text>
                        </View>
                    )}
                    {venueImages.length > 1 && (
                        <View style={styles.imageDots}>
                            {venueImages.map((_, i) => (
                                <View key={i} style={[styles.imageDot, i === activeImageIndex && styles.imageDotActive]} />
                            ))}
                        </View>
                    )}
                    <View style={[styles.imageOverlay, { paddingTop: insets.top }]}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => safeBack("/(tabs)/home")}>
                            <ChevronLeft size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={() => toggleFavorite(venue.id)}>
                            <Heart size={22} color={isFav ? Colors.primary : Colors.white} fill={isFav ? Colors.primary : "none"} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.contentCard}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleInfo}>
                            <Text style={styles.title}>{venue.name ?? "Unnamed Venue"}</Text>
                            <View style={styles.metaRow}>
                                <MapPin size={14} color={Colors.textSecondary} />
                                <Text style={styles.metaText}>{venue.location ?? "Location not available"}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <Star size={14} color="#FFB800" fill="#FFB800" />
                                <Text style={styles.metaText}>{venue.rating ?? 0} ({venue.review_count ?? 0} reviews)</Text>
                            </View>
                        </View>
                        <View style={styles.pricingBlock}>
                            <Text style={styles.price}>{formatPrice(venue.price_per_hour)}</Text>
                            <Text style={styles.priceLabel}>/hour</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Users size={18} color={Colors.primary} />
                            <Text style={styles.statValue}>{venue.capacity ?? "N/A"}</Text>
                            <Text style={styles.statLabel}>Capacity</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <MaterialIcons name="square-foot" size={18} color={Colors.primary} />
                            <Text style={styles.statValue}>{venue.area ?? "N/A"}</Text>
                            <Text style={styles.statLabel}>Area</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Clock size={18} color={Colors.primary} />
                            <Text style={styles.statValue}>{formatPrice(venue.price_per_day)}</Text>
                            <Text style={styles.statLabel}>Per Day</Text>
                        </View>
                    </View>
                </View>

                {/* Map View */}
                {(venue as any).latitude && (venue as any).longitude && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Location</Text>
                        <VenueMap
                            latitude={(venue as any).latitude}
                            longitude={(venue as any).longitude}
                            name={venue.name}
                            height={180}
                        />
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About This Venue</Text>
                    <Text style={styles.description}>{venue.description}</Text>
                </View>

                {venue.youtube_url && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📹 Venue Video</Text>
                        <TouchableOpacity
                            style={{ backgroundColor: '#FFF0F5', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                            onPress={() => {
                                const { Linking } = require('react-native');
                                Linking.openURL(venue.youtube_url!);
                            }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF0000', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: '#fff', fontSize: 20 }}>▶</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>Watch Venue Tour</Text>
                                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Tap to open on YouTube</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Amenities</Text>
                    <View style={styles.amenitiesWrap}>
                        {amenities.map((amenity, i) => {
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

                {(venue.subscriber_benefits ?? []).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🎁 Subscriber Benefits</Text>
                        <View style={{ backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FFE082' }}>
                            {(venue.subscriber_benefits as string[]).map((benefit, i) => (
                                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i < (venue.subscriber_benefits as string[]).length - 1 ? 8 : 0 }}>
                                    <Text style={{ fontSize: 13, color: '#F57F17', marginRight: 8 }}>★</Text>
                                    <Text style={{ fontSize: 13, color: Colors.text, flex: 1 }}>{benefit}</Text>
                                </View>
                            ))}
                            <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 10, fontStyle: 'italic' }}>
                                Subscribe for ₹49/month to unlock these benefits with every booking
                            </Text>
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Venue Owner</Text>
                    <View style={styles.ownerRow}>
                        <Image source={{ uri: venue.owner_image ?? undefined }} style={styles.ownerAvatar} />
                        <View style={styles.ownerInfo}>
                            <Text style={styles.ownerLabel}>Owner / Manager</Text>
                            <Text style={styles.ownerName}>{venue.owner_name}</Text>
                        </View>
                    </View>
                </View>

                {availableDates.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Available Dates</Text>
                        <View style={styles.datesRow}>
                            {availableDates.map((date, i) => (
                                <View key={i} style={styles.dateChip}>
                                    <Calendar size={13} color={Colors.primary} />
                                    <Text style={styles.dateText}>{date}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => {
                        if (!isSubscribed) {
                            setShowSubscribePrompt(true);
                        } else {
                            router.push({ pathname: "/booking-detail", params: { id: venue.id } });
                        }
                    }}
                    activeOpacity={0.8}
                    testID="book-venue"
                >
                    <Text style={styles.bookButtonText}>Pre-Book This Venue</Text>
                </TouchableOpacity>
            </View>

            {/* Subscribe Prompt Modal */}
            <Modal visible={showSubscribePrompt} transparent animationType="fade" onRequestClose={() => setShowSubscribePrompt(false)}>
                <View style={styles.subscribeOverlay}>
                    <View style={styles.subscribeCard}>
                        <View style={styles.subscribeIconWrap}>
                            <Crown size={48} color="#F9A825" />
                        </View>
                        <Text style={styles.subscribeTitle}>Unlock Premium Benefits!</Text>
                        <Text style={styles.subscribeSubtitle}>
                            Subscribe for ₹49/month to get exclusive benefits with every booking:
                        </Text>
                        {venue?.subscriber_benefits && (venue.subscriber_benefits as string[]).length > 0 && (
                            <View style={styles.subscribeBenefits}>
                                {(venue.subscriber_benefits as string[]).map((benefit, i) => (
                                    <Text key={i} style={styles.subscribeBenefitItem}>✓ {benefit}</Text>
                                ))}
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.subscribeButton}
                            onPress={() => {
                                setShowSubscribePrompt(false);
                                router.push({ pathname: "/subscription", params: { returnTo: `/venue-detail?id=${venue.id}` } } as any);
                            }}
                        >
                            <Text style={styles.subscribeButtonText}>Subscribe Now — ₹49/mo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={() => {
                                setShowSubscribePrompt(false);
                                router.push({ pathname: "/booking-detail", params: { id: venue.id } });
                            }}
                        >
                            <Text style={styles.skipButtonText}>Skip & Continue Booking</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
    imageDots: {
        position: "absolute",
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
    },
    imageDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255,255,255,0.5)",
    },
    imageDotActive: {
        backgroundColor: Colors.white,
        width: 20,
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
    // Subscribe prompt modal
    subscribeOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    subscribeCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
        width: "100%",
    },
    subscribeIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FFF8E1",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    subscribeTitle: {
        fontSize: 20,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 8,
    },
    subscribeSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: 16,
        lineHeight: 20,
    },
    subscribeBenefits: {
        width: "100%",
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    subscribeBenefitItem: {
        fontSize: 13,
        color: Colors.text,
        marginBottom: 6,
    },
    subscribeButton: {
        backgroundColor: Colors.primary,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: "100%",
        alignItems: "center",
        marginBottom: 10,
    },
    subscribeButtonText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: "700" as const,
    },
    skipButton: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: "100%",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    skipButtonText: {
        color: Colors.text,
        fontSize: 15,
        fontWeight: "600" as const,
    },
});
