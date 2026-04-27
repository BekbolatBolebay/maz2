-- Final DB Migration for Phase 1 Features
ALTER TABLE orders ADD COLUMN IF NOT EXISTS group_order_id UUID REFERENCES group_orders(id) ON DELETE SET NULL;

-- Ensure courier_id is set correctly in RLS if needed
-- (Assuming staff_profiles already has courier role)
