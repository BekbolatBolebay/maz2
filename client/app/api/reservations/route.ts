import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            cafe_id,
            customer_name,
            customer_phone,
            date,
            time,
            guests_count,
            table_id,
            payment_method,
            notes,
            duration_hours = 1,
            customer_id,
            items = [],
        } = body

        if (!cafe_id || !customer_name || !customer_phone || !date || !time || !guests_count) {
            return NextResponse.json({ error: 'Барлық міндетті өрістерді толтырыңыз' }, { status: 400 })
        }

        const supabase = await createClient()

        // 0. Fetch restaurant settings to get booking_fee safely
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('booking_fee')
            .eq('id', cafe_id)
            .single()

        const booking_fee = Number(restaurant?.booking_fee || 0)

        // 1. Атомарлық тексеру: Бұл үстел осы уақытта бос па?
        if (table_id) {
            const { data: existingReservations } = await supabase
                .from('reservations')
                .select('time, duration_hours')
                .eq('table_id', table_id)
                .eq('date', date)
                .in('status', ['pending', 'confirmed', 'awaiting_payment'])

            if (existingReservations && existingReservations.length > 0) {
                const requestedStart = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])
                const requestedEnd = requestedStart + (duration_hours * 60)

                const hasOverlap = existingReservations.some(res => {
                    const resStart = parseInt(res.time.split(':')[0]) * 60 + parseInt(res.time.split(':')[1])
                    const resEnd = resStart + (res.duration_hours * 60)

                    // Overlap logic: R_start < E_end AND R_end > E_start
                    return requestedStart < resEnd && requestedEnd > resStart
                })

                if (hasOverlap) {
                    return NextResponse.json({
                        error: 'Кешіріңіз, бұл үстел таңдалған уақытта бос емес. Басқа уақыт немесе басқа үстел таңдаңыз.'
                    }, { status: 409 })
                }
            }
        }

        // Жалпы сомасын есептеу (тағамдар + брондау ақысы)
        const items_total = items.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
        )
        const total_amount = items_total + booking_fee

        // Резервация жасаймыз
        const { data: reservation, error: resError } = await supabase
            .from('reservations')
            .insert({
                cafe_id,
                customer_name,
                customer_phone,
                date,
                time,
                guests_count,
                table_id: table_id || null,
                payment_method: payment_method || 'cash',
                notes: notes || null,
                duration_hours,
                customer_id: customer_id || null,
                total_amount,
                booking_fee, // Store it here too
                status: 'pending',
                payment_status: 'pending'
            })
            .select()
            .single()

        if (resError) {
            console.error('Reservation insert error:', resError)
            // If it's a trigger exception, it usually contains a message we can show
            return NextResponse.json({ 
                error: resError.message.includes('Cafe is closed') || resError.message.includes('Reservation exceeds')
                    ? resError.message 
                    : 'Брондау кезінде қате кетті. Кейінірек қайталап көріңіз.' 
            }, { status: 400 })
        }

        // Алдын ала тапсырылған тағамдарды жазамыз
        if (items.length > 0) {
            const reservationItems = items.map((item: any) => ({
                reservation_id: reservation.id,
                menu_item_id: item.menu_item_id,
                name_kk: item.name_kk,
                name_ru: item.name_ru,
                price: item.price,
                quantity: item.quantity,
            }))

            const { error: itemsError } = await supabase
                .from('reservation_items')
                .insert(reservationItems)

            if (itemsError) {
                console.error('Reservation items insert error:', itemsError)
            }
        }

        // Import notifyAdmin (using relative path as it is /app/api/reservations/route.ts)
        const { notifyAdmin } = await import('@/lib/actions')
        await notifyAdmin(reservation, 'booking', cafe_id)

        return NextResponse.json({ success: true, reservation })
    } catch (err: any) {
        console.error('API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
