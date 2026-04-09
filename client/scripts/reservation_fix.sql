-- Phase 3: Reservation & Pre-order Schema Fix
-- Run this in Supabase SQL Editor

-- 1. Create reservation_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reservation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    name_kk TEXT,
    name_ru TEXT,
    price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add missing columns to reservations table
DO $$
BEGIN
    -- Add total_amount for pre-orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'total_amount') THEN
        ALTER TABLE reservations ADD COLUMN total_amount NUMERIC DEFAULT 0;
    END IF;

    -- Add payment fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'payment_method') THEN
        ALTER TABLE reservations ADD COLUMN payment_method TEXT DEFAULT 'cash';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'payment_status') THEN
        ALTER TABLE reservations ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'payment_url') THEN
        ALTER TABLE reservations ADD COLUMN payment_url TEXT;
    END IF;

    -- Add duration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'duration_hours') THEN
        ALTER TABLE reservations ADD COLUMN duration_hours INTEGER DEFAULT 1;
    END IF;

    -- Add customer_id (authenticated user)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'customer_id') THEN
        ALTER TABLE reservations ADD COLUMN customer_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add booking_fee
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'booking_fee') THEN
        ALTER TABLE reservations ADD COLUMN booking_fee NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 3. Enable Realtime for the new items table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.reservation_items;
    END IF;
END $$;
