export interface Venue {
    id: string;
    name: string;
    location: string;
    city: string;
    pricePerHour: string;
    pricePerDay: string;
    image: string;
    category: string;
    capacity: number;
    rating: number;
    reviewCount: number;
    description: string;
    amenities: string[];
    ownerName: string;
    ownerImage: string;
    area: string;
    availableDates: string[];
}

export const VENUE_IMAGES = {
    wedding1: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
    wedding2: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=300&fit=crop',
    wedding3: 'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=400&h=300&fit=crop',
    banquet1: 'https://images.unsplash.com/photo-1561089489-f13d5e730d72?w=400&h=300&fit=crop',
    banquet2: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop',
    rooftop1: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop',
    corporate1: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
    corporate2: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop',
    garden1: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop',
    hall1: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
    hall2: 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=400&h=300&fit=crop',
    party1: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
};

export const ONBOARDING_IMAGES = [
    [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200&h=250&fit=crop',
        'https://images.unsplash.com/photo-1561089489-f13d5e730d72?w=200&h=180&fit=crop',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=200&h=250&fit=crop',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=280&fit=crop',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&h=200&fit=crop',
    ],
    [
        'https://images.unsplash.com/photo-1555244162-803834f70033?w=200&h=250&fit=crop',
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=180&fit=crop',
        'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=200&h=250&fit=crop',
        'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=200&h=280&fit=crop',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&h=200&fit=crop',
    ],
    [
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&h=250&fit=crop',
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200&h=180&fit=crop',
        'https://images.unsplash.com/photo-1561089489-f13d5e730d72?w=200&h=250&fit=crop',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=200&h=280&fit=crop',
        'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=200&h=200&fit=crop',
    ],
];

export const PROFILE_IMAGES = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
];

export const AVATAR_IMAGES = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
];

export const CATEGORIES = [
    { id: '1', name: 'Halls', icon: 'meeting-room' },
    { id: '2', name: 'Salons', icon: 'spa' },
    { id: '3', name: 'Decoration', icon: 'celebration' },
    { id: '4', name: 'Catering', icon: 'restaurant' },
    { id: '5', name: 'Mehndi', icon: 'brush' },
    { id: '6', name: 'Travel', icon: 'flight' },
    { id: '7', name: 'Water', icon: 'water-drop' },
    { id: '8', name: 'Fashion', icon: 'checkroom' },
    { id: '9', name: 'Jewelry', icon: 'diamond' },
    { id: '10', name: 'Rentals', icon: 'car-rental' },
];

export const FAVOURITE_CATEGORIES = CATEGORIES;

export const VENUES: Venue[] = [
    // Halls
    {
        id: 'h1', name: 'The Grand Ballroom', location: '14, Palace Road, Ahmedabad', city: 'Ahmedabad', pricePerHour: '₹5,000', pricePerDay: '₹40,000', image: VENUE_IMAGES.wedding1, category: 'Halls', capacity: 500, rating: 4.8, reviewCount: 128, description: 'A stunning ballroom perfect for events.', amenities: ['AC', 'Parking'], ownerName: 'Rajesh', ownerImage: AVATAR_IMAGES[0], area: '8,000 sq ft', availableDates: ['Mar 5', 'Mar 10'],
    },
    {
        id: 'h2', name: 'Crystal Banquet Hall', location: 'MG Road, Mumbai', city: 'Mumbai', pricePerHour: '₹6,000', pricePerDay: '₹50,000', image: VENUE_IMAGES.banquet1, category: 'Halls', capacity: 600, rating: 4.5, reviewCount: 92, description: 'An opulent banquet hall.', amenities: ['AC', 'Stage'], ownerName: 'Sunita', ownerImage: AVATAR_IMAGES[0], area: '10,000 sq ft', availableDates: ['Mar 2', 'Mar 9'],
    },
    {
        id: 'h3', name: 'Emerald Convention Hall', location: 'Jubilee Hills, Hyderabad', city: 'Hyderabad', pricePerHour: '₹4,500', pricePerDay: '₹36,000', image: VENUE_IMAGES.hall1, category: 'Halls', capacity: 400, rating: 4.7, reviewCount: 143, description: 'A sophisticated convention hall.', amenities: ['AC', 'Catering'], ownerName: 'Meena', ownerImage: AVATAR_IMAGES[2], area: '7,000 sq ft', availableDates: ['Mar 5', 'Mar 11'],
    },
    // Salons
    {
        id: 's1', name: 'Glamour Beauty Salon', location: 'Andheri West, Mumbai', city: 'Mumbai', pricePerHour: '₹2,000', pricePerDay: '₹12,000', image: VENUE_IMAGES.wedding2, category: 'Salons', capacity: 20, rating: 4.6, reviewCount: 50, description: 'Premium bridal packages and spa.', amenities: ['Air Conditioned', 'Spa Services'], ownerName: 'Priya', ownerImage: AVATAR_IMAGES[1], area: '1,500 sq ft', availableDates: ['Mar 1', 'Mar 2'],
    },
    {
        id: 's2', name: 'Elite Hair Studio', location: 'South Ex, Delhi', city: 'Delhi', pricePerHour: '₹1,500', pricePerDay: '₹10,000', image: VENUE_IMAGES.wedding3, category: 'Salons', capacity: 15, rating: 4.4, reviewCount: 40, description: 'Top tier stylists.', amenities: ['WiFi', 'Coffee Bar'], ownerName: 'Anil', ownerImage: AVATAR_IMAGES[2], area: '1,200 sq ft', availableDates: ['Mar 5', 'Mar 10'],
    },
    {
        id: 's3', name: 'Luxe Spa & Salon', location: 'Indiranagar, Bangalore', city: 'Bengaluru', pricePerHour: '₹2,500', pricePerDay: '₹15,000', image: VENUE_IMAGES.banquet2, category: 'Salons', capacity: 25, rating: 4.9, reviewCount: 110, description: 'Relaxing environment with top professionals.', amenities: ['Massage', 'Facials'], ownerName: 'Kavitha', ownerImage: AVATAR_IMAGES[3], area: '2,000 sq ft', availableDates: ['Mar 3', 'Mar 4'],
    },
    // Decoration
    {
        id: 'd1', name: 'Royal Decorators', location: 'Navrangpura, Ahmedabad', city: 'Ahmedabad', pricePerHour: '₹1,000', pricePerDay: '₹8,000', image: VENUE_IMAGES.garden1, category: 'Decoration', capacity: 0, rating: 4.7, reviewCount: 88, description: 'Exquisite floral and light decorations.', amenities: ['Floral', 'Lighting'], ownerName: 'Mahesh', ownerImage: AVATAR_IMAGES[0], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'd2', name: 'Elegant Events', location: 'Bandra, Mumbai', city: 'Mumbai', pricePerHour: '₹1,500', pricePerDay: '₹10,000', image: VENUE_IMAGES.party1, category: 'Decoration', capacity: 0, rating: 4.5, reviewCount: 60, description: 'Modern and theme-based decorations.', amenities: ['Themes', 'Props'], ownerName: 'Aditi', ownerImage: AVATAR_IMAGES[1], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'd3', name: 'Dream Wed Decor', location: 'Banjarahills, Hyderabad', city: 'Hyderabad', pricePerHour: '₹1,200', pricePerDay: '₹9,000', image: VENUE_IMAGES.rooftop1, category: 'Decoration', capacity: 0, rating: 4.8, reviewCount: 105, description: 'Bespoke event decorators.', amenities: ['Custom Decor'], ownerName: 'Vikram', ownerImage: AVATAR_IMAGES[2], area: 'N/A', availableDates: ['Any'],
    },
    // Catering
    {
        id: 'c1', name: 'Gourmet Delights', location: 'Vastrapur, Ahmedabad', city: 'Ahmedabad', pricePerHour: '₹500', pricePerDay: '₹15,000', image: VENUE_IMAGES.corporate1, category: 'Catering', capacity: 500, rating: 4.9, reviewCount: 200, description: 'Multi-cuisine premium catering.', amenities: ['Veg', 'Non-Veg'], ownerName: 'Sanjeev', ownerImage: AVATAR_IMAGES[3], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'c2', name: 'Royal Feast', location: 'Karol Bagh, Delhi', city: 'Delhi', pricePerHour: '₹400', pricePerDay: '₹12,000', image: VENUE_IMAGES.banquet1, category: 'Catering', capacity: 1000, rating: 4.6, reviewCount: 150, description: 'Traditional North Indian feasts.', amenities: ['Live Counters'], ownerName: 'Raman', ownerImage: AVATAR_IMAGES[0], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'c3', name: 'Spice Route', location: 'T Nagar, Chennai', city: 'Chennai', pricePerHour: '₹450', pricePerDay: '₹14,000', image: VENUE_IMAGES.hall2, category: 'Catering', capacity: 800, rating: 4.7, reviewCount: 180, description: 'Authentic South Indian & Continental food.', amenities: ['Buffet'], ownerName: 'Lakshmi', ownerImage: AVATAR_IMAGES[1], area: 'N/A', availableDates: ['Any'],
    },
    // Mehndi
    {
        id: 'm1', name: 'Bridal Henna Art', location: 'C G Road, Ahmedabad', city: 'Ahmedabad', pricePerHour: '₹800', pricePerDay: '₹5,000', image: VENUE_IMAGES.wedding1, category: 'Mehndi', capacity: 5, rating: 4.8, reviewCount: 85, description: 'Intricate bridal henna designs.', amenities: ['Organic Henna'], ownerName: 'Neha', ownerImage: AVATAR_IMAGES[2], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'm2', name: 'Mehendi by Sara', location: 'Juhu, Mumbai', city: 'Mumbai', pricePerHour: '₹1,000', pricePerDay: '₹6,000', image: VENUE_IMAGES.wedding2, category: 'Mehndi', capacity: 5, rating: 4.9, reviewCount: 120, description: 'Celebrity mehendi artist.', amenities: ['Arabic Designs'], ownerName: 'Sara', ownerImage: AVATAR_IMAGES[3], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'm3', name: 'Classic Mehndi', location: 'Malleswaram, Bangalore', city: 'Bengaluru', pricePerHour: '₹700', pricePerDay: '₹4,500', image: VENUE_IMAGES.wedding3, category: 'Mehndi', capacity: 10, rating: 4.6, reviewCount: 65, description: 'Traditional and fusion henna art.', amenities: ['Group Bookings'], ownerName: 'Anita', ownerImage: AVATAR_IMAGES[0], area: 'N/A', availableDates: ['Any'],
    },
    // Travel
    {
        id: 't1', name: 'Luxury Rides', location: 'Airport Road, Ahmedabad', city: 'Ahmedabad', pricePerHour: '₹1,200', pricePerDay: '₹8,000', image: VENUE_IMAGES.corporate2, category: 'Travel', capacity: 4, rating: 4.7, reviewCount: 90, description: 'Luxury car rentals for brides and grooms.', amenities: ['Chauffeur', 'Decorated'], ownerName: 'Amit', ownerImage: AVATAR_IMAGES[1], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 't2', name: 'City Shuttles', location: 'Dadar, Mumbai', city: 'Mumbai', pricePerHour: '₹3,000', pricePerDay: '₹12,000', image: VENUE_IMAGES.hall1, category: 'Travel', capacity: 40, rating: 4.5, reviewCount: 110, description: 'Volvo buses for guest transportation.', amenities: ['AC', 'Music System'], ownerName: 'Raj', ownerImage: AVATAR_IMAGES[2], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 't3', name: 'Elite Transport Co.', location: 'CP, Delhi', city: 'Delhi', pricePerHour: '₹1,500', pricePerDay: '₹10,000', image: VENUE_IMAGES.party1, category: 'Travel', capacity: 7, rating: 4.8, reviewCount: 140, description: 'Premium SUVs for families.', amenities: ['AC', 'Water'], ownerName: 'Sanjay', ownerImage: AVATAR_IMAGES[3], area: 'N/A', availableDates: ['Any'],
    },
    // Water
    {
        id: 'w1', name: 'PureAqua Suppliers', location: 'Gota, Ahmedabad', city: 'Ahmedabad', pricePerHour: '₹100', pricePerDay: '₹1,000', image: VENUE_IMAGES.garden1, category: 'Water', capacity: 0, rating: 4.6, reviewCount: 45, description: 'Premium bottled water supply for events.', amenities: ['Dispensers'], ownerName: 'Jatin', ownerImage: AVATAR_IMAGES[0], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'w2', name: 'Crystal Clear Water', location: 'Powai, Mumbai', city: 'Mumbai', pricePerHour: '₹150', pricePerDay: '₹1,500', image: VENUE_IMAGES.rooftop1, category: 'Water', capacity: 0, rating: 4.8, reviewCount: 60, description: 'Mineral water and ice supply.', amenities: ['Ice Cubes'], ownerName: 'Deepak', ownerImage: AVATAR_IMAGES[1], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'w3', name: 'Aqua Fresh', location: 'Koramangala, Bangalore', city: 'Bengaluru', pricePerHour: '₹120', pricePerDay: '₹1,200', image: VENUE_IMAGES.hall2, category: 'Water', capacity: 0, rating: 4.7, reviewCount: 55, description: 'Bulk water jar deliveries.', amenities: ['Chilled Jars'], ownerName: 'Kiran', ownerImage: AVATAR_IMAGES[2], area: 'N/A', availableDates: ['Any'],
    },
    // Fashion
    {
        id: 'f1', name: 'Bridal Couture', location: 'Sindhu Bhavan, Ahmedabad', city: 'Ahmedabad', pricePerHour: '₹0', pricePerDay: '₹25,000', image: VENUE_IMAGES.wedding1, category: 'Fashion', capacity: 0, rating: 4.9, reviewCount: 175, description: 'Designer lehengas and suits.', amenities: ['Fittings'], ownerName: 'Riya', ownerImage: AVATAR_IMAGES[3], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'f2', name: 'Groom Studios', location: 'Santa Cruz, Mumbai', city: 'Mumbai', pricePerHour: '₹0', pricePerDay: '₹20,000', image: VENUE_IMAGES.corporate1, category: 'Fashion', capacity: 0, rating: 4.7, reviewCount: 130, description: 'Sherwanis and bespoke suits.', amenities: ['Custom Tailoring'], ownerName: 'Vijay', ownerImage: AVATAR_IMAGES[0], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'f3', name: 'Ethnic Elegance', location: 'Lajpat Nagar, Delhi', city: 'Delhi', pricePerHour: '₹0', pricePerDay: '₹15,000', image: VENUE_IMAGES.wedding3, category: 'Fashion', capacity: 0, rating: 4.6, reviewCount: 95, description: 'Pre-wedding photoshoot outfits.', amenities: ['Rentals Available'], ownerName: 'Simran', ownerImage: AVATAR_IMAGES[1], area: 'N/A', availableDates: ['Any'],
    },
    // Jewelry
    {
        id: 'j1', name: 'Sparkle Jewellers', location: 'C G Road, Ahmedabad', city: 'Ahmedabad', pricePerHour: '₹0', pricePerDay: '₹50,000', image: VENUE_IMAGES.wedding2, category: 'Jewelry', capacity: 0, rating: 4.8, reviewCount: 210, description: 'Bridal gold and diamond jewelry.', amenities: ['Hallmarked'], ownerName: 'Prakash', ownerImage: AVATAR_IMAGES[2], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'j2', name: 'Diamond World', location: 'Zaveri Bazaar, Mumbai', city: 'Mumbai', pricePerHour: '₹0', pricePerDay: '₹75,000', image: VENUE_IMAGES.banquet2, category: 'Jewelry', capacity: 0, rating: 4.9, reviewCount: 300, description: 'Exquisite diamond necklaces and rings.', amenities: ['Certificates'], ownerName: 'Nitin', ownerImage: AVATAR_IMAGES[3], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'j3', name: 'Royal Ornaments', location: 'Jayanagar, Bangalore', city: 'Bengaluru', pricePerHour: '₹0', pricePerDay: '₹40,000', image: VENUE_IMAGES.wedding1, category: 'Jewelry', capacity: 0, rating: 4.7, reviewCount: 155, description: 'Traditional antique jewelry collections.', amenities: ['Custom Designs'], ownerName: 'Radhika', ownerImage: AVATAR_IMAGES[0], area: 'N/A', availableDates: ['Any'],
    },
    // Rentals
    {
        id: 'r1', name: 'Event Props & Co.', location: 'SG Highway, Ahmedabad', city: 'Ahmedabad', pricePerHour: '₹500', pricePerDay: '₹5,000', image: VENUE_IMAGES.party1, category: 'Rentals', capacity: 0, rating: 4.5, reviewCount: 70, description: 'Furniture and event props rental.', amenities: ['Delivery'], ownerName: 'Harsh', ownerImage: AVATAR_IMAGES[1], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'r2', name: 'Sound & Light Rentals', location: 'Goregaon, Mumbai', city: 'Mumbai', pricePerHour: '₹1,500', pricePerDay: '₹15,000', image: VENUE_IMAGES.corporate2, category: 'Rentals', capacity: 0, rating: 4.8, reviewCount: 125, description: 'DJ setup, speakers, and intelligent lighting.', amenities: ['Setup included'], ownerName: 'Sameer', ownerImage: AVATAR_IMAGES[2], area: 'N/A', availableDates: ['Any'],
    },
    {
        id: 'r3', name: 'Tent House Rentals', location: 'Rohini, Delhi', city: 'Delhi', pricePerHour: '₹2,000', pricePerDay: '₹20,000', image: VENUE_IMAGES.garden1, category: 'Rentals', capacity: 0, rating: 4.6, reviewCount: 90, description: 'Tents, AC units, and outdoor seating.', amenities: ['Installation'], ownerName: 'Puneet', ownerImage: AVATAR_IMAGES[3], area: 'N/A', availableDates: ['Any'],
    },
];
