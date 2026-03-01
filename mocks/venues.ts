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
    area: string; // sq ft or sq meters
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

export const VENUES: Venue[] = [
    {
        id: '1',
        name: 'The Grand Ballroom',
        location: '14, Palace Road, Ahmedabad',
        city: 'Ahmedabad',
        pricePerHour: '₹5,000',
        pricePerDay: '₹40,000',
        image: VENUE_IMAGES.wedding1,
        category: 'Wedding',
        capacity: 500,
        rating: 4.8,
        reviewCount: 128,
        description: 'A stunning ballroom adorned with crystal chandeliers and marble floors, perfect for grand weddings and gala events. Equipped with state-of-the-art sound and lighting systems, a bridal suite, and a dedicated catering kitchen.',
        amenities: ['AC', 'Parking', 'Catering', 'DJ Setup', 'Bridal Room', 'Stage'],
        ownerName: 'Rajesh Mehta',
        ownerImage: AVATAR_IMAGES[0],
        area: '8,000 sq ft',
        availableDates: ['Mar 5', 'Mar 10', 'Mar 15', 'Mar 20'],
    },
    {
        id: '2',
        name: 'Skyline Rooftop Terrace',
        location: 'Rooftop, The Metropolitan, Pune',
        city: 'Pune',
        pricePerHour: '₹3,500',
        pricePerDay: '₹28,000',
        image: VENUE_IMAGES.rooftop1,
        category: 'Party',
        capacity: 200,
        rating: 4.6,
        reviewCount: 84,
        description: 'A breathtaking open-air rooftop venue with panoramic city views. Ideal for cocktail parties, birthday bashes, and corporate get-togethers. Features a built-in bar, lounge seating, and ambient fairy lights.',
        amenities: ['Open Air', 'Bar', 'Lounge Seating', 'City View', 'Live Music Ready', 'Parking'],
        ownerName: 'Priya Sharma',
        ownerImage: AVATAR_IMAGES[1],
        area: '3,500 sq ft',
        availableDates: ['Mar 3', 'Mar 8', 'Mar 12', 'Mar 18'],
    },
    {
        id: '3',
        name: 'Prestige Conference Centre',
        location: '5th Floor, Prestige Tower, Bangalore',
        city: 'Bangalore',
        pricePerHour: '₹2,000',
        pricePerDay: '₹15,000',
        image: VENUE_IMAGES.corporate1,
        category: 'Corporate',
        capacity: 150,
        rating: 4.7,
        reviewCount: 210,
        description: 'A modern, fully-equipped conference and seminar hall with high-speed Wi-Fi, projector screens, and video-conferencing facilities. Perfect for product launches, corporate meetings, and seminars.',
        amenities: ['Wi-Fi', 'Projector', 'Video Conferencing', 'AC', 'Cafeteria', 'Whiteboard'],
        ownerName: 'Anil Kumar',
        ownerImage: AVATAR_IMAGES[2],
        area: '2,400 sq ft',
        availableDates: ['Mar 4', 'Mar 6', 'Mar 11', 'Mar 14'],
    },
    {
        id: '4',
        name: 'Garden of Roses',
        location: 'ECR Road, Chennai',
        city: 'Chennai',
        pricePerHour: '₹4,000',
        pricePerDay: '₹32,000',
        image: VENUE_IMAGES.garden1,
        category: 'Wedding',
        capacity: 350,
        rating: 4.9,
        reviewCount: 175,
        description: 'A lush, beautifully manicured garden venue with a floral arch, fountain, and outdoor stage. An enchanting space for weddings, engagement ceremonies, and outdoor receptions under the open sky.',
        amenities: ['Garden', 'Fountain', 'Outdoor Stage', 'Floral Decor', 'Catering', 'Parking'],
        ownerName: 'Kavitha Nair',
        ownerImage: AVATAR_IMAGES[3],
        area: '12,000 sq ft',
        availableDates: ['Mar 7', 'Mar 13', 'Mar 19', 'Mar 25'],
    },
    {
        id: '5',
        name: 'Crystal Banquet Hall',
        location: 'MG Road, Mumbai',
        city: 'Mumbai',
        pricePerHour: '₹6,000',
        pricePerDay: '₹50,000',
        image: VENUE_IMAGES.banquet1,
        category: 'Banquet',
        capacity: 600,
        rating: 4.5,
        reviewCount: 92,
        description: 'An opulent banquet hall with a grand entrance, tiered seating, and professional-grade AV equipment. Ideal for large receptions, award ceremonies, and premium social events.',
        amenities: ['AC', 'Stage', 'AV Equipment', 'Valet Parking', 'Green Room', 'Catering'],
        ownerName: 'Sunita Desai',
        ownerImage: AVATAR_IMAGES[0],
        area: '10,000 sq ft',
        availableDates: ['Mar 2', 'Mar 9', 'Mar 16', 'Mar 22'],
    },
    {
        id: '6',
        name: 'The Party Loft',
        location: 'Koregaon Park, Pune',
        city: 'Pune',
        pricePerHour: '₹2,500',
        pricePerDay: '₹20,000',
        image: VENUE_IMAGES.party1,
        category: 'Party',
        capacity: 120,
        rating: 4.4,
        reviewCount: 61,
        description: 'A vibrant, industrial-chic loft space with a professional DJ console, dance floor, neon lighting, and a fully stocked bar. The ultimate venue for private parties and nightlife experiences.',
        amenities: ['DJ Console', 'Dance Floor', 'Bar', 'Neon Lighting', 'AC', 'Lounge Area'],
        ownerName: 'Arjun Singh',
        ownerImage: AVATAR_IMAGES[1],
        area: '2,000 sq ft',
        availableDates: ['Mar 1', 'Mar 6', 'Mar 14', 'Mar 21'],
    },
    {
        id: '7',
        name: 'Emerald Convention Hall',
        location: 'Jubilee Hills, Hyderabad',
        city: 'Hyderabad',
        pricePerHour: '₹4,500',
        pricePerDay: '₹36,000',
        image: VENUE_IMAGES.hall1,
        category: 'Banquet',
        capacity: 400,
        rating: 4.7,
        reviewCount: 143,
        description: 'A sophisticated convention hall with elegant décor, plush seating, and a dedicated event coordination team. Perfect for weddings, corporate dinners, and high-profile social gatherings.',
        amenities: ['AC', 'Catering', 'Event Coordinator', 'Parking', 'Stage', 'Photo Booth'],
        ownerName: 'Meena Reddy',
        ownerImage: AVATAR_IMAGES[2],
        area: '7,000 sq ft',
        availableDates: ['Mar 5', 'Mar 11', 'Mar 17', 'Mar 23'],
    },
];

export const CATEGORIES = [
    { id: '1', name: 'Wedding', icon: 'favorite' },
    { id: '2', name: 'Party', icon: 'celebration' },
    { id: '3', name: 'Corporate', icon: 'business' },
    { id: '4', name: 'Banquet', icon: 'restaurant' },
    { id: '5', name: 'Outdoor', icon: 'park' },
    { id: '6', name: 'Conference', icon: 'meeting-room' },
];

export const FAVOURITE_CATEGORIES = [
    { id: '1', name: 'Wedding Hall', icon: 'favorite' },
    { id: '2', name: 'Birthday Party', icon: 'celebration' },
    { id: '3', name: 'Corporate Events', icon: 'business' },
    { id: '4', name: 'Banquet', icon: 'restaurant' },
    { id: '5', name: 'Outdoor Garden', icon: 'park' },
    { id: '6', name: 'Conference Room', icon: 'meeting-room' },
    { id: '7', name: 'Engagement', icon: 'diamond' },
    { id: '8', name: 'Reception', icon: 'people' },
    { id: '9', name: 'Baby Shower', icon: 'child-care' },
    { id: '10', name: 'Anniversary', icon: 'cake' },
    { id: '11', name: 'Exhibition', icon: 'photo-library' },
    { id: '12', name: 'Farewell', icon: 'flight-takeoff' },
    { id: '13', name: 'Seminars', icon: 'school' },
    { id: '14', name: 'Sports Events', icon: 'sports-soccer' },
    { id: '15', name: 'Film Shoots', icon: 'movie' },
    { id: '16', name: 'Photoshoots', icon: 'camera-alt' },
];
