import { pgTable, uuid, varchar, text, integer, boolean, real, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  first_name: varchar('first_name', { length: 255 }).notNull().default(''),
  last_name: varchar('last_name', { length: 255 }).notNull().default(''),
  full_name: varchar('full_name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique().notNull().default(''),
  phone_number: varchar('phone_number', { length: 20 }).unique().notNull().default(''),
  password: text('password'),
  phone_verified: boolean('phone_verified').default(false),
  avatar_url: text('avatar_url'),
  // Subscription fields
  subscription_id: varchar('subscription_id', { length: 255 }),
  subscription_status: varchar('subscription_status', { length: 50 }).default('none'),
  next_billing_at: timestamp('next_billing_at'),
  push_token: varchar('push_token', { length: 255 }),
  created_at: timestamp('created_at').defaultNow(),
});

export const owners = pgTable('owners', {
  id: uuid('id').primaryKey().defaultRandom(),
  full_name: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone_number: varchar('phone_number', { length: 20 }).unique().notNull(),
  password: text('password').notNull(),
  avatar_url: text('avatar_url'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 50 }).default('celebration'),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at').defaultNow(),
});

export const otps = pgTable('otps', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone_number: varchar('phone_number', { length: 20 }).notNull(),
  otp: varchar('otp', { length: 10 }).notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const venues = pgTable('venues', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  city: varchar('city', { length: 255 }).notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  // Multiple images (up to 6) - first is cover
  images: jsonb('images').default('[]'),
  image_url: text('image_url'), // kept for backward compat (cover image)
  youtube_url: varchar('youtube_url', { length: 500 }),
  category_id: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  owner_id: uuid('owner_id').references(() => owners.id, { onDelete: 'set null' }),
  price_per_hour: real('price_per_hour').default(0),
  price_per_day: real('price_per_day').default(0),
  capacity: integer('capacity').default(0),
  registration_fee: real('registration_fee').default(0),
  rating: real('rating').default(0),
  review_count: integer('review_count').default(0),
  area: varchar('area', { length: 255 }),
  amenities: jsonb('amenities').default('[]'),
  subscriber_benefits: jsonb('subscriber_benefits').default('[]'),
  blocked_dates: jsonb('blocked_dates').default('[]'),
  // Approval workflow
  approval_status: varchar('approval_status', { length: 50 }).default('approved'), // pending_review, approved, pending_changes, rejected
  pending_changes: jsonb('pending_changes'), // stores proposed changes when owner edits approved venue
  owner_name: varchar('owner_name', { length: 255 }),
  owner_image: text('owner_image'),
  available_dates: jsonb('available_dates').default('[]'),
  created_at: timestamp('created_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  booking_id_display: varchar('booking_id_display', { length: 13 }).unique(),
  venue_id: uuid('venue_id').references(() => venues.id),
  user_id: uuid('user_id').references(() => users.id),
  booking_date: varchar('booking_date', { length: 50 }).notNull().default(''),
  start_time: varchar('start_time', { length: 50 }),
  end_time: varchar('end_time', { length: 50 }),
  guests: integer('guests').default(1),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  subtotal: integer('subtotal').notNull().default(0),
  service_fee: integer('service_fee').notNull().default(0),
  total: integer('total').notNull(),
  payment_method: varchar('payment_method', { length: 50 }).default('razorpay'),
  order_id: varchar('order_id', { length: 255 }),
  payment_id: varchar('payment_id', { length: 255 }),
  signature: varchar('signature', { length: 500 }),
  // Pre-booking fields
  transaction_id: varchar('transaction_id', { length: 64 }),
  registration_fee_paid: real('registration_fee_paid').default(0),
  remaining_balance: real('remaining_balance').default(0),
  paid_at: timestamp('paid_at'),
  created_at: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  type: varchar('type', { length: 50 }).default('announcement'),
  is_read: boolean('is_read').default(false),
  data: jsonb('data'),
  created_at: timestamp('created_at').defaultNow(),
});

// Relations
export const support_tickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  owner_id: uuid('owner_id').references(() => owners.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high
  status: varchar('status', { length: 20 }).default('open'), // open, in_progress, resolved, closed
  admin_reply: text('admin_reply'),
  replied_at: timestamp('replied_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Reviews
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  venue_id: uuid('venue_id').references(() => venues.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'), // nullable, max 500 chars enforced at API level
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('reviews_venue_id_idx').on(table.venue_id),
  index('reviews_user_id_idx').on(table.user_id),
  uniqueIndex('reviews_user_venue_unique').on(table.venue_id, table.user_id),
]);

// Relations
export const ownersRelations = relations(owners, ({ many }) => ({
  venues: many(venues),
  tickets: many(support_tickets),
  service_listings: many(service_listings),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  category: one(categories, {
    fields: [venues.category_id],
    references: [categories.id],
  }),
  owner: one(owners, {
    fields: [venues.owner_id],
    references: [owners.id],
  }),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  venues: many(venues),
}));

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  notifications: many(notifications),
  reviews: many(reviews),
  service_bookings: many(service_bookings),
  service_reviews: many(service_reviews),
  service_favorites: many(service_favorites),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  venue: one(venues, {
    fields: [bookings.venue_id],
    references: [venues.id],
  }),
  user: one(users, {
    fields: [bookings.user_id],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(support_tickets, ({ one }) => ({
  owner: one(owners, {
    fields: [support_tickets.owner_id],
    references: [owners.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  venue: one(venues, {
    fields: [reviews.venue_id],
    references: [venues.id],
  }),
  user: one(users, {
    fields: [reviews.user_id],
    references: [users.id],
  }),
}));

// ─── SERVICE MARKETPLACE ────────────────────────────────────────────────────

export const service_categories = pgTable('service_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 50 }).default('star'),
  sort_order: integer('sort_order').default(0),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
});

export const service_listings = pgTable('service_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  service_category_id: uuid('service_category_id').references(() => service_categories.id, { onDelete: 'cascade' }).notNull(),
  owner_id: uuid('owner_id').references(() => owners.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  images: jsonb('images').default('[]'), // max 5 URLs
  video_url: varchar('video_url', { length: 500 }),
  price: real('price').notNull().default(0),
  quantity_available: integer('quantity_available').notNull().default(0),
  city: varchar('city', { length: 255 }).notNull(),
  area: varchar('area', { length: 255 }),
  subscriber_discount_percent: integer('subscriber_discount_percent').default(0), // 0-50
  subscriber_benefits: jsonb('subscriber_benefits').default('[]'),
  rating: real('rating').default(0),
  review_count: integer('review_count').default(0),
  is_active: boolean('is_active').default(true),
  approval_status: varchar('approval_status', { length: 50 }).default('approved'), // pending_review, approved, pending_changes, rejected
  pending_changes: jsonb('pending_changes'),
  owner_name: varchar('owner_name', { length: 255 }),
  owner_image: text('owner_image'),
  created_at: timestamp('created_at').defaultNow(),
});

export const service_bookings = pgTable('service_bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  booking_id_display: varchar('booking_id_display', { length: 13 }).unique(),
  service_listing_id: uuid('service_listing_id').references(() => service_listings.id, { onDelete: 'set null' }),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull().default(1),
  unit_price: real('unit_price').notNull(),
  discount_applied: real('discount_applied').default(0),
  total_amount: real('total_amount').notNull(),
  payment_method: varchar('payment_method', { length: 50 }).default('razorpay'),
  order_id: varchar('order_id', { length: 255 }),
  payment_id: varchar('payment_id', { length: 255 }),
  signature: varchar('signature', { length: 500 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, confirmed, cancelled, refunded, payment_failed
  cancellation_reason: text('cancellation_reason'),
  refunded_at: timestamp('refunded_at'),
  created_at: timestamp('created_at').defaultNow(),
});

export const service_reviews = pgTable('service_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  service_listing_id: uuid('service_listing_id').references(() => service_listings.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'), // max 500 chars enforced at API level
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('service_reviews_listing_idx').on(table.service_listing_id),
  index('service_reviews_user_idx').on(table.user_id),
  uniqueIndex('service_reviews_user_listing_unique').on(table.service_listing_id, table.user_id),
]);

export const service_favorites = pgTable('service_favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  service_listing_id: uuid('service_listing_id').references(() => service_listings.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  uniqueIndex('service_favorites_user_listing_unique').on(table.service_listing_id, table.user_id),
]);

// ─── SERVICE MARKETPLACE RELATIONS ──────────────────────────────────────────

export const serviceCategoriesRelations = relations(service_categories, ({ many }) => ({
  listings: many(service_listings),
}));

export const serviceListingsRelations = relations(service_listings, ({ one, many }) => ({
  category: one(service_categories, {
    fields: [service_listings.service_category_id],
    references: [service_categories.id],
  }),
  owner: one(owners, {
    fields: [service_listings.owner_id],
    references: [owners.id],
  }),
  bookings: many(service_bookings),
  reviews: many(service_reviews),
  favorites: many(service_favorites),
}));

export const serviceBookingsRelations = relations(service_bookings, ({ one }) => ({
  listing: one(service_listings, {
    fields: [service_bookings.service_listing_id],
    references: [service_listings.id],
  }),
  user: one(users, {
    fields: [service_bookings.user_id],
    references: [users.id],
  }),
}));

export const serviceReviewsRelations = relations(service_reviews, ({ one }) => ({
  listing: one(service_listings, {
    fields: [service_reviews.service_listing_id],
    references: [service_listings.id],
  }),
  user: one(users, {
    fields: [service_reviews.user_id],
    references: [users.id],
  }),
}));

export const serviceFavoritesRelations = relations(service_favorites, ({ one }) => ({
  listing: one(service_listings, {
    fields: [service_favorites.service_listing_id],
    references: [service_listings.id],
  }),
  user: one(users, {
    fields: [service_favorites.user_id],
    references: [users.id],
  }),
}));
