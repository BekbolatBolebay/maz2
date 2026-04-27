-- Group Orders Setup
CREATE TABLE IF NOT EXISTS group_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cafe_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active', -- active, locked, completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_order_id UUID REFERENCES group_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_order_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view group orders" ON group_orders FOR SELECT USING (true);
CREATE POLICY "Anyone can create group orders" ON group_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update group orders" ON group_orders FOR UPDATE USING (true);

CREATE POLICY "Anyone can view group order items" ON group_order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert group order items" ON group_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update group order items" ON group_order_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete group order items" ON group_order_items FOR DELETE USING (true);
