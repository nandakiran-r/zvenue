-- Pre-booking workflow: add columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(64);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS registration_fee_paid REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_balance REAL DEFAULT 0;
