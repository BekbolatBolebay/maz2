-- Standardized Seed Data for Mazir App
-- Uses 'cafe_id' and aligns with the Master Consolidated Setup

-- 1. Insert Sample Restaurant
INSERT INTO public.restaurants (
  name_kk, name_ru, name_en, 
  description_kk, description_ru, description_en,
  address, phone, rating, 
  delivery_time_min, delivery_time_max, delivery_fee, 
  is_open, is_new, cuisine_types,
  accept_cash, accept_kaspi, accept_freedom
) VALUES (
  'Mazir Cafe',
  'Мазир Кафе',
  'Mazir Cafe',
  'Ең дәмді тағамдар бізде',
  'Самая вкусная еда у нас',
  'The most delicious food is here',
  'Abai Ave 1, Almaty',
  '+77001234567',
  5.0,
  20,
  45,
  500,
  true,
  true,
  ARRAY['Национальная', 'Европейская'],
  true,
  true,
  false
) ON CONFLICT DO NOTHING;

-- 2. Insert Categories
DO $$
DECLARE
    target_cafe_id UUID;
BEGIN
    SELECT id INTO target_cafe_id FROM public.restaurants WHERE name_en = 'Mazir Cafe' LIMIT 1;
    
    IF target_cafe_id IS NOT NULL THEN
        INSERT INTO public.categories (cafe_id, name_kk, name_ru, name_en, sort_order) VALUES
        (target_cafe_id, 'Фаст-фуд', 'Фаст-фуд', 'Fast Food', 1),
        (target_cafe_id, 'Сусындар', 'Напитки', 'Drinks', 2),
        (target_cafe_id, 'Десерттер', 'Десерты', 'Desserts', 3)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 3. Insert Menu Items
DO $$
DECLARE
    target_cafe_id UUID;
    cat_fast_food UUID;
    cat_drinks UUID;
BEGIN
    SELECT id INTO target_cafe_id FROM public.restaurants WHERE name_en = 'Mazir Cafe' LIMIT 1;
    SELECT id INTO cat_fast_food FROM public.categories WHERE cafe_id = target_cafe_id AND name_en = 'Fast Food' LIMIT 1;
    SELECT id INTO cat_drinks FROM public.categories WHERE cafe_id = target_cafe_id AND name_en = 'Drinks' LIMIT 1;
    
    IF target_cafe_id IS NOT NULL THEN
        -- Burgers
        INSERT INTO public.menu_items (cafe_id, category_id, name_kk, name_ru, name_en, price, is_popular) VALUES
        (target_cafe_id, cat_fast_food, 'Классикалық Бургер', 'Классический Бургер', 'Classic Burger', 1500, true),
        (target_cafe_id, cat_fast_food, 'Чизбургер', 'Чизбургер', 'Cheeseburger', 1800, false);
        
        -- Drinks
        INSERT INTO public.menu_items (cafe_id, category_id, name_kk, name_ru, name_en, price) VALUES
        (target_cafe_id, cat_drinks, 'Кофе', 'Кофе', 'Coffee', 800),
        (target_cafe_id, cat_drinks, 'Шай', 'Чай', 'Tea', 500);
    END IF;
END $$;

-- 4. Insert Sample Tables
DO $$
DECLARE
    target_cafe_id UUID;
BEGIN
    SELECT id INTO target_cafe_id FROM public.restaurants WHERE name_en = 'Mazir Cafe' LIMIT 1;
    
    IF target_cafe_id IS NOT NULL THEN
        INSERT INTO public.restaurant_tables (cafe_id, table_number, capacity) VALUES
        (target_cafe_id, '1', 2),
        (target_cafe_id, '2', 4),
        (target_cafe_id, '3', 6);
    END IF;
END $$;
