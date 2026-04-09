export interface WorkingHour {
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_day_off: boolean;
}

export function isRestaurantOpen(
    status: 'open' | 'closed' | 'paused' | string | undefined,
    workingHours: WorkingHour[] | null
): { isOpen: boolean; message: string; color: string; reason: string } {
    const s = status?.toLowerCase()
    // 1. Manual status override
    if (s === 'closed') {
        return { isOpen: false, message: 'Closed', color: 'bg-destructive', reason: 'manual_closed' };
    }
    if (s === 'paused') {
        return { isOpen: false, message: 'Paused', color: 'bg-orange-500', reason: 'manual_paused' };
    }

    // 2. Schedule check
    if (!workingHours || workingHours.length === 0) {
        return s === 'open'
            ? { isOpen: true, message: 'Open', color: 'bg-green-500', reason: 'open' }
            : { isOpen: false, message: 'Closed', color: 'bg-destructive', reason: 'closed_no_schedule' };
    }

    const nowRaw = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Almaty',
        hour12: false,
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        day: 'numeric', month: 'numeric', year: 'numeric', weekday: 'short'
    }).formatToParts(nowRaw);

    const getPart = (p: string) => parts.find(x => x.type === p)?.value || '';
    
    // Day of week index (0-6, Sun-Sat)
    // Map weekday short names to 0-6
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIdx = days.indexOf(getPart('weekday'));
    const yesterdayIdx = (todayIdx + 6) % 7;

    const almatyHour = parseInt(getPart('hour'));
    const almatyMinute = parseInt(getPart('minute'));

    // We create a pseudo-date that has Almaty's specific hour/minute/day for comparison
    const now = new Date(2024, 0, 1, almatyHour, almatyMinute, 0); 

    const todaySchedule = workingHours.find(h => h.day_of_week === todayIdx);
    const yesterdaySchedule = workingHours.find(h => h.day_of_week === yesterdayIdx);

    const checkShift = (schedule: WorkingHour | undefined, dateOffset: number) => {
        if (!schedule || schedule.is_day_off || !schedule.open_time || !schedule.close_time) return null;

        const [openH, openM] = schedule.open_time.split(':').map(Number);
        const [closeH, closeM] = schedule.close_time.split(':').map(Number);

        // We use Jan 1st 2024 as our base, and offset from there
        const openDate = new Date(2024, 0, 1 + dateOffset, openH, openM, 0, 0);
        let closeDate = new Date(2024, 0, 1 + dateOffset, closeH, closeM, 0, 0);

        if (closeDate <= openDate) {
            closeDate.setDate(closeDate.getDate() + 1);
        }

        return {
            isOpen: now >= openDate && now < closeDate,
            closeTime: schedule.close_time,
            openTime: schedule.open_time,
            isFuture: now < openDate
        };
    };

    // Check if yesterday's shift is still active
    const yesterdayShift = checkShift(yesterdaySchedule, -1);
    if (yesterdayShift?.isOpen) {
        return {
            isOpen: true,
            message: `Open until ${yesterdayShift.closeTime.slice(0, 5)}`,
            color: 'bg-green-500',
            reason: 'open'
        };
    }

    // Check today's shift
    const todayShift = checkShift(todaySchedule, 0);
    if (todayShift?.isOpen) {
        return {
            isOpen: true,
            message: `Open until ${todayShift.closeTime.slice(0, 5)}`,
            color: 'bg-green-500',
            reason: 'open'
        };
    }

    if (todayShift?.isFuture) {
        return {
            isOpen: false,
            message: `Closed. Opens at ${todayShift.openTime.slice(0, 5)}`,
            color: 'bg-destructive',
            reason: 'not_open_yet'
        };
    }

    return {
        isOpen: false,
        message: 'Already closed',
        color: 'bg-destructive',
        reason: 'already_closed'
    };
}
