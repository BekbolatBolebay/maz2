-- Loyalty System Setup

-- 1. Add cashback setting to restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS cashback_percentage DECIMAL(5,2) DEFAULT 5.0;

-- 2. Add loyalty points to clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS loyalty_points DECIMAL(12,2) DEFAULT 0.0;

-- 3. Add point tracking to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS points_earned DECIMAL(12,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS points_spent DECIMAL(12,2) DEFAULT 0.0;

-- 4. Create loyalty transactions table for history
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'refund', 'admin_adjustment')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS on loyalty_transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for loyalty_transactions
CREATE POLICY "Clients can view own transactions" 
ON public.loyalty_transactions FOR SELECT 
USING (auth.uid() = client_id);

CREATE POLICY "Admins can manage all transactions" 
ON public.loyalty_transactions FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_client_id ON public.loyalty_transactions(client_id);

-- 7. Trigger Function for Loyalty Logic
CREATE OR REPLACE FUNCTION public.handle_loyalty_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_cashback_percentage DECIMAL;
    v_points_to_earn DECIMAL;
    v_client_id UUID;
BEGIN
    -- Get client_id from user_id (assuming clients table has user_id or is the same)
    -- In this schema, orders.user_id references auth.users, and clients table exists.
    -- We need to find the client record for this user.
    SELECT id INTO v_client_id FROM public.clients WHERE user_id = NEW.user_id LIMIT 1;
    
    IF v_client_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- A. Handle Point Deduction on New Order
    IF (TG_OP = 'INSERT') THEN
        IF NEW.points_spent > 0 THEN
            UPDATE public.clients 
            SET loyalty_points = loyalty_points - NEW.points_spent 
            WHERE id = v_client_id;
            
            INSERT INTO public.loyalty_transactions (client_id, order_id, amount, type, description)
            VALUES (v_client_id, NEW.id, -NEW.points_spent, 'spend', 'Order #' || NEW.id);
        END IF;
        RETURN NEW;
    END IF;

    -- B. Handle Status Changes
    IF (TG_OP = 'UPDATE') THEN
        -- 1. Award points on Completion
        IF (NEW.status IN ('delivered', 'completed') AND OLD.status NOT IN ('delivered', 'completed', 'cancelled')) THEN
            -- Get restaurant cashback percentage
            SELECT cashback_percentage INTO v_cashback_percentage 
            FROM public.restaurants 
            WHERE id = NEW.cafe_id;
            
            -- Calculate points (on subtotal = total - delivery_fee + points_spent)
            v_points_to_earn := FLOOR((NEW.total_amount - COALESCE(NEW.delivery_fee, 0) + COALESCE(NEW.points_spent, 0)) * (v_cashback_percentage / 100));
            
            IF v_points_to_earn > 0 THEN
                UPDATE public.clients 
                SET loyalty_points = loyalty_points + v_points_to_earn 
                WHERE id = v_client_id;
                
                UPDATE public.orders 
                SET points_earned = v_points_to_earn 
                WHERE id = NEW.id;

                INSERT INTO public.loyalty_transactions (client_id, order_id, amount, type, description)
                VALUES (v_client_id, NEW.id, v_points_to_earn, 'earn', 'Cashback for Order #' || NEW.id);
            END IF;
        END IF;

        -- 2. Refund points on Cancellation
        IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
            IF NEW.points_spent > 0 THEN
                UPDATE public.clients 
                SET loyalty_points = loyalty_points + NEW.points_spent 
                WHERE id = v_client_id;
                
                INSERT INTO public.loyalty_transactions (client_id, order_id, amount, type, description)
                VALUES (v_client_id, NEW.id, NEW.points_spent, 'refund', 'Refund for Cancelled Order #' || NEW.id);
            END IF;
            
            -- Also remove earned points if it was already completed (rare but possible)
            IF OLD.status IN ('delivered', 'completed') AND NEW.points_earned > 0 THEN
                UPDATE public.clients 
                SET loyalty_points = loyalty_points - NEW.points_earned 
                WHERE id = v_client_id;
                
                INSERT INTO public.loyalty_transactions (client_id, order_id, amount, type, description)
                VALUES (v_client_id, NEW.id, -NEW.points_earned, 'refund', 'Reversal for Cancelled Order #' || NEW.id);
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create Trigger
DROP TRIGGER IF EXISTS trg_loyalty_order_status ON public.orders;
CREATE TRIGGER trg_loyalty_order_status
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_loyalty_on_order_status_change();
