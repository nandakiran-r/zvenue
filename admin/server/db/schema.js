import { pgTable, uuid, varchar, text, integer, boolean, real, timestamp, jsonb } from 'drizzle-orm/pg-core';
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
  // Subscription & Trial fields
  is_trial_used: boolean('is_trial_used').default(false),
  trial_ends_at: timestamp('trial_ends_at'),
  subscription_id: varchar('subscription_id', { length: 255 }),
  subscription_status: varchar('subscription_status', { length: 50 }).default('none'), // none, authenticated, active, pending, cancelled, halted
  next_billing_at: timestamp('next_billing_at'),
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
  image_url: text('image_url'),
  category_id: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  price_per_hour: real('price_per_hour').default(0),
  price_per_day: real('price_per_day').default(0),
  capacity: integer('capacity').default(0),
  rating: real('rating').default(0),
  review_count: integer('review_count').default(0),
  area: varchar('area', { length: 255 }),
  amenities: jsonb('amenities').default('[]'),
  owner_name: varchar('owner_name', { length: 255 }),
  owner_image: text('owner_image'),
  available_dates: jsonb('available_dates').default('[]'),
  created_at: timestamp('created_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
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
export const venuesRelations = relations(venues, ({ one, many }) => ({
  category: one(categories, {
    fields: [venues.category_id],
    references: [categories.id],
  }),
  bookings: many(bookings),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  venues: many(venues),
}));

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  notifications: many(notifications),
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
