-- 1. Add missing management columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS platform_status TEXT DEFAULT 'active' CHECK (platform_status IN ('active', 'warning', 'expired', 'blocked')),
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
ADD COLUMN IF NOT EXISTS block_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- 2. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price BIGINT NOT NULL,
    period TEXT NOT NULL DEFAULT 'month' CHECK (period IN ('month', 'year')),
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Insert standard subscription plans
INSERT INTO public.subscriptions (id, name, description, price, period, status)
VALUES
  ('1', 'Basic', 'Базовая аналитика\nДо 500 заказов/мес\nПоддержка по почте', 2900, 'month', true),
  ('2', 'Standard', 'Расширенная аналитика\nБезлимитные заказы\nПриоритетная поддержка\nИнтеграция с кассами', 5500, 'month', true),
  ('3', 'Premium', 'AI прогнозирование\nПерсональный менеджер\nAPI доступ\nМульти-аккаунты', 12000, 'month', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price;

-- 4. Create subscription_payments table
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES public.subscriptions(id),
    plan_name TEXT NOT NULL,
    amount BIGINT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failure')),
    freedom_payment_id TEXT,
    pg_sig TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_platform_status ON public.restaurants(platform_status);
CREATE INDEX IF NOT EXISTS idx_sub_payments_cafe ON public.subscription_payments(cafe_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON public.subscription_payments(status);

-- 6. Enable RLS and add policies
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Service role has full access to subscription_payments'
    ) THEN
        CREATE POLICY "Service role has full access to subscription_payments" 
        ON public.subscription_payments FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;
