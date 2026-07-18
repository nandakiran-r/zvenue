# ZVenue Admin Dashboard

A comprehensive web-based management portal for venue owners and administrators to manage venues, bookings, services, and view analytics.

## 🎯 Overview

The ZVenue Admin Dashboard is a full-featured web application built with React, Vite, and modern tooling. It provides administrators and venue owners with complete control over their venues, bookings, services, and customer interactions.

## ✨ Features

### Venue Management
- Create, edit, and delete venues
- Upload and manage venue images
- Configure amenities and features
- Set pricing and availability
- Manage venue categories
- View venue statistics

### Booking Management
- View all venue bookings
- Manage booking status (confirmed, cancelled, completed)
- Track booking history
- Generate booking reports
- Handle customer inquiries

### Service Management
- Create and manage services
- Configure service pricing
- Set service availability
- Manage service bookings
- Track service performance

### Review & Ratings Management
- Monitor customer reviews
- Respond to reviews
- Manage review visibility
- Track rating trends
- Identify improvement areas

### User Management
- View user profiles
- Manage user access
- Track user activity
- Handle user complaints
- Send user notifications

### Analytics & Reporting
- Dashboard with key metrics
- Booking trends and statistics
- Revenue analytics
- Customer insights
- Performance reports
- Export data for analysis

### Admin Settings
- System configuration
- Role management
- Notification settings
- Content management (FAQs, Help Center, Legal)
- Integration settings
- Appearance & theme

### Additional Features
- **Dark/Light Mode**: Theme switching for better usability
- **Responsive Design**: Works on desktop, tablet, and mobile
- **RTL Support**: Full right-to-left language support (Arabic, Hebrew, etc.)
- **Real-time Notifications**: Live updates for bookings and events
- **Advanced Search**: Filter and search across all data
- **Data Export**: Export reports to CSV/Excel
- **Accessibility**: WCAG compliant interface

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 |
| **Build Tool** | Vite 6 |
| **Routing** | TanStack Router 1 |
| **Language** | TypeScript 5.9 |
| **UI Components** | ShadcnUI (TailwindCSS + RadixUI) |
| **State Management** | Zustand 5 |
| **Server State** | React Query (TanStack Query) 5 |
| **Data Tables** | TanStack React Table 8 |
| **Forms** | React Hook Form 7 + Zod 4 |
| **Charts** | Recharts 3 |
| **Icons** | Lucide Icons 1 |
| **Styling** | TailwindCSS 4 |
| **HTTP Client** | Axios 1 |
| **Validation** | Zod 4 |
| **Code Quality** | ESLint 10 + Prettier |
| **Testing** | Vitest + Playwright |

### Backend Server
The admin dashboard connects to a Node.js backend:
- **Runtime**: Node.js
- **Framework**: Fastify 5
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: JWT + better-auth

## 📁 Project Structure

```
admin/
├── src/
│   ├── routes/                    # Page routes (file-based routing)
│   │   ├── (auth)/               # Authentication pages
│   │   │   ├── sign-in.tsx      # Login page
│   │   │   ├── sign-up.tsx      # Registration page
│   │   │   └── forgot-password.tsx
│   │   └── _authenticated/       # Protected routes (require auth)
│   │       ├── venues/           # Venue management
│   │       ├── bookings/         # Booking management
│   │       ├── services/         # Service management
│   │       ├── service-bookings/ # Service bookings
│   │       ├── reviews/          # Review management
│   │       ├── users/            # User management
│   │       ├── categories/       # Category management
│   │       ├── analytics/        # Analytics dashboard
│   │       ├── dashboard/        # Main dashboard
│   │       ├── notifications/    # Notification management
│   │       ├── app-content/      # Content management
│   │       ├── help-center/      # Help center
│   │       ├── settings/         # Admin settings
│   │       └── errors/           # Error pages
│   │
│   ├── features/                 # Feature modules (grouped by domain)
│   │   ├── venues/              # Venue feature logic
│   │   ├── bookings-management/ # Booking business logic
│   │   ├── services/            # Service management
│   │   ├── reviews/             # Review management
│   │   ├── users/               # User management
│   │   ├── categories/          # Category management
│   │   ├── analytics/           # Analytics feature
│   │   ├── dashboard/           # Dashboard logic
│   │   ├── auth/                # Authentication
│   │   ├── notifications-management/ # Notifications
│   │   ├── app-content/         # Content management
│   │   ├── help-center/         # Help center
│   │   ├── settings/            # Settings
│   │   └── owners/              # Venue owner management
│   │
│   ├── components/
│   │   ├── ui/                  # ShadcnUI components
│   │   ├── data-table/          # Data table component
│   │   ├── layout/              # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── ...
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── stores/                  # Zustand state stores
│   ├── context/                 # React context
│   ├── lib/                     # Utility functions
│   │   ├── api.ts              # API client
│   │   └── utils.ts            # Helper functions
│   ├── config/                  # Configuration
│   ├── assets/                  # Images, icons, fonts
│   ├── styles/                  # Global styles
│   ├── test-utils/             # Testing utilities
│   └── App.tsx                 # Root component
│
├── server/                       # Backend API
│   ├── index.js                # Fastify server entry
│   ├── db/                     # Database configuration
│   │   ├── index.js           # DB client
│   │   └── schema.js          # Drizzle schema
│   ├── drizzle/               # ORM migrations
│   ├── lib/                   # Server utilities
│   ├── tests/                 # Server tests
│   ├── package.json
│   └── .env.local
│
├── public/                      # Static assets
│   └── images/
│
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # TailwindCSS config
├── tsconfig.json               # TypeScript config
├── eslint.config.js            # ESLint config
├── prettier.config.js          # Prettier config
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ ([install with nvm](https://github.com/nvm-sh/nvm))
- Bun ([install](https://bun.sh/docs/installation))

### Installation

```bash
# Install dependencies
bun install

# Install server dependencies
cd server && bun install && cd ..
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Copy server environment
cp server/.env.production.example server/.env.local
```

**Required Environment Variables** (`.env.local`):
```env
VITE_API_URL=http://localhost:3000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**Server Environment** (`server/.env.local`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/zvenue
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEON_API_KEY=your_neon_api_key
PORT=3000
NODE_ENV=development
```

### Database Setup

```bash
cd server

# Run migrations
npm run migrate

# Seed demo data (optional)
node seed-demo-venues.js

# Create admin user
node create-admin.js
```

### Development

```bash
# Terminal 1: Start backend server
cd server
bun run dev

# Terminal 2: Start frontend dev server (different terminal)
bun run dev
```

Visit `http://localhost:5173` in your browser.

## 🧪 Testing

```bash
# Run all tests
bun test

# Watch mode
bun test:watch

# Coverage report
bun test:coverage

# UI mode
bun test:ui

# Browser testing
bun test:browser
```

## 🔧 Configuration

### TailwindCSS
Custom configuration in `tailwind.config.ts` includes:
- Dark mode support
- Custom color schemes
- RTL layout support
- Custom spacing and typography

### TypeScript
Strict mode enabled with path aliases:
- `@/*` - Maps to `src/*`
- `@components/*` - Maps to `src/components/*`
- etc.

### ESLint & Prettier
Code quality tools configured for:
- React best practices
- Import sorting
- Code formatting
- Accessibility checks

## 🎨 UI Customization

### Components
ShadcnUI components can be added/updated:
```bash
# Add a new ShadcnUI component
npx shadcn-ui@latest add button
```

### Colors & Theming
Customize colors in `tailwind.config.ts`:
```ts
colors: {
  primary: '#your-color',
  secondary: '#your-color',
  // ...
}
```

### RTL Support
RTL is automatically applied based on browser language:
- Components use logical CSS properties
- Layout directives handle text direction
- Form inputs support RTL text

## 🔐 Security

- **Authentication**: JWT tokens stored securely
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schema validation
- **HTTPS**: All production traffic encrypted
- **CORS**: Configured for allowed origins
- **Rate Limiting**: Backend rate limiting enabled
- **Secure Headers**: Helmet middleware on backend

## 📊 API Integration

The dashboard connects to the backend API at the URL specified in `VITE_API_URL`.

### Key Endpoints
- `POST /auth/signin` - Login
- `POST /auth/signup` - Register
- `GET /venues` - List venues
- `POST /venues` - Create venue
- `GET /bookings` - List bookings
- `POST /bookings` - Create booking
- `GET /services` - List services
- `GET /reviews` - List reviews
- `GET /analytics` - Analytics data

## 🚀 Build & Deployment

### Build for Production
```bash
bun run build

# Output in ./dist
```

### Deploy Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify
```bash
# Connect GitHub repo and deploy through Netlify UI
# Or use Netlify CLI
netlify deploy
```

#### Docker
```bash
docker build -t zvenue-admin .
docker run -p 3000:3000 zvenue-admin
```

#### Traditional Hosting
```bash
# Upload dist/ folder to your server
# Configure web server to serve index.html for all routes
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.ts or use environment variable
VITE_PORT=5174 bun run dev
```

### API Connection Error
```bash
# Verify backend is running
curl http://localhost:3000/health

# Check VITE_API_URL environment variable
echo $VITE_API_URL
```

### Database Connection Issue
```bash
cd server
node check_db.js
```

## 📚 Resources

- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/)
- [TanStack Router](https://tanstack.com/router/latest)
- [ShadcnUI Components](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query/latest)
- [Zod Validation](https://zod.dev)

## 📝 Code Standards

- Write clean, readable code
- Use TypeScript for type safety
- Follow ESLint/Prettier rules
- Write tests for features
- Document complex logic
- Use meaningful variable names

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## 📄 License

Private and proprietary. All rights reserved.

## 📧 Contact

For questions or support, contact the development team.

---

**Last Updated**: June 2024
**Version**: 1.0.0
**Status**: In Active Development
