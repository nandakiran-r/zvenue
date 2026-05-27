import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './db/schema.js';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding service listings (2 per category)...\n');

  // Get categories
  const categories = await db.query.service_categories.findMany();
  const catMap = {};
  categories.forEach(c => { catMap[c.name] = c.id; });

  // Get demo owner
  let owner = await db.query.owners.findFirst({ where: eq(schema.owners.email, 'demo.owner@zvenue.in') });
  if (!owner) {
    console.log('  No demo owner found, using null owner_id');
  }
  const ownerId = owner?.id || null;
  const ownerName = owner?.full_name || 'ZVenue Services';

  const listings = [
    // Saloons
    { name: 'Royal Cuts Unisex Salon', category: 'Saloons', city: 'Kochi', area: 'MG Road', price: 500, quantity: 50, discount: 10, description: 'Premium unisex salon offering haircuts, styling, coloring, and grooming services. Our expert stylists use top-quality products to give you the perfect look for any occasion. Walk-ins welcome.', images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800', 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800'], benefits: ['10% off all services', 'Free hair wash with every cut', 'Priority appointments'] },
    { name: 'Glamour Studio', category: 'Saloons', city: 'Kochi', area: 'Panampilly Nagar', price: 800, quantity: 30, discount: 15, description: 'Luxury beauty studio specializing in bridal makeup, party looks, and advanced skincare treatments. Our team of certified beauticians ensures you look your absolute best.', images: ['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800'], benefits: ['15% off bridal packages', 'Free consultation', 'Complimentary touch-up kit'] },

    // Decors
    { name: 'Dream Decor Events', category: 'Decors', city: 'Kochi', area: 'Edappally', price: 15000, quantity: 20, discount: 12, description: 'Complete event decoration services including stage setup, floral arrangements, lighting, and themed decor. We transform venues into magical spaces for weddings, receptions, and corporate events.', images: ['https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800'], benefits: ['12% off total package', 'Free theme consultation', 'Complimentary entrance arch'] },
    { name: 'Blossom Floral Designs', category: 'Decors', city: 'Kottayam', area: 'Baker Junction', price: 8000, quantity: 25, discount: 10, description: 'Specializing in fresh flower decorations, mandap setups, and eco-friendly decor solutions. We source the freshest flowers and create stunning arrangements that leave lasting impressions.', images: ['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800'], benefits: ['10% off', 'Free bouquet for bride', 'Same-day setup guarantee'] },

    // Catering
    { name: 'Spice Route Caterers', category: 'Catering', city: 'Kochi', area: 'Kakkanad', price: 600, quantity: 100, discount: 8, description: 'Premium catering service offering authentic Kerala cuisine, North Indian, Chinese, and continental menus. We cater for weddings, corporate events, and private parties with fresh ingredients and expert chefs.', images: ['https://images.unsplash.com/photo-1555244162-803834f70033?w=800', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'], benefits: ['8% off per plate', 'Free dessert counter', 'Complimentary welcome drinks'] },
    { name: 'Grand Feast Kitchen', category: 'Catering', city: 'Kochi', area: 'Fort Kochi', price: 450, quantity: 200, discount: 5, description: 'Budget-friendly catering with premium taste. Specializing in sadya (traditional Kerala feast), biriyani counters, and multi-cuisine buffets. Serving 50 to 2000 guests with consistent quality.', images: ['https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800'], benefits: ['5% off for 100+ plates', 'Free live counter', 'Complimentary service staff'] },

    // Mehandi
    { name: 'Henna Art by Priya', category: 'Mehandi', city: 'Kochi', area: 'Ernakulam', price: 2000, quantity: 40, discount: 10, description: 'Professional mehandi artist specializing in bridal, Arabic, and contemporary henna designs. Over 10 years of experience creating intricate patterns that last 2-3 weeks. Home service available.', images: ['https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=800', 'https://images.unsplash.com/photo-1591710668263-a5a886842e5e?w=800', 'https://images.unsplash.com/photo-1595854341625-f2e09c484891?w=800'], benefits: ['10% off bridal package', 'Free touch-up next day', 'Organic henna included'] },
    { name: 'Mehndi Magic Studio', category: 'Mehandi', city: 'Kottayam', area: 'Nagampadam', price: 1500, quantity: 50, discount: 12, description: 'Creative mehandi designs for all occasions — weddings, engagements, baby showers, and festivals. We use 100% natural henna paste and offer both traditional and modern design options.', images: ['https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=800', 'https://images.unsplash.com/photo-1611329857570-f02f340e7378?w=800', 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?w=800'], benefits: ['12% off', 'Free glitter add-on', 'Group discount for 5+'] },

    // Travel
    { name: 'Kerala Wheels Car Rental', category: 'Travel', city: 'Kochi', area: 'Airport Road', price: 3000, quantity: 15, discount: 10, description: 'Premium car rental service for weddings, events, and tours. Fleet includes luxury sedans, SUVs, and vintage cars. All vehicles come with professional chauffeurs and are well-maintained.', images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'], benefits: ['10% off multi-day rental', 'Free airport pickup', 'Complimentary water bottles'] },
    { name: 'Royal Rides Wedding Cars', category: 'Travel', city: 'Kochi', area: 'Marine Drive', price: 8000, quantity: 10, discount: 15, description: 'Luxury wedding car service featuring decorated vintage cars, Rolls Royce replicas, and premium SUVs. Make your grand entrance unforgettable with our beautifully adorned vehicles.', images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800', 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800'], benefits: ['15% off', 'Free car decoration', 'Red carpet service included'] },

    // Water
    { name: 'AquaPure Water Supply', category: 'Water', city: 'Kochi', area: 'Aluva', price: 200, quantity: 500, discount: 5, description: 'Bulk drinking water supply for events and functions. We provide packaged drinking water bottles (500ml & 1L), water dispensers, and tanker service. FSSAI certified and hygienically packed.', images: ['https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=800', 'https://images.unsplash.com/photo-1606168094336-48f205276929?w=800'], benefits: ['5% off bulk orders', 'Free dispenser rental', 'Same-day delivery'] },
    { name: 'Crystal Springs Events', category: 'Water', city: 'Kottayam', area: 'Collectorate', price: 150, quantity: 1000, discount: 8, description: 'Complete water solutions for events — from branded water bottles to flavored water stations and coconut water counters. We handle hydration so you can focus on your event.', images: ['https://images.unsplash.com/photo-1560023907-5f339617ea55?w=800', 'https://images.unsplash.com/photo-1564419320461-6262a0a7b528?w=800', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800'], benefits: ['8% off', 'Free coconut water counter', 'Eco-friendly packaging'] },

    // Fashion
    { name: 'Silk & Thread Boutique', category: 'Fashion', city: 'Kochi', area: 'Broadway', price: 5000, quantity: 30, discount: 10, description: 'Custom tailoring and designer wear for weddings and special occasions. We offer bridal lehengas, sherwanis, sarees, and western formal wear. Alterations and fittings included in the price.', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800'], benefits: ['10% off custom orders', 'Free alterations', 'Express delivery available'] },
    { name: 'Trendy Threads Rental', category: 'Fashion', city: 'Kochi', area: 'Lulu Mall Road', price: 2500, quantity: 50, discount: 15, description: 'Designer outfit rental service for events. Why buy when you can rent? Choose from 500+ designer pieces including lehengas, gowns, suits, and accessories. Dry cleaning included.', images: ['https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800'], benefits: ['15% off', 'Free accessories with outfit', 'Home delivery & pickup'] },

    // Jewellery
    { name: 'Golden Touch Jewellers', category: 'Jewellery', city: 'Kochi', area: 'Jew Town', price: 25000, quantity: 20, discount: 5, description: 'Exquisite gold and diamond jewellery for weddings and special occasions. We offer bridal sets, temple jewellery, and contemporary designs. BIS hallmarked gold with lifetime exchange guarantee.', images: ['https://images.unsplash.com/photo-1515562141589-67f0d569b6f5?w=800', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800'], benefits: ['5% off making charges', 'Free jewellery cleaning', 'Lifetime exchange'] },
    { name: 'Sparkle Rental Jewellery', category: 'Jewellery', city: 'Kochi', area: 'Panampilly Nagar', price: 3000, quantity: 40, discount: 20, description: 'Premium jewellery rental for events. Stunning imitation and semi-precious collections that look like the real deal. Perfect for photoshoots, receptions, and parties without the hefty price tag.', images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800', 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800'], benefits: ['20% off', 'Free matching accessories', 'Insurance included'] },

    // Rentals
    { name: 'EventPro Equipment Rentals', category: 'Rentals', city: 'Kochi', area: 'Kaloor', price: 5000, quantity: 30, discount: 10, description: 'Complete event equipment rental — sound systems, LED screens, projectors, lighting rigs, stages, tents, and furniture. Professional setup and teardown included. Serving events of all sizes.', images: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800'], benefits: ['10% off', 'Free setup & teardown', 'Backup equipment on standby'] },
    { name: 'Party Props & Furniture', category: 'Rentals', city: 'Kottayam', area: 'KK Road', price: 2000, quantity: 60, discount: 8, description: 'Rental service for party furniture, props, and accessories. Chairs, tables, sofa sets, photo booth props, balloon arches, and themed party kits. Delivery and pickup included within city limits.', images: ['https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'], benefits: ['8% off', 'Free delivery within 10km', 'Same-day availability'] },
  ];

  let created = 0;
  for (const item of listings) {
    const categoryId = catMap[item.category];
    if (!categoryId) { console.log(`  ⚠️ Category "${item.category}" not found, skipping ${item.name}`); continue; }

    // Check if already exists
    const existing = await db.query.service_listings.findFirst({ where: eq(schema.service_listings.name, item.name) });
    if (existing) { console.log(`  ⏭️  "${item.name}" already exists`); continue; }

    await db.insert(schema.service_listings).values({
      service_category_id: categoryId,
      owner_id: ownerId,
      name: item.name,
      description: item.description,
      images: JSON.stringify(item.images),
      video_url: null,
      price: item.price,
      quantity_available: item.quantity,
      city: item.city,
      area: item.area,
      subscriber_discount_percent: item.discount,
      subscriber_benefits: JSON.stringify(item.benefits),
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      review_count: Math.floor(Math.random() * 20) + 5,
      is_active: true,
      approval_status: 'approved',
      owner_name: ownerName,
      owner_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    });
    console.log(`  ✅ ${item.name} (${item.category}) — ₹${item.price} × ${item.quantity}`);
    created++;
  }

  console.log(`\n✨ Done! Created ${created} service listings across ${categories.length} categories.`);
}

seed().catch(err => { console.error('❌ Failed:', err.message); process.exit(1); });
