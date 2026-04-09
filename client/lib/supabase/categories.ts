import { createClient } from '@/lib/supabase/client'

export async function getGlobalCategories() {
    const supabase = createClient()

    // Get categories visible on home page, ordered by custom sort order
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('home_visible', true)
        .order('home_sort_order', { ascending: true })

    if (error || !data) return []

    return data
}
