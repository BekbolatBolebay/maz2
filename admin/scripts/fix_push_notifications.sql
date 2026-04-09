-- Fix Missing Columns for Push Notifications
-- This script adds the necessary columns to track push subscriptions and FCM tokens.

-- 1. Update clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS push_subscription JSONB;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS fcm_token TEXT;
-- push_token already exists in some schemas, but ensuring it's there
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 2. Update staff_profiles table
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS push_subscription JSONB;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 3. Update comments/documentation (Optional but helpful)
COMMENT ON COLUMN public.clients.push_subscription IS 'Web-Push subscription object (JSON)';
COMMENT ON COLUMN public.clients.fcm_token IS 'Firebase Cloud Messaging registration token';
COMMENT ON COLUMN public.staff_profiles.push_subscription IS 'Web-Push subscription object (JSON)';
COMMENT ON COLUMN public.staff_profiles.fcm_token IS 'Firebase Cloud Messaging registration token';
