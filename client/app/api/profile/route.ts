import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { savePII, getPII } from '@/lib/vps'

export async function GET() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ user, profile })
}

export async function PUT(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { full_name, phone } = body

        if (!full_name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
        }

        // 1. Save PII to VPS
        const vpsId = await savePII('profiles', {
            full_name,
            phone,
            user_id: user.id,
            type: 'profile'
        });

        // 2. Update public.staff_profiles with VPS ID
        const { error: updateError } = await supabase
            .from('staff_profiles')
            .update({ full_name: vpsId, phone: vpsId })
            .eq('id', user.id)

        if (updateError) {
            // Try clients table too
            await supabase
                .from('clients')
                .update({ full_name: vpsId, phone: vpsId })
                .eq('id', user.id)
        }

        // 3. Update auth.users metadata via Admin API
        const adminClient = createAdminClient()
        await adminClient.auth.admin.updateUserById(
            user.id,
            {
                user_metadata: { vps_id: vpsId },
                // We keep phone in Supabase auth for OTP if needed, 
                // but usually the user wants it GONE from Supabase.
                // For now, let's just store the ID in profile tables.
            }
        )

        return NextResponse.json({ success: true, vps_id: vpsId })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
