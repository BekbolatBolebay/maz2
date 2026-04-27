-- Courier Live Tracking Setup
CREATE TABLE IF NOT EXISTS courier_locations (
    courier_id UUID PRIMARY KEY REFERENCES staff_profiles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Couriers can update their own location" 
ON courier_locations FOR ALL 
USING (auth.uid() = courier_id)
WITH CHECK (auth.uid() = courier_id);

CREATE POLICY "Anyone can view courier locations" 
ON courier_locations FOR SELECT 
USING (true);
