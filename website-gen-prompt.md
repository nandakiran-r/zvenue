# ZVenue — Dynamic Marketing Website Generation Prompt

## System Prompt

You are building a dynamic marketing/showcase website for **ZVenue** — a venue booking platform available as a mobile app on Android (Google Play) and iOS (App Store). This website is purely informational and display-only. It does NOT have any booking, payment, review submission, or user authentication functionality. It fetches and displays data from the existing ZVenue backend API and presents it beautifully to potential customers.

---

## Project Overview

**ZVenue** is a venue discovery and booking platform based in Kerala, India. Users browse venues (wedding halls, conference rooms, party spaces, banquet halls, studios, rooftops), view details, and book through the mobile app. The website serves as a landing page and venue showcase to drive app downloads.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion for scroll animations and transitions
- **Icons:** Lucide React
- **Fonts:** Inter (body) + Playfair Display (headings) from Google Fonts
- **Deployment:** Vercel or Netlify (static + ISR)
- **Data Fetching:** Server components fetching from the ZVenue API (ISR with revalidation every 60 seconds)

---

## Design Theme & Brand Identity

### Colors
- **Primary:** `#7a3317` (deep warm brown)
- **Primary Light:** `#a85c3b`
- **Primary Lighter:** `#d4956b`
- **Accent:** `#f0c9a8` (warm peach)
- **Background:** `#FAFAF8` (warm off-white)
- **Surface:** `#FFFFFF`
- **Text Primary:** `#1a1a1a`
- **Text Secondary:** `#6b7280`
- **Text Tertiary:** `#9ca3af`
- **Border:** `#e5e7eb`
- **Success:** `#4CAF50`
- **Gold/Star:** `#F59E0B`

### Design Principles
- Clean, modern, premium feel — think luxury hospitality meets tech
- Generous whitespace, large hero sections
- Rounded corners (12–20px on cards)
- Subtle shadows (`shadow-sm` to `shadow-lg`)
- Smooth scroll animations (fade-up, slide-in)
- Mobile-first responsive design
- Dark mode support (optional but preferred)
- Indian locale formatting for prices (₹ with en-IN locale, e.g., ₹1,50,000)

---

## API Integration

### Base URL
The backend API runs at a configurable `NEXT_PUBLIC_API_URL` environment variable (default: `http://localhost:3001`).

### Endpoints to Consume (all public, no auth required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/venues` | GET | List all approved venues (returns venues with `approval_status: approved` and `registration_fee > 0`) |
| `/api/venues/:id` | GET | Single venue detail with category info |
| `/api/venues/:id/reviews` | GET | Paginated reviews for a venue (`?page=1&limit=5`) |
| `/api/categories` | GET | All venue categories |
| `/api/dashboard/top-venues` | GET | Top 5 venues by rating (requires auth header — use a static service token or make this endpoint public) |
| `/api/dashboard/city-distribution` | GET | Venues count per city |

### Venue Data Shape
```typescript
interface Venue {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  images: string[]; // Array of image URLs (first is cover)
  image_url: string | null; // Cover image fallback
  youtube_url: string | null;
  category_id: string | null;
  price_per_hour: number;
  price_per_day: number;
  capacity: number;
  registration_fee: number;
  rating: number;
  review_count: number;
  area: string | null;
  amenities: string[];
  subscriber_benefits: string[];
  owner_name: string | null;
  owner_image: string | null;
  category?: { id: string; name: string; icon: string };
  distance?: number | null;
}
```

### Review Data Shape
```typescript
interface Review {
  id: string;
  venue_id: string;
  user_id: string;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  user?: { id: string; full_name: string | null; avatar_url: string | null };
}
```

### Category Data Shape
```typescript
interface Category {
  id: string;
  name: string;
  icon: string; // Material icon name
  sort_order: number;
}
```

---

## Pages & Sections

### 1. Homepage (`/`)

#### Hero Section
- Full-width hero with a gradient overlay on a venue background image
- Headline: "Discover & Book Premium Venues" or "Find the Perfect Venue for Every Occasion"
- Subheadline: "From grand weddings to intimate gatherings — explore top-rated venues across Kerala"
- Two CTA buttons: "Explore Venues" (scrolls to venues section) and "Download App" (scrolls to download section)
- Subtle floating animation on decorative elements

#### Categories Section
- Fetched from `/api/categories`
- Horizontal scrollable row or grid of category cards
- Each card shows the category name and an appropriate icon
- Clicking a category navigates to `/venues?category={categoryName}`

#### Featured Venues Section
- Title: "Top Rated Venues"
- Grid of 4–6 venue cards fetched from `/api/venues` (sorted by rating)
- Each card shows: cover image, name, city, rating stars, price per day, capacity badge
- "View All Venues" link to `/venues`

#### How It Works Section
- 3-step visual flow:
  1. "Browse Venues" — Explore our curated collection of premium venues
  2. "Choose Your Date" — Check availability and pick your preferred date
  3. "Book via App" — Complete your booking securely through our mobile app
- Each step has an icon, title, and short description

#### Stats Section
- Animated counters showing:
  - Total venues available
  - Cities covered
  - Happy customers (can be a static impressive number like "5000+")
  - 5-star reviews

#### Testimonials / Reviews Section
- Fetch reviews from top venues (`/api/venues/:id/reviews` for top-rated venues)
- Display 3–4 review cards in a carousel/slider
- Each card: user avatar, name, rating stars, comment snippet, venue name

#### Download App Section (CTA)
- Eye-catching section with a phone mockup or app screenshots
- Title: "Book Venues On The Go"
- Subtitle: "Download the ZVenue app for the best booking experience with exclusive subscriber benefits"
- **Google Play Store badge/button** — Link: `https://play.google.com/store/apps/details?id=com.zvenue.app` (placeholder)
- **Apple App Store badge/button** — Link: `https://apps.apple.com/app/zvenue/id000000000` (placeholder)
- Use official badge SVGs from Google and Apple
- Optional: QR code that links to a smart link (detects OS)

#### Footer
- ZVenue logo and tagline
- Quick links: Home, Venues, Categories, About, Contact
- Contact info: support@zvenue.in, +91 97876 54321
- Social media icons (Instagram, Facebook, YouTube — placeholder links)
- App download badges (smaller, repeated)
- "© 2025 ZVenue. All rights reserved."

---

### 2. Venues Listing Page (`/venues`)

- Page title: "Explore Venues"
- **Filters bar:**
  - Category dropdown (fetched from API)
  - City filter (extracted from venue data)
  - Sort by: Rating, Price (Low to High), Price (High to Low), Capacity
- **Venue grid:** Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- **Venue card:** Cover image, name, city + location, category badge, star rating, price per day, capacity, "View Details" button
- Clicking a card navigates to `/venues/[id]`
- Empty state if no venues match filters

---

### 3. Venue Detail Page (`/venues/[id]`)

- Fetched from `/api/venues/:id`
- **Image gallery:** Hero carousel of venue images (swipeable on mobile)
- **Venue info:**
  - Name (large heading)
  - Location with map pin icon + city
  - Category badge
  - Star rating with review count
  - Owner name and image (if available)
- **Description:** Full venue description text
- **Key Details grid:**
  - Capacity (with users icon)
  - Area (with ruler icon)
  - Price per hour
  - Price per day
  - Registration fee
- **Amenities:** Grid/flex of amenity badges with icons
- **Subscriber Benefits:** List with checkmark icons (highlighted section)
- **YouTube Video:** Embedded YouTube player if `youtube_url` exists
- **Reviews Section:**
  - Fetched from `/api/venues/:id/reviews?page=1&limit=5`
  - Average rating display with star breakdown
  - List of review cards (avatar, name, rating, comment, date)
  - "See all reviews in the app" note
- **CTA Banner:** "Want to book this venue? Download the ZVenue app!" with app store badges
- **No booking form** — just a clear message directing users to the app

---

### 4. About Page (`/about`) — Optional

- Brief story about ZVenue
- Mission: Making venue discovery and booking seamless
- Team section (optional, can be placeholder)
- Values: Trust, Quality, Convenience

---

### 5. Contact Page (`/contact`) — Optional

- Contact form (name, email, message) — can be a simple mailto link or Formspree integration
- Contact details: email, phone
- Office location (if applicable)
- Social media links

---

## Download App Section — Detailed Spec

This section should appear:
1. As a dedicated section on the homepage (prominent, above footer)
2. As a sticky/floating banner on venue detail pages
3. As a CTA in the footer (compact version)

### Content
```
Title: "Get the ZVenue App"
Subtitle: "The best venue booking experience — right in your pocket. Browse venues, check availability, and book instantly."

Features list (with icons):
✓ Browse 100+ premium venues
✓ Real-time availability checking
✓ Secure payments via Razorpay
✓ Exclusive subscriber discounts
✓ Instant booking confirmations
✓ Reviews from verified customers
```

### App Store Links
- **Google Play:** `https://play.google.com/store/apps/details?id=com.zvenue.app`
- **App Store:** `https://apps.apple.com/app/zvenue/id000000000`

Use the official "Get it on Google Play" and "Download on the App Store" badge images:
- Google Play: `https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png`
- App Store: `https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg`

### Design
- Background: Gradient from primary to primary-light, or a warm-toned image with overlay
- Phone mockup showing the app UI (use a placeholder device frame with a screenshot)
- Badges should be large and tappable (min 48px height)
- On mobile: stack vertically; on desktop: side by side with phone mockup

---

## Important Rules

1. **NO functional features** — No login, signup, booking forms, payment integration, review submission, or user accounts on the website.
2. **Display only** — The website only READS and DISPLAYS data from the API. All actions (booking, reviewing, subscribing) are directed to the mobile app.
3. **App download CTAs everywhere** — Every page should have at least one clear call-to-action to download the mobile app.
4. **SEO optimized** — Proper meta tags, Open Graph tags, structured data (JSON-LD for LocalBusiness), semantic HTML.
5. **Performance** — Use Next.js Image component for optimized images, lazy loading, ISR for data freshness.
6. **Accessibility** — Proper alt texts, ARIA labels, keyboard navigation, color contrast compliance.
7. **Indian locale** — Prices in ₹ with Indian number formatting (₹1,50,000 not ₹150,000). Use `toLocaleString('en-IN')`.
8. **Responsive** — Must look great on mobile (375px), tablet (768px), and desktop (1440px+).
9. **Loading states** — Skeleton loaders for data-fetching sections.
10. **Error handling** — Graceful fallbacks if API is unreachable (show cached data or "Coming soon" states).

---

## File Structure

```
zvenue-website/
├── app/
│   ├── layout.tsx          # Root layout with fonts, metadata
│   ├── page.tsx            # Homepage
│   ├── venues/
│   │   ├── page.tsx        # Venues listing
│   │   └── [id]/
│   │       └── page.tsx    # Venue detail
│   ├── about/
│   │   └── page.tsx
│   └── contact/
│       └── page.tsx
├── components/
│   ├── layout/
│   │   ├── header.tsx      # Navigation bar
│   │   ├── footer.tsx      # Footer with app badges
│   │   └── mobile-nav.tsx  # Mobile hamburger menu
│   ├── sections/
│   │   ├── hero.tsx
│   │   ├── categories.tsx
│   │   ├── featured-venues.tsx
│   │   ├── how-it-works.tsx
│   │   ├── stats.tsx
│   │   ├── testimonials.tsx
│   │   └── download-app.tsx
│   ├── venue-card.tsx
│   ├── review-card.tsx
│   ├── star-rating.tsx
│   ├── category-badge.tsx
│   ├── app-store-badges.tsx
│   └── ui/                 # Reusable UI primitives
├── lib/
│   ├── api.ts              # API fetch functions
│   ├── types.ts            # TypeScript interfaces
│   └── utils.ts            # formatPrice, etc.
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── phone-mockup.png
│   │   └── hero-bg.jpg
│   └── badges/
│       ├── google-play.png
│       └── app-store.svg
├── tailwind.config.ts
├── next.config.ts
└── .env.local              # NEXT_PUBLIC_API_URL=https://api.zvenue.in
```

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=https://zvenue.in
NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.zvenue.app
NEXT_PUBLIC_APP_STORE_URL=https://apps.apple.com/app/zvenue/id000000000
```

---

## Tailwind Config Additions

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7a3317',
          light: '#a85c3b',
          lighter: '#d4956b',
          50: '#fdf6f0',
          100: '#f9e8d9',
          200: '#f0c9a8',
          300: '#d4956b',
          400: '#a85c3b',
          500: '#7a3317',
          600: '#5c2511',
          700: '#3d1a0b',
        },
        background: '#FAFAF8',
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
}
```

---

## Key Component Behaviors

### Header/Navbar
- Sticky on scroll with backdrop blur
- Logo on left, nav links center, "Download App" button on right
- Mobile: hamburger menu with slide-in drawer
- Links: Home, Venues, Categories, About, Download App

### Venue Card (reusable)
- Hover: subtle scale(1.02) + shadow increase
- Image with lazy loading and blur placeholder
- Overlay gradient on image bottom for text readability
- Rating stars (filled gold, empty gray)
- Price formatted as "₹X,XXX/day"

### Download App Section
- Appears on every page in some form
- Homepage: full dedicated section with phone mockup
- Venue detail: floating bottom bar on mobile ("Book in App" button)
- All pages: footer includes compact app badges

---

## SEO & Metadata

```typescript
// app/layout.tsx metadata
export const metadata = {
  title: 'ZVenue — Discover & Book Premium Venues',
  description: 'Find and book the perfect venue for weddings, conferences, parties, and events across Kerala. Browse top-rated venues with photos, reviews, and instant availability.',
  keywords: 'venue booking, wedding halls Kerala, conference rooms Kochi, party venues, banquet halls, event spaces India',
  openGraph: {
    title: 'ZVenue — Premium Venue Booking',
    description: 'Discover top-rated venues for every occasion',
    images: ['/images/og-image.jpg'],
    type: 'website',
  },
}
```

---

## Summary

Build a beautiful, fast, SEO-optimized Next.js website that:
1. Fetches venue, category, and review data from the ZVenue API
2. Displays it in a premium, warm-toned design matching the brand
3. Drives users to download the mobile app for actual booking functionality
4. Works flawlessly on all devices
5. Has zero interactive/transactional features — purely a showcase and app download funnel
