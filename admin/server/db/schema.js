import { pgTable, uuid, varchar, text, integer, boolean, real, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  full_name: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone_number: varchar('phone_number', { length: 20 }).unique(),
  password: text('password'),
  phone_verified: boolean('phone_verified').default(false),
  avatar_url: text('avatar_url'),
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
  total: integer('total').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
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
