-- fix_numeric_overflow.sql
-- Run this in Supabase SQL Editor to prevent "numeric field overflow" errors.
-- This script changes columns with restricted precision to unlimited NUMERIC.

-- 1. Restaurants table
ALTER TABLE public.restaurants 
  ALTER COLUMN rating TYPE NUMERIC,
  ALTER COLUMN latitude TYPE NUMERIC,
  ALTER COLUMN longitude TYPE NUMERIC,
  ALTER COLUMN delivery_fee TYPE NUMERIC,
  ALTER COLUMN minimum_order TYPE NUMERIC,
  ALTER COLUMN base_delivery_fee TYPE NUMERIC,
  ALTER COLUMN delivery_fee_per_km TYPE NUMERIC,
  ALTER COLUMN booking_fee TYPE NUMERIC,
  ALTER COLUMN courier_fee TYPE NUMERIC,
  ALTER COLUMN delivery_surge_multiplier TYPE NUMERIC,
  ALTER COLUMN delivery_extra_charge TYPE NUMERIC;

-- 2. Orders table
ALTER TABLE public.orders
  ALTER COLUMN total_amount TYPE NUMERIC,
  ALTER COLUMN delivery_fee TYPE NUMERIC,
  ALTER COLUMN courier_fee TYPE NUMERIC,
  ALTER COLUMN booking_fee TYPE NUMERIC;

-- 3. Reservations table
ALTER TABLE public.reservations
  ALTER COLUMN total_amount TYPE NUMERIC,
  ALTER COLUMN booking_fee TYPE NUMERIC,
  ALTER COLUMN duration_hours TYPE NUMERIC;

-- 4. Menu Items table
ALTER TABLE public.menu_items
  ALTER COLUMN price TYPE NUMERIC,
  ALTER COLUMN original_price TYPE NUMERIC,
  ALTER COLUMN rental_deposit TYPE NUMERIC;

-- 5. Items tables
ALTER TABLE public.order_items
  ALTER COLUMN price TYPE NUMERIC;

ALTER TABLE public.reservation_items
  ALTER COLUMN price TYPE NUMERIC;

-- 6. Promotions table
ALTER TABLE public.promotions
  ALTER COLUMN discount_amount TYPE NUMERIC,
  ALTER COLUMN min_order_amount TYPE NUMERIC;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
