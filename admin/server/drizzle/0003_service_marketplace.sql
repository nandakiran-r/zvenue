-- Service Marketplace: Create tables for service categories, listings, bookings, reviews, and favorites

-- Service Categories
CREATE TABLE IF NOT EXISTS "service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(50) DEFAULT 'star',
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);

-- Service Listings
CREATE TABLE IF NOT EXISTS "service_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_category_id" uuid NOT NULL,
	"owner_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"images" jsonb DEFAULT '[]',
	"video_url" varchar(500),
	"price" real NOT NULL DEFAULT 0,
	"quantity_available" integer NOT NULL DEFAULT 0,
	"city" varchar(255) NOT NULL,
	"area" varchar(255),
	"subscriber_discount_percent" integer DEFAULT 0,
	"subscriber_benefits" jsonb DEFAULT '[]',
	"rating" real DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"approval_status" varchar(50) DEFAULT 'approved',
	"pending_changes" jsonb,
	"owner_name" varchar(255),
	"owner_image" text,
	"created_at" timestamp DEFAULT now()
);

-- Service Bookings
CREATE TABLE IF NOT EXISTS "service_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id_display" varchar(13) UNIQUE,
	"service_listing_id" uuid,
	"user_id" uuid,
	"quantity" integer NOT NULL DEFAULT 1,
	"unit_price" real NOT NULL,
	"discount_applied" real DEFAULT 0,
	"total_amount" real NOT NULL,
	"payment_method" varchar(50) DEFAULT 'razorpay',
	"order_id" varchar(255),
	"payment_id" varchar(255),
	"signature" varchar(500),
	"status" varchar(50) NOT NULL DEFAULT 'pending',
	"cancellation_reason" text,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

-- Service Reviews
CREATE TABLE IF NOT EXISTS "service_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_listing_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Service Favorites
CREATE TABLE IF NOT EXISTS "service_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_listing_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Foreign Keys
ALTER TABLE "service_listings" ADD CONSTRAINT "service_listings_category_fk" FOREIGN KEY ("service_category_id") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "service_listings" ADD CONSTRAINT "service_listings_owner_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_listing_fk" FOREIGN KEY ("service_listing_id") REFERENCES "public"."service_listings"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_listing_fk" FOREIGN KEY ("service_listing_id") REFERENCES "public"."service_listings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "service_favorites" ADD CONSTRAINT "service_favorites_listing_fk" FOREIGN KEY ("service_listing_id") REFERENCES "public"."service_listings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "service_favorites" ADD CONSTRAINT "service_favorites_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Indexes
CREATE INDEX "service_listings_category_idx" ON "service_listings" ("service_category_id");
CREATE INDEX "service_listings_owner_idx" ON "service_listings" ("owner_id");
CREATE INDEX "service_bookings_listing_idx" ON "service_bookings" ("service_listing_id");
CREATE INDEX "service_bookings_user_idx" ON "service_bookings" ("user_id");
CREATE INDEX "service_reviews_listing_idx" ON "service_reviews" ("service_listing_id");
CREATE INDEX "service_reviews_user_idx" ON "service_reviews" ("user_id");
CREATE UNIQUE INDEX "service_reviews_user_listing_unique" ON "service_reviews" ("service_listing_id", "user_id");
CREATE UNIQUE INDEX "service_favorites_user_listing_unique" ON "service_favorites" ("service_listing_id", "user_id");

-- Seed the 9 predefined service categories
INSERT INTO "service_categories" ("name", "icon", "sort_order", "is_active") VALUES
	('Saloons', 'scissors', 1, true),
	('Decors', 'palette', 2, true),
	('Catering', 'utensils', 3, true),
	('Mehandi', 'hand-metal', 4, true),
	('Travel', 'car', 5, true),
	('Water', 'droplets', 6, true),
	('Fashion', 'shirt', 7, true),
	('Jewellery', 'gem', 8, true),
	('Rentals', 'package', 9, true)
ON CONFLICT DO NOTHING;
