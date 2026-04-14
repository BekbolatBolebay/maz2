-- SQL Migration: Fix Push Notification Schema
-- Run this in your Supabase SQL Editor

-- 1. Fix staff_profiles table
ALTER TABLE public.staff_profiles 
ADD COLUMN IF NOT EXISTS push_subscription JSONB,
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 2. Fix clients table
-- (Already has push_token and fcm_token from previous scripts, adding push_subscription for consistency)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- 3. Ensure columns are accessible
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
