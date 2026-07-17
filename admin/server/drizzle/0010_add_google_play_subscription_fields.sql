ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_platform VARCHAR(20) DEFAULT 'razorpay';
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_purchase_token TEXT;
