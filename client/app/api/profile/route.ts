import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

        // 1. Update public.staff_profiles
        const { error: updateError } = await supabase
            .from('staff_profiles')
            .update({ full_name, phone })
            .eq('id', user.id)

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        // 2. Update auth.users metadata via Admin API to keep them in sync
        const adminClient = createAdminClient()
        const { error: adminError } = await adminClient.auth.admin.updateUserById(
            user.id,
            {
                user_metadata: { full_name },
                phone: phone // Note: Supabase might require OTP verification for phone change if enabled
            }
        )

        if (adminError) {
            console.error('Admin sync error:', adminError)
            // We don't fail the whole request if admin sync fails, 
            // but log it since DB is updated.
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
