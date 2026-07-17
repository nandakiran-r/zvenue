# ZVenue - Venue Booking Platform

A comprehensive cross-platform venue and service booking platform built with modern technologies. ZVenue enables users to discover, book, and review venues and services while providing venue owners with a complete management dashboard.

## 📋 Project Overview

ZVenue is a full-stack mobile and web application ecosystem consisting of:

- **Mobile App**: Native iOS/Android application for browsing, booking venues and services, managing bookings, and writing reviews
- **Admin Dashboard**: Web-based management portal for venue owners and administrators to manage venues, bookings, services, and analytics
- **Backend API**: Secure, scalable Node.js API server handling all business logic, payments, and data management

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     ZVenue Ecosystem                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐              │
│  │   Mobile App     │      │  Admin Dashboard │              │
│  │  (Expo/React)    │      │  (Vite/React)    │              │
│  └────────┬─────────┘      └────────┬─────────┘              │
│           │                         │                         │
│           └──────────┬──────────────┘                         │
│                      │                                        │
│           ┌──────────▼──────────┐                            │
│           │   Fastify Backend   │                            │
│           │   - REST API        │                            │
│           │   - Auth (JWT)      │                            │
│           │   - Payments        │                            │
│           │   - Notifications   │                            │
│           └──────────┬──────────┘                            │
│                      │                                        │
│           ┌──────────▼──────────┐                            │
│           │   PostgreSQL        │                            │
│           │   (Neon Database)   │                            │
│           └─────────────────────┘                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Mobile App
- **Framework**: [Expo](https://expo.dev) + [React Native](https://reactnative.dev)
- **Routing**: [Expo Router](https://docs.expo.dev/routing/introduction/)
- **Language**: TypeScript
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Server State**: [React Query](https://tanstack.com/query)
- **UI Components**: Lucide React Native Icons
- **Payment**: Razorpay
- **Authentication**: JWT + Secure Storage
- **Location**: Expo Location API
- **Notifications**: Expo Notifications

### Admin Dashboard
- **Framework**: [React](https://react.dev) + [Vite](https://vitejs.dev)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **Language**: TypeScript
- **UI Framework**: [ShadcnUI](https://ui.shadcn.com) + [TailwindCSS](https://tailwindcss.com)
- **State Management**: Zustand
- **Server State**: React Query
- **Data Tables**: TanStack React Table
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Localization**: RTL Support (Arabic, Hebrew, etc.)
- **Icons**: Lucide React, Tabler Icons

### Backend API
- **Runtime**: Node.js
- **Framework**: [Fastify](https://www.fastify.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Neon Serverless)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [better-auth](https://www.better-auth.com/)
- **Security**: 
  - JWT Token-based authentication
  - Argon2 password hashing
  - Helmet for HTTP headers
  - CORS protection
  - Rate limiting
- **Payment Processing**: [Razorpay](https://razorpay.com/)
- **PDF Generation**: PDFKit
- **Database Migrations**: Drizzle Kit

## 📁 Project Structure

```
zvenue/
├── app/                          # Mobile app (Expo/React Native)
│   ├── (tabs)/                   # Tabbed navigation screens
│   │   ├── home.tsx             # Home/discover venues
│   │   ├── search.tsx           # Search venues & services
│   │   ├── favorites.tsx        # Saved favorites
│   │   ├── my-bookings.tsx      # User's bookings
│   │   └── profile.tsx          # User profile
│   ├── venue-detail.tsx         # Venue detail page
│   ├── service-detail.tsx       # Service detail page
│   ├── booking-confirmed.tsx    # Booking confirmation
│   ├── write-review.tsx         # Review submission
│   ├── login.tsx                # Authentication
│   ├── signup.tsx               # User registration
│   ├── onboarding.tsx           # App onboarding
│   └── _layout.tsx              # App root layout
│
├── admin/                        # Admin dashboard (Vite/React)
│   ├── src/
│   │   ├── routes/              # Page routes
│   │   │   ├── (auth)/         # Auth pages (login, signup)
│   │   │   └── _authenticated/ # Protected routes
│   │   │       ├── venues/     # Venue management
│   │   │       ├── bookings/   # Booking management
│   │   │       ├── services/   # Service listings
│   │   │       ├── reviews/    # Review management
│   │   │       ├── users/      # User management
│   │   │       ├── analytics/  # Analytics dashboard
│   │   │       └── settings/   # Admin settings
│   │   ├── features/           # Feature modules
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand state stores
│   │   └── lib/                # Utilities & helpers
│   ├── server/                 # Backend for admin
│   │   ├── index.js           # Fastify server
│   │   ├── db/                # Database config
│   │   ├── drizzle/           # Database schema & migrations
│   │   ├── lib/               # Server utilities
│   │   └── tests/             # Server tests
│   └── package.json
│
├── components/                  # Shared mobile components
│   ├── AppAlert.tsx
│   ├── ReviewCard.tsx
│   ├── VenueMap.tsx
│   └── ...
│
├── context/                     # React context (mobile)
│   ├── AuthContext.tsx
│   ├── FavoritesContext.tsx
│   └── ToastContext.tsx
│
├── store/                       # Zustand stores (mobile)
│   ├── authStore.ts           # Auth state
│   ├── favoritesStore.ts      # Favorites state
│   ├── locationStore.ts       # Location tracking
│   └── notificationStore.ts   # Notifications
│
├── lib/                         # Shared utilities & APIs
│   ├── api.ts                 # Main API client
│   ├── reviewApi.ts           # Review endpoints
│   ├── serviceApi.ts          # Service endpoints
│   ├── notifications.ts       # Push notifications
│   ├── types.ts               # TypeScript types
│   └── utils.ts               # Helper utilities
│
├── constants/                   # App constants
│   ├── colors.ts              # Color scheme
│   └── navigation.ts          # Navigation constants
│
├── assets/                      # Images & media
├── app.json                     # Expo configuration
├── package.json                 # Mobile app dependencies
└── tsconfig.json               # TypeScript config
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v16+ (Install with [nvm](https://github.com/nvm-sh/nvm))
- **Bun**: Package manager ([Install](https://bun.sh/docs/installation))
- **Expo CLI**: `bun i -g expo-cli`
- **Git**: Version control

### Installation & Setup

#### 1. Clone Repository

```bash
git clone <YOUR_GIT_URL>
cd zvenue
```

#### 2. Install Dependencies

```bash
# Install root dependencies
bun install

# Install admin server dependencies
cd admin/server
bun install
cd ../..
```

#### 3. Environment Configuration

Create environment files:

```bash
# Mobile app
cp .env.production.example .env.local

# Admin dashboard
cp admin/.env.example admin/.env.local
cp admin/.env.production.example admin/.env.production.local

# Admin server
cp admin/server/.env.production.example admin/server/.env.local
```

**Required Environment Variables:**

```env
# Mobile App (.env.local)
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key

# Admin Dashboard (admin/.env.local)
VITE_API_URL=http://localhost:3000
VITE_RAZORPAY_KEY_ID=your_razorpay_key

# Admin Server (admin/server/.env.local)
DATABASE_URL=postgresql://user:password@localhost:5432/zvenue
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
NODE_ENV=development
PORT=3000
```

#### 4. Database Setup

```bash
cd admin/server

# Create database
npm run migrate

# Seed demo data (optional)
node seed-demo-venues.js
```

#### 5. Start Development Servers

```bash
# Terminal 1: Backend API server
cd admin/server
bun run dev

# Terminal 2: Mobile app (different terminal)
bun run start
# Then press 'i' for iOS, 'a' for Android, or 'w' for web

# Terminal 3: Admin dashboard (different terminal)
cd admin
bun run dev
```

## 📱 Features

### Mobile App Features
- ✅ **Browse Venues**: Discover venues by category and location
- ✅ **Venue Details**: View amenities, pricing, ratings, and images
- ✅ **Booking System**: Book venues with date/time selection
- ✅ **Service Marketplace**: Browse and book services
- ✅ **Reviews & Ratings**: Read and write detailed reviews
- ✅ **User Favorites**: Save favorite venues
- ✅ **Booking Management**: View, track, and cancel bookings
- ✅ **User Subscriptions**: Manage subscription plans
- ✅ **Profile Management**: Edit user information
- ✅ **Push Notifications**: Real-time booking updates
- ✅ **Location Services**: Find venues near you
- ✅ **Payment Integration**: Secure Razorpay payments

### Admin Dashboard Features
- ✅ **Venue Management**: Create, edit, and manage venues
- ✅ **Booking Management**: View and manage customer bookings
- ✅ **Service Management**: Create and manage service offerings
- ✅ **Review Moderation**: Manage and respond to reviews
- ✅ **User Management**: View and manage user accounts
- ✅ **Analytics Dashboard**: View bookings, revenue, trends
- ✅ **Category Management**: Manage venue categories
- ✅ **Content Management**: Help center, FAQs, legal content
- ✅ **Notifications**: Send push notifications to users
- ✅ **Settings & Configuration**: Admin panel controls
- ✅ **Dark/Light Mode**: Theme switching
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **RTL Support**: Right-to-left language support

## 🔌 API Documentation

### Base URL
```
Development: http://localhost:3000
Production: https://api.zvenue.com
```

### Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh JWT token

#### Venues
- `GET /venues` - List all venues
- `GET /venues/:id` - Get venue details
- `POST /venues` - Create venue (admin)
- `PUT /venues/:id` - Update venue (admin)
- `DELETE /venues/:id` - Delete venue (admin)

#### Bookings
- `GET /bookings` - User's bookings
- `POST /bookings` - Create booking
- `GET /bookings/:id` - Booking details
- `PUT /bookings/:id` - Update booking status

#### Services
- `GET /services` - List services
- `GET /services/:id` - Service details
- `POST /services` - Create service (admin)
- `POST /service-bookings` - Book service

#### Reviews
- `GET /reviews/:venueId` - Venue reviews
- `POST /reviews` - Submit review
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

#### Payments
- `POST /payments/razorpay/webhook` - Razorpay webhook
- `GET /payments/orders/:id` - Get payment order status

## 🧪 Testing

```bash
# Mobile app tests
bun test

# Admin dashboard tests
cd admin
bun test              # Run tests once
bun test:watch      # Watch mode
bun test:coverage   # Coverage report

# Admin server tests
cd admin/server
npm test
```

## 🐳 Deployment

### Mobile App (EAS Build)

```bash
# Install EAS CLI
bun i -g @expo/eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Admin Dashboard

```bash
# Build for production
cd admin
bun run build

# Output will be in admin/dist/
# Deploy to any static hosting (Vercel, Netlify, Azure, etc.)
```

### Backend API

#### Option 1: Docker (Recommended)
```bash
cd admin/server
docker build -t zvenue-api .
docker run -p 3000:3000 --env-file .env.production zvenue-api
```

#### Option 2: Traditional Deployment
```bash
cd admin/server
npm run build
npm start
```

#### Option 3: Render.com
```bash
# Uses render.yaml configuration
# Connect GitHub repo to Render and push to deploy
```

#### Option 4: Azure
See `AZURE_DEPLOYMENT_GUIDE.md` for detailed instructions.

#### Option 5: Cloudflare Tunnel
```bash
# For local development exposure
./start-local-server.sh
# See CLOUDFLARE_TUNNEL_GUIDE.md for details
```

## 🔐 Security Considerations

- ✅ **Password Security**: Argon2 hashing
- ✅ **JWT Tokens**: Secure token-based authentication
- ✅ **HTTPS Only**: All production traffic encrypted
- ✅ **Rate Limiting**: Prevent brute force attacks
- ✅ **CORS**: Configured for allowed origins
- ✅ **Helmet**: HTTP security headers
- ✅ **Input Validation**: Zod schema validation
- ✅ **SQL Injection Prevention**: Drizzle ORM parameterized queries
- ✅ **XSS Protection**: React/Expo frameworks provide built-in protection
- ✅ **Secure Storage**: Expo Secure Store for sensitive data

## 📊 Database Schema

Key tables:
- `users` - User accounts and profiles
- `venues` - Venue information and details
- `bookings` - Venue bookings
- `services` - Service listings
- `service_bookings` - Service bookings
- `reviews` - Venue/service reviews
- `categories` - Venue categories
- `service_categories` - Service categories
- `payments` - Payment records
- `subscriptions` - User subscriptions
- `notifications` - User notifications

See `admin/server/drizzle/` for complete schema.

## 🚨 Production Checklist

Before deploying to production:
1. Review `PRODUCTION_CHECKLIST.md`
2. Configure environment variables
3. Set up SSL/HTTPS certificates
4. Configure database backups
5. Set up monitoring and logging
6. Test payment gateway (Razorpay)
7. Configure push notifications
8. Set up error tracking
9. Performance testing
10. Security audit

## 🔧 Troubleshooting

### Common Issues

**API Connection Errors**
```bash
# Verify backend is running
curl http://localhost:3000/health

# Check environment variables
echo $EXPO_PUBLIC_API_URL
```

**Database Connection Issues**
```bash
# Test database connection
cd admin/server
node check_db.js
```

**Expo Build Failures**
```bash
# Clear cache and rebuild
expo start --clear
```

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Fastify Guide](https://www.fastify.io/docs/)
- [Drizzle ORM](https://orm.drizzle.team/docs)
- [TanStack Router](https://tanstack.com/router/latest)
- [ShadcnUI](https://ui.shadcn.com/)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## 📝 License

This project is private and proprietary. All rights reserved.

## 📧 Support

For questions or issues, contact the development team at jerytom33@gmail.com

---

**Last Updated**: June 2024
**Current Version**: 1.0.0
**Status**: In Active Development
