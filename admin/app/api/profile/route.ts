import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('staff_profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) throw error

        return NextResponse.json({ profile: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { full_name, phone } = await request.json()

        if (!full_name || !phone) {
            return NextResponse.json({ error: 'Full name and phone are required' }, { status: 400 })
        }

        // 1. Update public.staff_profiles
        const { error: dbError } = await supabase
            .from('staff_profiles')
            .update({
                full_name,
                phone,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (dbError) throw dbError

        // 2. Sync with auth.users using Admin SDK
        const adminClient = createAdminClient()
        const { error: authError } = await adminClient.auth.admin.updateUserById(
            user.id,
            { user_metadata: { full_name } }
        )

        if (authError) {
            console.error('Error syncing auth metadata:', authError)
            // We don't throw here to avoid failing the whole request if only sync fails
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Profile update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
