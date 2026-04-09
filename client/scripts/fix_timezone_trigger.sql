-- Fix timezone issue in is_cafe_open function
-- This ensures the DB trigger uses Almaty time (UTC+5) for checking current time and day.

CREATE OR REPLACE FUNCTION public.is_cafe_open(
    target_cafe_id UUID,
    check_time TIME DEFAULT (CURRENT_TIME AT TIME ZONE 'Asia/Almaty')::TIME,
    check_day INTEGER DEFAULT EXTRACT(DOW FROM CURRENT_DATE AT TIME ZONE 'Asia/Almaty')::INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    schedule RECORD;
    is_manual_open BOOLEAN;
BEGIN
    -- 1. Check manual status first
    -- Note: We check 'is_open' column which is the primary flag, but also 'status'
    SELECT is_open INTO is_manual_open FROM public.restaurants WHERE id = target_cafe_id;
    IF is_manual_open = FALSE THEN
        RETURN FALSE;
    END IF;

    -- 2. Check working hours schedule
    SELECT * INTO schedule 
    FROM public.working_hours 
    WHERE cafe_id = target_cafe_id AND day_of_week = check_day;

    -- If no schedule defined, assume closed
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
