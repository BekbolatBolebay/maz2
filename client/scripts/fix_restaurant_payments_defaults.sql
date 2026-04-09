-- Migration: Ensure existing restaurants have payment methods enabled by default
-- This fixes the issue where "Төлем әдісі" doesn't show any options.

UPDATE public.restaurants 
SET 
  accept_cash = COALESCE(accept_cash, true),
  accept_kaspi = COALESCE(accept_kaspi, true),
  accept_freedom = COALESCE(accept_freedom, false)
WHERE accept_cash IS NULL OR accept_kaspi IS NULL;

-- Optional: Ensure new restaurants have these defaults
ALTER TABLE public.restaurants ALTER COLUMN accept_cash SET DEFAULT true;
ALTER TABLE public.restaurants ALTER COLUMN accept_kaspi SET DEFAULT true;
ALTER TABLE public.restaurants ALTER COLUMN accept_freedom SET DEFAULT false;
