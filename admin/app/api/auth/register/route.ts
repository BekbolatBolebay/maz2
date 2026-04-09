import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            email,
            password,
            cafeName,
            address,
            whatsapp,
            latitude,
            longitude,
            openTime,
            closeTime,
            selectedDays
        } = body

        const supabaseAdmin = createAdminClient()

        // 1. Create User via Admin Auth (bypasses email confirmation if desired, sets metadata)
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role: 'admin',
                full_name: cafeName
            }
        })

        if (userError) {
            console.error('Registration Error (User):', userError)
            return NextResponse.json({ error: userError.message }, { status: 400 })
        }

        const userId = userData.user.id

        // 1b. Create Staff Profile (just in case trigger fails or for immediate consistency)
        const { error: profileError } = await supabaseAdmin.from('staff_profiles').insert({
            id: userId,
            email: email,
            full_name: cafeName,
            role: 'admin'
        })

        if (profileError && profileError.code !== '23505') { // Ignore unique violation if trigger already ran
            console.error('Registration Error (Profile):', profileError)
        }

        // 2. Create Restaurant
        const { data: cafeData, error: cafeError } = await supabaseAdmin.from('restaurants').insert({
            name_kk: cafeName,
            name_ru: cafeName,
            name_en: cafeName,
            address: address,
            phone: whatsapp,
            owner_id: userId,
            status: 'open',
            is_open: true,
            city: 'Алматы', // Default city to ensure visibility in filtered lists
            latitude: latitude,
            longitude: longitude,
        }).select().single()

        if (cafeError) {
            console.error('Registration Error (Cafe):', cafeError)
            // Cleanup user if restaurant creation fails? Maybe not necessary for this flow
            return NextResponse.json({ error: cafeError.message }, { status: 400 })
        }

        // 3. Create Default Working Hours
        const workingHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            cafe_id: cafeData.id,
            day_of_week: day,
            open_time: openTime,
            close_time: closeTime,
            is_day_off: !selectedDays.includes(day),
        }))

        const { error: hoursError } = await supabaseAdmin.from('working_hours').insert(workingHours)
        if (hoursError) {
            console.error('Registration Error (Hours):', hoursError)
        }

        return NextResponse.json({
            success: true,
            message: 'Registration successful'
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
