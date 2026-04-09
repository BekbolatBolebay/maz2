'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentRestaurantId } from './cafe-db'

export async function addMenuItem(payload: any) {
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return { data: null, error: new Error('Unauthorized') }

    const supabase = await createClient()
    const finalPayload = {
        ...payload,
        cafe_id: restaurantId,
    }

    const { data, error } = await supabase.from('menu_items').insert(finalPayload).select().single()
    if (!error) revalidatePath('/manage/menu')
    return { data, error }
}

export async function updateMenuItem(id: string, payload: any) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
    if (!error) revalidatePath('/manage/menu')
    return { data, error }
}

export async function deleteMenuItem(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (!error) revalidatePath('/manage/menu')
    return { error }
}
