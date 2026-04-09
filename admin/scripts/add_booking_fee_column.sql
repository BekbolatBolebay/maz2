-- Migration: Add booking_fee column to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS booking_fee NUMERIC DEFAULT 0;

-- Optional: Update comment for clarity
COMMENT ON COLUMN restaurants.booking_fee IS 'Плата за бронирование столика (Booking fee)';
