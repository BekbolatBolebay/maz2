-- Fix for missing columns in restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS base_delivery_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_fee_per_km DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS booking_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS courier_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_surge_multiplier DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS delivery_extra_charge DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS accept_cash BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS accept_kaspi BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS accept_freedom BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_delivery_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_pickup_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_booking_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS freedom_merchant_id TEXT,
ADD COLUMN IF NOT EXISTS freedom_payment_secret_key TEXT,
ADD COLUMN IF NOT EXISTS freedom_test_mode BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT,
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Fix for missing columns in orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_url TEXT,
ADD COLUMN IF NOT EXISTS courier_id UUID,
ADD COLUMN IF NOT EXISTS courier_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS booking_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS one_time_courier_name TEXT,
ADD COLUMN IF NOT EXISTS one_time_courier_phone TEXT,
ADD COLUMN IF NOT EXISTS courier_tracking_token TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP WITH TIME ZONE;

-- Refresh schema cache reminder:
-- After running this, wait a few seconds for Supabase to refresh the schema cache.
-- You can also run 'NOTIFY pgrst, ''reload schema'';' if you have superuser access, 
-- but usually Supabase does it automatically within seconds.
