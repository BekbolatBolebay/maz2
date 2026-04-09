import { createClient } from '@/lib/supabase/server'
import ProfileClient from './profile-client'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user is anonymous (guest)
    if (user.is_anonymous) {
        redirect('/login?next=/profile')
    }

    // Try clients table first
    let { data: profile } = await supabase
        .from('clients')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        // Fallback to staff_profiles table
        const { data: legacyProfile } = await supabase
            .from('staff_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        profile = legacyProfile
    }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, name_ru, name_kk')
        .eq('owner_id', user.id)
        .single()

    return <ProfileClient user={user} profile={profile} restaurant={restaurant} />
}
