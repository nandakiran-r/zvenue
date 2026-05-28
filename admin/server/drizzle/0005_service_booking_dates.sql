-- Add booking date and time columns to service_bookings
ALTER TABLE "service_bookings" ADD COLUMN "booking_date" varchar(10);
ALTER TABLE "service_bookings" ADD COLUMN "start_time" varchar(20);
ALTER TABLE "service_bookings" ADD COLUMN "end_time" varchar(20);

-- Index for querying booked dates by listing
CREATE INDEX "service_bookings_listing_date_idx" ON "service_bookings" ("service_listing_id", "booking_date") WHERE "status" = 'confirmed';
