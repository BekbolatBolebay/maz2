-- Add booking_fee column to reservations table to store the fee at the time of booking
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS booking_fee NUMERIC DEFAULT 0;

-- Comment for clarity
COMMENT ON COLUMN public.reservations.booking_fee IS 'The fee charged for the booking at the time of reservation';
