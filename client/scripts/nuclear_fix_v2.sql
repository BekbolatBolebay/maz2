-- "Nuclear Fix" v2 - Run this in Supabase SQL Editor
-- This script fixes timezones, cleans up duplicates, and prevents future errors.

-- 1. Ensure time constants and Almaty-aware functions
-- Add whatsapp_number column if it doesn't exist
DO $$ 
BEGIN 
    -- 1. Essential Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'whatsapp_number') THEN
        ALTER TABLE restaurants ADD COLUMN whatsapp_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'base_delivery_fee') THEN
        ALTER TABLE restaurants ADD COLUMN base_delivery_fee NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'delivery_fee_per_km') THEN
        ALTER TABLE restaurants ADD COLUMN delivery_fee_per_km NUMERIC DEFAULT 0;
    END IF;

    -- 2. Services & Toggles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'is_delivery_enabled') THEN
        ALTER TABLE restaurants ADD COLUMN is_delivery_enabled BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'is_pickup_enabled') THEN
        ALTER TABLE restaurants ADD COLUMN is_pickup_enabled BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'is_booking_enabled') THEN
        ALTER TABLE restaurants ADD COLUMN is_booking_enabled BOOLEAN DEFAULT TRUE;
    END IF;

    -- 3. Payment Methods for Booking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'booking_accept_cash') THEN
        ALTER TABLE restaurants ADD COLUMN booking_accept_cash BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'booking_accept_kaspi') THEN
        ALTER TABLE restaurants ADD COLUMN booking_accept_kaspi BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'booking_accept_freedom') THEN
        ALTER TABLE restaurants ADD COLUMN booking_accept_freedom BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_cafe_open(
    target_cafe_id UUID,
    check_time TIME DEFAULT (NOW() AT TIME ZONE 'Asia/Almaty')::TIME,
    check_day INTEGER DEFAULT EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Asia/Almaty'))::INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    schedule RECORD;
    is_manual_open BOOLEAN;
BEGIN
    -- 1. Check manual status
    SELECT is_open INTO is_manual_open FROM public.restaurants WHERE id = target_cafe_id;
    IF is_manual_open = FALSE THEN RETURN FALSE; END IF;

    -- 2. Check working hours schedule
    SELECT * INTO schedule FROM public.working_hours 
    WHERE cafe_id = target_cafe_id AND day_of_week = check_day;

    -- If no schedule, assume open (for new restaurants)
    IF NOT FOUND THEN RETURN TRUE; END IF;

    -- 3. Check day off
    IF schedule.is_day_off THEN RETURN FALSE; END IF;

    -- 4. Check time range (handles overnight)
    IF schedule.open_time <= schedule.close_time THEN
        RETURN check_time >= schedule.open_time AND check_time < schedule.close_time;
    ELSE
        RETURN check_time >= schedule.open_time OR check_time < schedule.close_time;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Cleanup: Ensure owner_id is NOT unique (Allowing multiple restaurants per owner)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_owner_id_key') THEN
        ALTER TABLE public.restaurants DROP CONSTRAINT restaurants_owner_id_key;
    END IF;
END $$;
