-- Smart Working Hours Logic for Mazir App
-- Implements server-side validation for orders and reservations

-- 1. Function to check if a cafe is open at a specific time/day
-- day_of_week: 0 (Sunday) to 6 (Saturday)
CREATE OR REPLACE FUNCTION public.is_cafe_open(
    target_cafe_id UUID,
    check_time TIME DEFAULT CURRENT_TIME,
    check_day INTEGER DEFAULT EXTRACT(DOW FROM CURRENT_DATE)::INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    schedule RECORD;
    is_manual_open BOOLEAN;
BEGIN
    -- 1. Check manual status first
    SELECT is_open INTO is_manual_open FROM public.restaurants WHERE id = target_cafe_id;
    IF is_manual_open = FALSE THEN
        RETURN FALSE;
    END IF;

    -- 2. Check working hours schedule
    SELECT * INTO schedule 
    FROM public.working_hours 
    WHERE cafe_id = target_cafe_id AND day_of_week = check_day;

    -- If no schedule defined, assume closed or check if it's open by default (here we assume closed for safety)
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- 3. Check if it's a day off
    IF schedule.is_day_off THEN
        RETURN FALSE;
    END IF;

    -- 4. Check time range (handles overnight shifts)
    IF schedule.open_time <= schedule.close_time THEN
        -- Normal shift (e.g., 09:00 - 18:00)
        RETURN check_time >= schedule.open_time AND check_time < schedule.close_time;
    ELSE
        -- Overnight shift (e.g., 22:00 - 04:00)
        RETURN check_time >= schedule.open_time OR check_time < schedule.close_time;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger function to validate order hours
CREATE OR REPLACE FUNCTION public.validate_order_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_cafe_open(NEW.cafe_id) THEN
        RAISE EXCEPTION 'Cafe is currently closed. Orders are not accepted at this time.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger function to validate reservation hours
CREATE OR REPLACE FUNCTION public.validate_reservation_hours()
RETURNS TRIGGER AS $$
DECLARE
    res_end_time TIME;
BEGIN
    -- Check start time
    IF NOT public.is_cafe_open(NEW.cafe_id, NEW.time, EXTRACT(DOW FROM NEW.date)::INTEGER) THEN
        RAISE EXCEPTION 'Cafe is closed at the requested start time.';
    END IF;

    -- Check end time (start time + duration)
    res_end_time := (NEW.time + (NEW.duration_hours || ' hours')::INTERVAL)::TIME;
    
    IF NOT public.is_cafe_open(NEW.cafe_id, res_end_time, EXTRACT(DOW FROM NEW.date)::INTEGER) THEN
        RAISE EXCEPTION 'Reservation exceeds cafe working hours.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Apply Triggers
DROP TRIGGER IF EXISTS tr_validate_order_hours ON public.orders;
CREATE TRIGGER tr_validate_order_hours
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.validate_order_hours();

DROP TRIGGER IF EXISTS tr_validate_reservation_hours ON public.reservations;
CREATE TRIGGER tr_validate_reservation_hours
    BEFORE INSERT ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.validate_reservation_hours();
