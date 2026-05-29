-- Add time slot configuration columns to service_listings
ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "opening_time" varchar(5) DEFAULT '08:00';
ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "closing_time" varchar(5) DEFAULT '20:00';
ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "max_booking_duration" integer DEFAULT 480;
ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "blocked_slots" jsonb DEFAULT '[]';
