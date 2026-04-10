import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { savePII, updateRestaurantStatus } from '@/lib/vps'

export async function POST(request: Request) {
    const headers = { 'X-API-Version': '1.0.1-REINFORCED' };
    console.log('[RegisterAPI] Start Registration Trace');
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

        // 1. Create User via Admin Auth
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role: 'admin',
                // Keep minimal info in metadata, real PII goes to VPS
                full_name: 'Admin' 
            }
        })

        if (userError) {
            console.error('Registration Error (User):', userError)
            return NextResponse.json({ error: userError.message }, { status: 400 })
        }

        const userId = userData.user.id
        console.log('[RegisterAPI] User created in Supabase:', userId);

        // Helper to cleanup user if subsequent steps fail
        const rollbackUser = async () => {
            console.log('[RegisterAPI] Rolling back user creation for:', userId);
            await supabaseAdmin.auth.admin.deleteUser(userId);
        };

        console.log('[RegisterAPI] 2. Saving PII to VPS for UserId:', userId);
        let vpsProfileId;
        try {
            vpsProfileId = await savePII('profiles', {
                full_name: cafeName,
                phone: whatsapp,
                email: email,
                supabase_id: userId
            });
        } catch (vpsError: any) {
            console.error('Registration Error (VPS savePII):', vpsError.message || vpsError);
            await rollbackUser();
            return NextResponse.json({ 
                error: 'VPS Error: Could not save profile information. ' + (vpsError.message || '')
            }, { status: 500 });
        }

        console.log('[RegisterAPI] 3. Creating Staff Profile in Supabase');
        const { error: profileError } = await supabaseAdmin.from('staff_profiles').insert({
            id: userId,
            email: email,
            full_name: vpsProfileId, // Store VPS ID instead of real name
            role: 'admin'
        })

        if (profileError && profileError.code !== '23505') { // Ignore unique violation if trigger already ran
            console.error('Registration Error (Profile):', profileError)
        }

        console.log('[RegisterAPI] 4. Creating Restaurant record');
        const { data: cafeData, error: cafeError } = await supabaseAdmin.from('restaurants').insert({
            name_kk: cafeName,
            name_ru: cafeName,
            name_en: cafeName,
            address: address,
            phone: whatsapp, // We store this here for operational use, but PII is primarily in VPS
            owner_id: userId,
            status: 'open',
            is_open: true,
            city: 'Алматы',
            latitude: latitude,
            longitude: longitude,
        }).select().single()

        if (cafeError) {
            console.error('Registration Error (Cafe):', cafeError)
            await rollbackUser();
            return NextResponse.json({ error: cafeError.message }, { status: 400 })
        }

        // Initialize Operational Status on VPS
        if (cafeData) {
            try {
                await updateRestaurantStatus(cafeData.id, 'open');
            } catch (statusError: any) {
                console.error('Registration Warning (VPS Status):', statusError.message || statusError);
                // Non-blocking but logged
            }
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
            message: 'Registration successful',
            version: '1.0.1-REINFORCED'
        }, { headers })

    } catch (error: any) {
        console.error('API Registration Full Error:', error);
        // Final attempt to rollback if we have a userId but didn't finish
        // We can't easily track exactly where it failed here without more state, 
        // but the individual steps above handle main rollback points.
        return NextResponse.json({ 
            error: 'Internal Server Error: ' + (error.message || 'Unknown error occurred')
        }, { status: 500 })
    }
}
