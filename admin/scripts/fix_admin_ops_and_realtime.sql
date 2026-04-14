-- Master Fix for Admin Permissions and Real-time Updates
-- Run this in your Supabase Dashboard SQL Editor

-- 1. Grant base permissions to authenticated users
-- Without these, RLS policies are ignored for non-SELECT operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 2. Enable Real-time for main tables
-- This adds the tables to the 'supabase_realtime' publication
BEGIN;
  -- Remove existing if any to avoid errors
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.orders;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.reservations;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.menu_items;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.categories;

  -- Add tables to publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
COMMIT;

-- 3. Ensure menu_items has correct columns (Safety Check)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'original_price') THEN
        ALTER TABLE public.menu_items ADD COLUMN original_price NUMERIC(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'type') THEN
        ALTER TABLE public.menu_items ADD COLUMN type TEXT DEFAULT 'food';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'combo_items') THEN
        ALTER TABLE public.menu_items ADD COLUMN combo_items JSONB DEFAULT '[]';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'rental_deposit') THEN
        ALTER TABLE public.menu_items ADD COLUMN rental_deposit NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- 4. Fix RLS for menu_items (Ensure cafe_id check is robust)
DROP POLICY IF EXISTS "Owners can manage menu items" ON public.menu_items;
CREATE POLICY "Owners can manage menu items" 
ON public.menu_items 
FOR ALL 
TO authenticated
USING (public.is_cafe_owner(cafe_id))
WITH CHECK (public.is_cafe_owner(cafe_id));

-- Notification to reload schema cache
NOTIFY pgrst, 'reload schema';
