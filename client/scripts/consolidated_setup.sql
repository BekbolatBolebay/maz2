-- Master Consolidated Setup Script for Mazir App
-- Standardizes on 'cafe_id' and sets up Client/Admin Auth structure
-- This script is idempotent and can be run multiple times.

-- 0. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Helper: Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1b. Ensure Public Schema Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 2. Admin/Courier Staff Profiles table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'kk' CHECK (preferred_language IN ('kk', 'ru', 'en')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'courier', 'super_admin')),
  fcm_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Clients/Customers Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    push_token TEXT,
    fcm_token TEXT,
    role TEXT DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Restaurants table (The core entity)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name_kk TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_kk TEXT DEFAULT '',
  description_ru TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  city TEXT DEFAULT 'Алматы',
  rating DECIMAL(2,1) DEFAULT 0.0,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  delivery_time_min INTEGER DEFAULT 20,
  delivery_time_max INTEGER DEFAULT 40,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  minimum_order DECIMAL(10,2) DEFAULT 0,
  is_open BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paused')),
  opening_hours JSONB,
  cuisine_types TEXT[],
  is_new BOOLEAN DEFAULT FALSE,
  total_seats INTEGER DEFAULT 0,
  kaspi_link TEXT,
  freedom_merchant_id TEXT,
  freedom_payment_secret_key TEXT,
  freedom_receipt_secret_key TEXT,
  freedom_test_mode BOOLEAN DEFAULT FALSE,
  accept_cash BOOLEAN DEFAULT TRUE,
  accept_kaspi BOOLEAN DEFAULT TRUE,
  accept_freedom BOOLEAN DEFAULT FALSE,
  is_delivery_enabled BOOLEAN DEFAULT TRUE,
  is_pickup_enabled BOOLEAN DEFAULT TRUE,
  is_booking_enabled BOOLEAN DEFAULT TRUE,
  base_delivery_fee DECIMAL(10,2) DEFAULT 0,
  delivery_fee_per_km DECIMAL(10,2) DEFAULT 0,
  courier_fee DECIMAL(10,2) DEFAULT 0,
  delivery_surge_multiplier DECIMAL(3,2) DEFAULT 1.0,
  delivery_extra_charge DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure city column exists
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Алматы';

-- 5. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name_kk TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT DEFAULT '',
  icon_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  home_visible BOOLEAN DEFAULT FALSE,
  home_sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS home_visible BOOLEAN DEFAULT FALSE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS home_sort_order INTEGER DEFAULT 0;

-- 5.1 Standard Home Categories (Global)
INSERT INTO public.categories (name_kk, name_ru, home_visible, home_sort_order)
SELECT 'Пицца', 'Пицца', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name_ru = 'Пицца' AND cafe_id IS NULL);

INSERT INTO public.categories (name_kk, name_ru, home_visible, home_sort_order)
SELECT 'Бургерлер', 'Бургеры', true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name_ru = 'Бургеры' AND cafe_id IS NULL);

INSERT INTO public.categories (name_kk, name_ru, home_visible, home_sort_order)
SELECT 'Суши', 'Суши', true, 3
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name_ru = 'Суши' AND cafe_id IS NULL);

INSERT INTO public.categories (name_kk, name_ru, home_visible, home_sort_order)
SELECT 'Донерлер', 'Донеры', true, 4
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name_ru = 'Донеры' AND cafe_id IS NULL);

INSERT INTO public.categories (name_kk, name_ru, home_visible, home_sort_order)
SELECT 'Кофе', 'Кофе', true, 5
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name_ru = 'Кофе' AND cafe_id IS NULL);

INSERT INTO public.categories (name_kk, name_ru, home_visible, home_sort_order)
SELECT 'Тәттілер', 'Десерты', true, 6
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name_ru = 'Десерты' AND cafe_id IS NULL);

INSERT INTO public.categories (name_kk, name_ru, home_visible, home_sort_order)
SELECT 'Шашлық', 'Шашлык', true, 7
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name_ru = 'Шашлык' AND cafe_id IS NULL);

INSERT INTO public.categories (name_kk, name_ru, home_visible, home_sort_order)
SELECT 'Таңғы ас', 'Завтраки', true, 8
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name_ru = 'Завтраки' AND cafe_id IS NULL);

-- 6. Menu Items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_kk TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT DEFAULT '',
  description_kk TEXT DEFAULT '',
  description_ru TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_stop_list BOOLEAN DEFAULT FALSE,
  preparation_time INTEGER DEFAULT 15,
  sort_order INTEGER DEFAULT 0,
  type TEXT DEFAULT 'food',
  combo_items JSONB DEFAULT '[]',
  rental_deposit NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL,
  user_id UUID, -- Can be from public.users or public.clients
  cafe_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  type TEXT DEFAULT 'delivery' CHECK (type IN ('delivery', 'pickup')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled', 'new', 'accepted', 'on_the_way', 'awaiting_payment')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  items_count INTEGER DEFAULT 0,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'cash',
  payment_url TEXT,
  estimated_ready_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name_kk TEXT,
  name_ru TEXT,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Restaurant Tables
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    capacity INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    customer_id UUID, -- reference to public.clients.id
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    guests_count INTEGER NOT NULL DEFAULT 1,
    duration_hours DECIMAL(4,2) DEFAULT 1.5,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'awaiting_payment')),
    payment_method TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'pending',
    payment_url TEXT,
    total_amount NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Reservation Items table
CREATE TABLE IF NOT EXISTS public.reservation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name_kk TEXT,
  name_ru TEXT,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Working hours table
CREATE TABLE IF NOT EXISTS public.working_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME,
  close_time TIME,
  is_day_off BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title_kk TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  title_en TEXT DEFAULT '',
  description_kk TEXT DEFAULT '',
  description_ru TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  discount_percentage INTEGER,
  discount_amount NUMERIC(10,2),
  promo_code TEXT UNIQUE,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title_kk TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_avatar TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  reply TEXT DEFAULT '',
  replied_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cafe_id)
);

-- 17. Triggers for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_staff_updated_at') THEN
        CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_restaurants_updated_at') THEN
        CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_menu_items_updated_at') THEN
        CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
        CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reservations_updated_at') THEN
        CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 18. Updated Auth Trigger for dual user types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check metadata for role assignment during signup
    is_admin := (NEW.raw_user_meta_data->>'role' = 'admin' OR 
                (NEW.raw_user_meta_data->>'is_admin')::BOOLEAN = true OR
                NEW.raw_user_meta_data->>'role' = 'courier');

    IF is_admin THEN
        INSERT INTO public.staff_profiles (id, email, full_name, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
            COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
        ) ON CONFLICT (id) DO NOTHING;
    ELSE
        INSERT INTO public.clients (id, email, full_name, phone)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
            NEW.raw_user_meta_data->>'phone'
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 19. Helper Function: Is Cafe Owner
CREATE OR REPLACE FUNCTION public.is_cafe_owner(target_cafe_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE id = target_cafe_id AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. RLS Policies
-- Enable RLS on all tables
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Public Access (Read-only)
CREATE POLICY "Anyone can view restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can view working hours" ON public.working_hours FOR SELECT USING (true);
CREATE POLICY "Anyone can view tables" ON public.restaurant_tables FOR SELECT USING (true);

-- Client Access
CREATE POLICY "Clients can view own profile" ON public.clients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Clients can update own profile" ON public.clients FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Clients can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Clients can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Clients can create order items" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR user_id IS NULL)));
CREATE POLICY "Clients can view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));
CREATE POLICY "Owners can manage order items" ON public.order_items FOR ALL USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND public.is_cafe_owner(cafe_id)));

CREATE POLICY "Clients can view own reservations" ON public.reservations FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Clients can create reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);
CREATE POLICY "Clients can create reservation items" ON public.reservation_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.reservations WHERE id = reservation_id AND (customer_id = auth.uid() OR customer_id IS NULL)));
CREATE POLICY "Clients can view own reservation items" ON public.reservation_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.reservations WHERE id = reservation_id AND customer_id = auth.uid()));
CREATE POLICY "Owners can manage reservation items" ON public.reservation_items FOR ALL USING (EXISTS (SELECT 1 FROM public.reservations WHERE id = reservation_id AND public.is_cafe_owner(cafe_id)));
CREATE POLICY "Clients can manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Admin/Owner Access
CREATE POLICY "Staff can view own profile" ON public.staff_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff can update own profile" ON public.staff_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone authenticated can register a restaurant" ON public.restaurants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners can manage restaurants" ON public.restaurants FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owners can manage categories" ON public.categories FOR ALL USING (public.is_cafe_owner(cafe_id));
CREATE POLICY "Owners can manage menu items" ON public.menu_items FOR ALL USING (public.is_cafe_owner(cafe_id));
CREATE POLICY "Owners can manage orders" ON public.orders FOR ALL USING (public.is_cafe_owner(cafe_id));
CREATE POLICY "Owners can manage tables" ON public.restaurant_tables FOR ALL USING (public.is_cafe_owner(cafe_id));
CREATE POLICY "Owners can manage reservations" ON public.reservations FOR ALL USING (public.is_cafe_owner(cafe_id));
CREATE POLICY "Owners can manage working hours" ON public.working_hours FOR ALL USING (public.is_cafe_owner(cafe_id));
CREATE POLICY "Owners can manage promotions" ON public.promotions FOR ALL USING (public.is_cafe_owner(cafe_id));
CREATE POLICY "Owners can manage banners" ON public.banners FOR ALL USING (public.is_cafe_owner(cafe_id));
CREATE POLICY "Owners can manage reviews" ON public.reviews FOR ALL USING (public.is_cafe_owner(cafe_id));

-- 21. Smart Working Hours Functions & Triggers
-- Implements server-side validation for orders and reservations

-- Function to check if a cafe is open at a specific time/day
CREATE OR REPLACE FUNCTION public.is_cafe_open(
    target_cafe_id UUID,
    check_time TIME DEFAULT CURRENT_TIME,
    check_day INTEGER DEFAULT EXTRACT(DOW FROM CURRENT_DATE)::INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    schedule RECORD;
    is_manual_open BOOLEAN;
BEGIN
    -- 1. Check manual status first
    SELECT is_open INTO is_manual_open FROM public.restaurants WHERE id = target_cafe_id;
    IF is_manual_open = FALSE THEN
        RETURN FALSE;
    END IF;

    -- 2. Check working hours schedule
    SELECT * INTO schedule 
    FROM public.working_hours 
    WHERE cafe_id = target_cafe_id AND day_of_week = check_day;

    -- If no schedule defined, assume closed
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- 3. Check if it's a day off
    IF schedule.is_day_off THEN
        RETURN FALSE;
    END IF;

    -- 4. Check time range (handles overnight shifts)
    IF schedule.open_time <= schedule.close_time THEN
        -- Normal shift (e.g., 09:00 - 18:00)
        RETURN check_time >= schedule.open_time AND check_time < schedule.close_time;
    ELSE
        -- Overnight shift (e.g., 22:00 - 04:00)
        RETURN check_time >= schedule.open_time OR check_time < schedule.close_time;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to validate order hours
CREATE OR REPLACE FUNCTION public.validate_order_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_cafe_open(NEW.cafe_id) THEN
        RAISE EXCEPTION 'Cafe is currently closed. Orders are not accepted at this time.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to validate reservation hours
CREATE OR REPLACE FUNCTION public.validate_reservation_hours()
RETURNS TRIGGER AS $$
DECLARE
    res_end_time TIME;
BEGIN
    -- Check start time
    IF NOT public.is_cafe_open(NEW.cafe_id, NEW.time, EXTRACT(DOW FROM NEW.date)::INTEGER) THEN
        RAISE EXCEPTION 'Cafe is closed at the requested start time.';
    END IF;

    -- Check end time (start time + duration)
    res_end_time := (NEW.time + (NEW.duration_hours || ' hours')::INTERVAL)::TIME;
    
    IF NOT public.is_cafe_open(NEW.cafe_id, res_end_time, EXTRACT(DOW FROM NEW.date)::INTEGER) THEN
        RAISE EXCEPTION 'Reservation exceeds cafe working hours.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DROP TRIGGER IF EXISTS tr_validate_order_hours ON public.orders;
CREATE TRIGGER tr_validate_order_hours
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.validate_order_hours();

DROP TRIGGER IF EXISTS tr_validate_reservation_hours ON public.reservations;
CREATE TRIGGER tr_validate_reservation_hours
    BEFORE INSERT ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.validate_reservation_hours();

-- 22. Supabase Storage Setup (Bucket: mazir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('mazir', 'mazir', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view images
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'mazir' );

-- Allow authenticated users to manage images
DROP POLICY IF EXISTS "Authenticated Manage" ON storage.objects;
CREATE POLICY "Authenticated Manage" ON storage.objects FOR ALL TO authenticated USING ( bucket_id = 'mazir' );
