-- Enable Realtime for orders and reservations
-- Run this in Supabase SQL Editor

-- 1. Ensure the publication exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;

-- 3. Ensure REPLICA IDENTITY is set to FULL for accurate updates (optional but recommended for complex objects)
-- ALTER TABLE public.orders REPLICA IDENTITY FULL;
-- ALTER TABLE public.reservations REPLICA IDENTITY FULL;
