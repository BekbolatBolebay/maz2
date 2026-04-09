-- Add unique constraint to owner_id to allow ON CONFLICT (owner_id) upserts
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_owner_id_key UNIQUE (owner_id);

-- Optional: Add an index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON public.restaurants(owner_id);
