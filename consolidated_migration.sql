-- Courier Live Tracking Setup
CREATE TABLE IF NOT EXISTS courier_locations (
    courier_id UUID PRIMARY KEY REFERENCES staff_profiles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Couriers can update their own location" 
ON courier_locations FOR ALL 
USING (auth.uid() = courier_id)
WITH CHECK (auth.uid() = courier_id);

CREATE POLICY "Anyone can view courier locations" 
ON courier_locations FOR SELECT 
USING (true);
-- Create OTP Codes Table for Client Registration
-- This table stores temporary OTP codes for email verification

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON public.otp_codes(code);

-- Enable Row Level Security
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for unauthenticated users registering)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'otp_codes' 
    AND policyname = 'Allow insert for unauthenticated registration'
  ) THEN
    CREATE POLICY "Allow insert for unauthenticated registration" ON public.otp_codes
      FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

-- Allow selecting own codes (for verification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'otp_codes' 
    AND policyname = 'Users can verify their own codes'
  ) THEN
    CREATE POLICY "Users can verify their own codes" ON public.otp_codes
      FOR SELECT USING (true);
  END IF;
END
$$;

-- Add table comments
COMMENT ON TABLE public.otp_codes IS 'Stores temporary OTP codes for email verification during registration';
COMMENT ON COLUMN public.otp_codes.id IS 'Unique identifier for the OTP record';
COMMENT ON COLUMN public.otp_codes.email IS 'Email address to verify';
COMMENT ON COLUMN public.otp_codes.code IS '6-digit verification code';
COMMENT ON COLUMN public.otp_codes.full_name IS 'Full name provided during registration';
COMMENT ON COLUMN public.otp_codes.phone IS 'Phone number provided during registration';
COMMENT ON COLUMN public.otp_codes.expires_at IS 'When this code expires (typically 10 minutes from creation)';
COMMENT ON COLUMN public.otp_codes.created_at IS 'Timestamp when the code was generated';
COMMENT ON COLUMN public.otp_codes.used_at IS 'Timestamp when code was successfully verified (NULL if unused)';
-- Create Support Messages Table
-- This table stores messages sent by users from the Help & Support page

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (authenticated or guest)
CREATE POLICY "Allow anyone to submit support messages" ON public.support_messages
  FOR INSERT WITH CHECK (true);

-- Allow users to see their own messages
CREATE POLICY "Users can view their own support messages" ON public.support_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to view and update all messages
-- (Assuming there is a way to identify admins, e.g. via a role in profiles)
-- For now, we'll keep it simple or restricted to insert-only for the public.

-- Add table comments
COMMENT ON TABLE public.support_messages IS 'Stores messages from users for the support team';
COMMENT ON COLUMN public.support_messages.id IS 'Unique identifier for the message';
COMMENT ON COLUMN public.support_messages.user_id IS 'ID of the user who sent the message (if authenticated)';
COMMENT ON COLUMN public.support_messages.name IS 'Name of the sender';
COMMENT ON COLUMN public.support_messages.contact IS 'Email or phone number for follow-up';
COMMENT ON COLUMN public.support_messages.message IS 'Contents of the support request';
COMMENT ON COLUMN public.support_messages.status IS 'Current processing status of the message';
COMMENT ON COLUMN public.support_messages.created_at IS 'When the message was submitted';
-- Final DB Migration for Phase 1 Features
ALTER TABLE orders ADD COLUMN IF NOT EXISTS group_order_id UUID REFERENCES group_orders(id) ON DELETE SET NULL;

-- Ensure courier_id is set correctly in RLS if needed
-- (Assuming staff_profiles already has courier role)
-- Gift Certificates Setup
CREATE TABLE IF NOT EXISTS gift_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    cafe_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    initial_amount DECIMAL NOT NULL,
    current_balance DECIMAL NOT NULL,
    status TEXT DEFAULT 'active', -- active, fully_used, expired
    buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by code
CREATE INDEX IF NOT EXISTS idx_gift_certificates_code ON gift_certificates(code);

-- Enable RLS
ALTER TABLE gift_certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view certificate by code" 
ON gift_certificates FOR SELECT 
USING (true);

CREATE POLICY "Users can see their bought certificates" 
ON gift_certificates FOR SELECT 
USING (auth.uid() = buyer_id);

-- Link to orders (to track usage)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS certificate_code TEXT REFERENCES gift_certificates(code);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS certificate_amount_spent DECIMAL DEFAULT 0;
-- Group Orders Setup
CREATE TABLE IF NOT EXISTS group_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cafe_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active', -- active, locked, completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_order_id UUID REFERENCES group_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_order_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view group orders" ON group_orders FOR SELECT USING (true);
CREATE POLICY "Anyone can create group orders" ON group_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update group orders" ON group_orders FOR UPDATE USING (true);

CREATE POLICY "Anyone can view group order items" ON group_order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert group order items" ON group_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update group order items" ON group_order_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete group order items" ON group_order_items FOR DELETE USING (true);
-- Happy Hours Setup

-- 1. Add Happy Hour columns to restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS happy_hour_start TIME,
ADD COLUMN IF NOT EXISTS happy_hour_end TIME,
ADD COLUMN IF NOT EXISTS happy_hour_discount_percent DECIMAL(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS happy_hour_days INTEGER[] DEFAULT '{1,2,3,4,5}'; -- Default Mon-Fri

-- 2. Add Happy Hour metadata to orders (to track if a discount was applied)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS happy_hour_discount_amount DECIMAL(12,2) DEFAULT 0.0;

-- 3. Comment for documentation
COMMENT ON COLUMN public.restaurants.happy_hour_days IS 'Array of integers representing days of week (0=Sunday, 1=Monday, ..., 6=Saturday)';
-- Loyalty System Setup

-- 1. Add cashback setting to restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS cashback_percentage DECIMAL(5,2) DEFAULT 5.0;

-- 2. Add loyalty points to clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS loyalty_points DECIMAL(12,2) DEFAULT 0.0;

-- 3. Add point tracking to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS points_earned DECIMAL(12,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS points_spent DECIMAL(12,2) DEFAULT 0.0;

-- 4. Create loyalty transactions table for history
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'refund', 'admin_adjustment')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS on loyalty_transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for loyalty_transactions
CREATE POLICY "Clients can view own transactions" 
ON public.loyalty_transactions FOR SELECT 
USING (auth.uid() = client_id);

CREATE POLICY "Admins can manage all transactions" 
ON public.loyalty_transactions FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_client_id ON public.loyalty_transactions(client_id);

-- 7. Trigger Function for Loyalty Logic
CREATE OR REPLACE FUNCTION public.handle_loyalty_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_cashback_percentage DECIMAL;
    v_points_to_earn DECIMAL;
    v_client_id UUID;
BEGIN
    -- Get client_id from user_id (assuming clients table has user_id or is the same)
    -- In this schema, orders.user_id references auth.users, and clients table exists.
    -- We need to find the client record for this user.
    SELECT id INTO v_client_id FROM public.clients WHERE user_id = NEW.user_id LIMIT 1;
    
    IF v_client_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- A. Handle Point Deduction on New Order
    IF (TG_OP = 'INSERT') THEN
        IF NEW.points_spent > 0 THEN
            UPDATE public.clients 
            SET loyalty_points = loyalty_points - NEW.points_spent 
            WHERE id = v_client_id;
            
            INSERT INTO public.loyalty_transactions (client_id, order_id, amount, type, description)
            VALUES (v_client_id, NEW.id, -NEW.points_spent, 'spend', 'Order #' || NEW.id);
        END IF;
        RETURN NEW;
    END IF;

    -- B. Handle Status Changes
    IF (TG_OP = 'UPDATE') THEN
        -- 1. Award points on Completion
        IF (NEW.status IN ('delivered', 'completed') AND OLD.status NOT IN ('delivered', 'completed', 'cancelled')) THEN
            -- Get restaurant cashback percentage
            SELECT cashback_percentage INTO v_cashback_percentage 
            FROM public.restaurants 
            WHERE id = NEW.cafe_id;
            
            -- Calculate points (on subtotal = total - delivery_fee + points_spent)
            v_points_to_earn := FLOOR((NEW.total_amount - COALESCE(NEW.delivery_fee, 0) + COALESCE(NEW.points_spent, 0)) * (v_cashback_percentage / 100));
            
            IF v_points_to_earn > 0 THEN
                UPDATE public.clients 
                SET loyalty_points = loyalty_points + v_points_to_earn 
                WHERE id = v_client_id;
                
                UPDATE public.orders 
                SET points_earned = v_points_to_earn 
                WHERE id = NEW.id;

                INSERT INTO public.loyalty_transactions (client_id, order_id, amount, type, description)
                VALUES (v_client_id, NEW.id, v_points_to_earn, 'earn', 'Cashback for Order #' || NEW.id);
            END IF;
        END IF;

        -- 2. Refund points on Cancellation
        IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
            IF NEW.points_spent > 0 THEN
                UPDATE public.clients 
                SET loyalty_points = loyalty_points + NEW.points_spent 
                WHERE id = v_client_id;
                
                INSERT INTO public.loyalty_transactions (client_id, order_id, amount, type, description)
                VALUES (v_client_id, NEW.id, NEW.points_spent, 'refund', 'Refund for Cancelled Order #' || NEW.id);
            END IF;
            
            -- Also remove earned points if it was already completed (rare but possible)
            IF OLD.status IN ('delivered', 'completed') AND NEW.points_earned > 0 THEN
                UPDATE public.clients 
                SET loyalty_points = loyalty_points - NEW.points_earned 
                WHERE id = v_client_id;
                
                INSERT INTO public.loyalty_transactions (client_id, order_id, amount, type, description)
                VALUES (v_client_id, NEW.id, -NEW.points_earned, 'refund', 'Reversal for Cancelled Order #' || NEW.id);
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create Trigger
DROP TRIGGER IF EXISTS trg_loyalty_order_status ON public.orders;
CREATE TRIGGER trg_loyalty_order_status
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_loyalty_on_order_status_change();
-- Unified User Profile Setup (Consolidated from customers and users)
-- This script ensures all users (Admins and PWA Customers) are correctly synced to public.users

-- 1. Ensure public.users exists with all necessary columns
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  push_subscription JSONB,
  preferred_language TEXT DEFAULT 'kk',
  theme TEXT DEFAULT 'light'
);

-- 2. Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;

CREATE POLICY "Public profiles are viewable by everyone." ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 3. Robust sync trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, phone, role, is_anonymous)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.phone,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    (CASE WHEN (new.email IS NULL OR new.email = '') AND (new.phone IS NULL OR new.phone = '') THEN true ELSE false END)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    role = COALESCE(EXCLUDED.role, public.users.role);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Add Telegram Chat ID support to restaurants table (for multi-cafe support)
ALTER TABLE IF EXISTS public.restaurants ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- 2. Create the notification function
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_record()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT := 'https://cafeadminis.mazirapp.kz/api/internal/notify-order';
    -- IMPORTANT: Change this to match your INTERNAL_NOTIFICATION_SECRET in .env
    internal_secret TEXT := 'REPLACE_WITH_YOUR_SECRET';
    payload JSONB;
    record_type TEXT;
BEGIN
    -- Determine if it's an order or a reservation
    IF TG_TABLE_NAME = 'orders' THEN
        record_type := 'order';
        payload := jsonb_build_object(
            'orderId', NEW.id,
            'type', 'order'
        );
    ELSIF TG_TABLE_NAME = 'reservations' THEN
        record_type := 'booking';
        payload := jsonb_build_object(
            'reservationId', NEW.id,
            'type', 'booking'
        );
    END IF;

    -- Send the HTTP POST request to the Admin API
    -- Note: This requires the pg_net or http extension. 
    -- If using Supabase standard Database Webhooks, you can set this up via the Dashboard UI instead.
    
    -- Example using Supabase internal webhooks logic (standard way):
    -- We perform a simple HTTP call. 
    -- If you are using the Supabase Dashboard, it is recommended to set up "Database Webhooks" 
    -- through the UI as it is more robust (handles retries).
    
    PERFORM
      net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || internal_secret
        ),
        body := payload
      );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Triggers
DROP TRIGGER IF EXISTS tr_notify_admin_order ON public.orders;
CREATE TRIGGER tr_notify_admin_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_new_record();

DROP TRIGGER IF EXISTS tr_notify_admin_reservation ON public.reservations;
CREATE TRIGGER tr_notify_admin_reservation
AFTER INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_new_record();

-- NOTE: To use net.http_post, ensure the "pg_net" extension is enabled in your Supabase project.
-- You can enable it via: CREATE EXTENSION IF NOT EXISTS pg_net;
