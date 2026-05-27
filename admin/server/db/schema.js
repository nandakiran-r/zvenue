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
