import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './db/schema.js';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const { categories, venues, owners } = schema;

async function seed() {
  console.log('🌱 Starting demo venue seeding...\n');

  // ─── 1. Ensure Categories Exist ─────────────────────────────────────────
  const existingCategories = await db.query.categories.findMany();
  let categoryMap = {};

  if (existingCategories.length === 0) {
    console.log('📂 Creating categories...');
    const categoryData = [
      { name: 'Wedding Halls', icon: 'heart', sort_order: 1 },
      { name: 'Conference Rooms', icon: 'briefcase', sort_order: 2 },
      { name: 'Party Venues', icon: 'celebration', sort_order: 3 },
      { name: 'Outdoor Spaces', icon: 'trees', sort_order: 4 },
      { name: 'Banquet Halls', icon: 'utensils', sort_order: 5 },
      { name: 'Studios', icon: 'camera', sort_order: 6 },
    ];

    for (const cat of categoryData) {
      const [inserted] = await db.insert(categories).values(cat).returning();
      categoryMap[cat.name] = inserted.id;
      console.log(`  ✅ Created category: ${cat.name}`);
    }
  } else {
    console.log(`📂 Found ${existingCategories.length} existing categories`);
    existingCategories.forEach(c => {
      categoryMap[c.name] = c.id;
    });
  }

  // ─── 2. Ensure a Demo Owner Exists ──────────────────────────────────────
  let demoOwner = await db.query.owners.findFirst({
    where: eq(owners.email, 'demo.owner@zvenue.in'),
  });

  if (!demoOwner) {
    console.log('\n👤 Creating demo owner...');
    // Using argon2 hash of "DemoOwner@123"
    const argon2 = await import('argon2');
    const hashedPassword = await argon2.hash('DemoOwner@123');
    const [inserted] = await db.insert(owners).values({
      full_name: 'Rajesh Kumar',
      email: 'demo.owner@zvenue.in',
      phone_number: '+919876543210',
      password: hashedPassword,
      is_active: true,
    }).returning();
    demoOwner = inserted;
    console.log(`  ✅ Created owner: ${demoOwner.full_name} (${demoOwner.email})`);
  } else {
    console.log(`\n👤 Using existing demo owner: ${demoOwner.full_name}`);
  }

  // ─── 3. Create 5 Demo Venues ───────────────────────────────────────────
  console.log('\n🏛️  Creating demo venues...\n');

  // Helper to get category ID (fallback to first available)
  const getCategoryId = (name) => {
    if (categoryMap[name]) return categoryMap[name];
    const keys = Object.keys(categoryMap);
    return keys.length > 0 ? categoryMap[keys[0]] : null;
  };

  const demoVenues = [
    {
      name: 'Royal Grand Palace',
      description: 'A magnificent wedding venue with stunning architecture, lush gardens, and world-class amenities. Perfect for grand celebrations with up to 500 guests. Features include a grand ballroom with crystal chandeliers, outdoor lawn area, dedicated bridal suite, and professional event coordination team.',
      location: 'MG Road, Ernakulam',
      city: 'Kochi',
      latitude: 9.9816,
      longitude: 76.2999,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
        'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800',
        'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800',
      ]),
      image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      category_id: getCategoryId('Wedding Halls'),
      owner_id: demoOwner.id,
      price_per_hour: 15000,
      price_per_day: 150000,
      capacity: 500,
      registration_fee: 25000,
      rating: 4.8,
      review_count: 24,
      area: '12000 sq ft',
      amenities: JSON.stringify(['AC', 'Parking', 'Catering', 'DJ System', 'Bridal Suite', 'Valet Parking', 'Generator Backup', 'WiFi', 'Stage & Decor', 'CCTV Security']),
      subscriber_benefits: JSON.stringify(['10% discount on booking', 'Free decoration upgrade', 'Priority date selection', 'Complimentary bridal room']),
      blocked_dates: JSON.stringify([]),
      available_dates: JSON.stringify([]),
      approval_status: 'approved',
      owner_name: 'Rajesh Kumar',
      owner_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    {
      name: 'TechHub Conference Center',
      description: 'A state-of-the-art conference facility designed for corporate events, seminars, and product launches. Equipped with the latest AV technology, high-speed internet, and modular seating arrangements. Located in the heart of the IT corridor with easy access to hotels and restaurants.',
      location: 'Infopark, Kakkanad',
      city: 'Kochi',
      latitude: 10.0099,
      longitude: 76.3495,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
        'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800',
        'https://images.unsplash.com/photo-1431540015159-0f9673f44e5a?w=800',
      ]),
      image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      youtube_url: null,
      category_id: getCategoryId('Conference Rooms'),
      owner_id: demoOwner.id,
      price_per_hour: 5000,
      price_per_day: 40000,
      capacity: 200,
      registration_fee: 8000,
      rating: 4.5,
      review_count: 18,
      area: '5000 sq ft',
      amenities: JSON.stringify(['AC', 'Projector', 'Whiteboard', 'WiFi', 'Parking', 'Mic & Speakers', 'Video Conferencing', 'Coffee/Tea', 'Breakout Rooms', 'Reception Desk']),
      subscriber_benefits: JSON.stringify(['15% discount on hourly rate', 'Free AV equipment', 'Priority booking', 'Complimentary refreshments']),
      blocked_dates: JSON.stringify([]),
      available_dates: JSON.stringify([]),
      approval_status: 'approved',
      owner_name: 'Rajesh Kumar',
      owner_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    {
      name: 'Sunset Garden Party Lawn',
      description: 'A beautiful open-air party venue surrounded by tropical gardens and water features. Ideal for birthday parties, anniversaries, kitty parties, and social gatherings. The venue offers a stunning sunset view, ambient lighting, and a dedicated BBQ area. Perfect for events of 50-150 guests.',
      location: 'Marine Drive, Fort Kochi',
      city: 'Kochi',
      latitude: 9.9674,
      longitude: 76.2437,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
        'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
        'https://images.unsplash.com/photo-1496843916299-590492c751f4?w=800',
        'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800',
      ]),
      image_url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
      youtube_url: null,
      category_id: getCategoryId('Party Venues'),
      owner_id: demoOwner.id,
      price_per_hour: 8000,
      price_per_day: 60000,
      capacity: 150,
      registration_fee: 10000,
      rating: 4.6,
      review_count: 32,
      area: '8000 sq ft',
      amenities: JSON.stringify(['Open Air', 'Parking', 'BBQ Area', 'Ambient Lighting', 'Sound System', 'Dance Floor', 'Bar Counter', 'Kids Play Area', 'Restrooms', 'Generator Backup']),
      subscriber_benefits: JSON.stringify(['12% discount', 'Free DJ for 2 hours', 'Complimentary decoration', 'Extended hours till midnight']),
      blocked_dates: JSON.stringify([]),
      available_dates: JSON.stringify([]),
      approval_status: 'approved',
      owner_name: 'Rajesh Kumar',
      owner_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    {
      name: 'Lakeview Banquet & Convention',
      description: 'An elegant banquet hall overlooking the serene backwaters of Kerala. This premium venue offers both indoor and outdoor spaces, making it versatile for weddings, receptions, corporate dinners, and cultural events. Features include a floating deck, panoramic lake views, and gourmet catering services.',
      location: 'Vembanad Lake Road, Kumarakom',
      city: 'Kottayam',
      latitude: 9.6175,
      longitude: 76.4301,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800',
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      ]),
      image_url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800',
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      category_id: getCategoryId('Banquet Halls'),
      owner_id: demoOwner.id,
      price_per_hour: 20000,
      price_per_day: 200000,
      capacity: 800,
      registration_fee: 35000,
      rating: 4.9,
      review_count: 45,
      area: '20000 sq ft',
      amenities: JSON.stringify(['AC', 'Parking', 'Catering', 'Lake View', 'Floating Deck', 'Bridal Suite', 'Valet Parking', 'Generator Backup', 'WiFi', 'CCTV', 'Helipad Access', 'Boat Jetty']),
      subscriber_benefits: JSON.stringify(['20% discount on day booking', 'Free houseboat ride', 'Complimentary suite for 1 night', 'Priority monsoon season dates']),
      blocked_dates: JSON.stringify([]),
      available_dates: JSON.stringify([]),
      approval_status: 'approved',
      owner_name: 'Rajesh Kumar',
      owner_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    {
      name: 'Creative Studio Loft',
      description: 'A modern, industrial-chic studio space perfect for photoshoots, video productions, workshops, and intimate events. Features exposed brick walls, natural lighting from floor-to-ceiling windows, professional lighting rigs, and a green screen setup. Ideal for content creators, brands, and small gatherings up to 50 people.',
      location: 'Panampilly Nagar',
      city: 'Kochi',
      latitude: 9.9571,
      longitude: 76.2932,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800',
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
        'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800',
      ]),
      image_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800',
      youtube_url: null,
      category_id: getCategoryId('Studios'),
      owner_id: demoOwner.id,
      price_per_hour: 3000,
      price_per_day: 20000,
      capacity: 50,
      registration_fee: 5000,
      rating: 4.7,
      review_count: 15,
      area: '2500 sq ft',
      amenities: JSON.stringify(['AC', 'WiFi', 'Professional Lighting', 'Green Screen', 'Makeup Room', 'Props', 'Sound System', 'Parking', 'Coffee Machine', 'Changing Room']),
      subscriber_benefits: JSON.stringify(['20% off hourly rate', 'Free props & backdrops', '1 hour extra free', 'Priority weekend slots']),
      blocked_dates: JSON.stringify([]),
      available_dates: JSON.stringify([]),
      approval_status: 'approved',
      owner_name: 'Rajesh Kumar',
      owner_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
  ];

  for (const venueData of demoVenues) {
    // Check if venue already exists by name
    const existing = await db.query.venues.findFirst({
      where: eq(venues.name, venueData.name),
    });

    if (existing) {
      console.log(`  ⏭️  Skipping "${venueData.name}" (already exists)`);
      continue;
    }

    const [inserted] = await db.insert(venues).values(venueData).returning();
    console.log(`  ✅ Created venue: "${inserted.name}" in ${venueData.city} (₹${venueData.registration_fee} reg fee)`);
  }

  console.log('\n✨ Demo seeding complete!\n');
  console.log('📋 Summary:');
  console.log(`   Categories: ${Object.keys(categoryMap).length}`);
  console.log(`   Owner: ${demoOwner.full_name} (${demoOwner.email} / password: DemoOwner@123)`);
  console.log(`   Venues: 5 demo venues created`);
  console.log('\n🔑 Owner Login Credentials:');
  console.log(`   Email: demo.owner@zvenue.in`);
  console.log(`   Password: DemoOwner@123`);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
