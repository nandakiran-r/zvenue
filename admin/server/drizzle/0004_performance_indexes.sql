-- Performance indexes for frequently queried columns

CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_venues_category_id ON venues(category_id);
CREATE INDEX IF NOT EXISTS idx_venues_owner_id ON venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_approval_status ON venues(approval_status);
CREATE INDEX IF NOT EXISTS idx_service_listings_category_id ON service_listings(service_category_id);
CREATE INDEX IF NOT EXISTS idx_service_listings_approval ON service_listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_user_id ON service_bookings(user_id);

-- Updated_at columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();
ALTER TABLE venues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();
ALTER TABLE service_listings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();
