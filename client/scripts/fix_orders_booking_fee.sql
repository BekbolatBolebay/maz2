-- Migration: Add booking_fee column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS booking_fee NUMERIC DEFAULT 0;

-- Comment for clarity
COMMENT ON COLUMN public.orders.booking_fee IS 'The fee charged for the booking if the order is of type booking';
