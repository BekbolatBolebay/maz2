-- Gift Certificates Setup
CREATE TABLE IF NOT EXISTS gift_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    cafe_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    initial_amount DECIMAL NOT NULL,
    current_balance DECIMAL NOT NULL,
    status TEXT DEFAULT 'active', -- active, fully_used, expired
    buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by code
CREATE INDEX IF NOT EXISTS idx_gift_certificates_code ON gift_certificates(code);

-- Enable RLS
ALTER TABLE gift_certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view certificate by code" 
ON gift_certificates FOR SELECT 
USING (true);

CREATE POLICY "Users can see their bought certificates" 
ON gift_certificates FOR SELECT 
USING (auth.uid() = buyer_id);

-- Link to orders (to track usage)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS certificate_code TEXT REFERENCES gift_certificates(code);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS certificate_amount_spent DECIMAL DEFAULT 0;
