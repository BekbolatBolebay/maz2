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
