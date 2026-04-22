-- SQL to set up automated Push Notifications via Supabase Triggers
-- This script enables automated notifications when a new order or reservation is created.

-- 1. Enable the HTTP extension if not already enabled
-- CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 2. Create the notification function
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_record()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT := 'https://cafeadminis.mazirapp.kz/api/internal/notify-order';
    -- IMPORTANT: Change this to match your INTERNAL_NOTIFICATION_SECRET in .env
    internal_secret TEXT := 'REPLACE_WITH_YOUR_SECRET';
    payload JSONB;
    record_type TEXT;
BEGIN
    -- Determine if it's an order or a reservation
    IF TG_TABLE_NAME = 'orders' THEN
        record_type := 'order';
        payload := jsonb_build_object(
            'orderId', NEW.id,
            'type', 'order'
        );
    ELSIF TG_TABLE_NAME = 'reservations' THEN
        record_type := 'booking';
        payload := jsonb_build_object(
            'reservationId', NEW.id,
            'type', 'booking'
        );
    END IF;

    -- Send the HTTP POST request to the Admin API
    -- Note: This requires the pg_net or http extension. 
    -- If using Supabase standard Database Webhooks, you can set this up via the Dashboard UI instead.
    
    -- Example using Supabase internal webhooks logic (standard way):
    -- We perform a simple HTTP call. 
    -- If you are using the Supabase Dashboard, it is recommended to set up "Database Webhooks" 
    -- through the UI as it is more robust (handles retries).
    
    PERFORM
      net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || internal_secret
        ),
        body := payload
      );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Triggers
DROP TRIGGER IF EXISTS tr_notify_admin_order ON public.orders;
CREATE TRIGGER tr_notify_admin_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_new_record();

DROP TRIGGER IF EXISTS tr_notify_admin_reservation ON public.reservations;
CREATE TRIGGER tr_notify_admin_reservation
AFTER INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_new_record();

-- NOTE: To use net.http_post, ensure the "pg_net" extension is enabled in your Supabase project.
-- You can enable it via: CREATE EXTENSION IF NOT EXISTS pg_net;
