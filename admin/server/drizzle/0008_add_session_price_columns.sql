-- Add session-based pricing columns to venues table
-- These columns store explicit session prices instead of deriving from price_per_hour

ALTER TABLE venues ADD COLUMN IF NOT EXISTS price_morning REAL DEFAULT 0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS price_evening REAL DEFAULT 0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS price_full_day REAL DEFAULT 0;

-- Auto-populate session prices from existing price_per_hour data
-- Morning session = 8 hours, Evening session = 7 hours, Full Day = 16 hours
UPDATE venues
SET
  price_morning = COALESCE(price_per_hour, 0) * 8,
  price_evening = COALESCE(price_per_hour, 0) * 7,
  price_full_day = COALESCE(price_per_hour, 0) * 16
WHERE price_morning = 0 AND price_evening = 0 AND price_full_day = 0;

-- Ensure no venue has NULL session prices
UPDATE venues SET price_morning = 0 WHERE price_morning IS NULL;
UPDATE venues SET price_evening = 0 WHERE price_evening IS NULL;
UPDATE venues SET price_full_day = 0 WHERE price_full_day IS NULL;
