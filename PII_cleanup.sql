-- HYBRID ARCHITECTURE MIGRATION: PII SCRUBBING SCRIPT
-- This script removes Personal Identifiable Information from Supabase
-- to ensure data privacy compliance, as PII is now stored on the VPS.

-- 1. Scrub Orders
UPDATE public.orders
SET 
  customer_name = 'PII_on_VPS',
  customer_phone = 'PII_on_VPS',
  delivery_address = 'PII_on_VPS',
  address = 'PII_on_VPS',
  phone = 'PII_on_VPS'
WHERE customer_name NOT LIKE '%-%-%-%-%' -- PocketBase IDs are 15-char strings, but we can check format
  AND (customer_name IS NOT NULL OR customer_phone IS NOT NULL);

-- 2. Scrub Reservations
UPDATE public.reservations
SET 
  customer_name = 'PII_on_VPS',
  customer_phone = 'PII_on_VPS'
WHERE customer_name NOT LIKE '%-%-%-%-%'
  AND (customer_name IS NOT NULL OR customer_phone IS NOT NULL);

-- 3. Scrub Profiles
UPDATE public.profiles
SET 
  full_name = 'PII_on_VPS',
  phone = 'PII_on_VPS',
  address = 'PII_on_VPS'
WHERE full_name IS NOT NULL;

-- 4. Clean search logs or other PII-carrying tables if any
-- (Add more tables here if needed)

-- IMPORTANT: You must run this in the Supabase SQL Editor manually.
