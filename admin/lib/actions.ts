'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentRestaurantId } from './db'
import { DEFAULT_CATEGORIES } from './constants'

export async function getDebugInfo() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return {
        uid: user?.id,
        email: user?.email,
        role: user?.app_metadata?.role || user?.user_metadata?.role
    }
}

// Стандартты категорияларды ресторанға қосу (бар болса қайталамайды)
export async function seedDefaultCategories(shouldRevalidate = true, restaurantId?: string) {
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { error: new Error('Unauthorized') }

    const supabase = await createClient()

    // Бар категорияларды алу
    const { data: existing } = await supabase
        .from('categories')
        .select('name_kk')
        .eq('cafe_id', id)

    const existingNames = new Set((existing || []).map((c: any) => c.name_kk))

    console.log('Duplication Debug - Existing Names:', Array.from(existingNames))

    // Жоқ категорияларды ғана қосу
    const toInsert = DEFAULT_CATEGORIES
        .filter(c => !existingNames.has(c.name_kk))
        .map(c => ({
            name_kk: c.name_kk,
            name_ru: c.name_ru,
            name_en: c.name_en,
            sort_order: c.sort_order,
            cafe_id: id,
            is_active: true,
            icon_url: '',
            is_combo: c.name_kk === 'Комболар' || c.name_kk === 'Combo'
        }))

    if (toInsert.length === 0) return { error: null, added: 0 }

    const { error } = await supabase.from('categories').insert(toInsert)
    // Removed revalidatePath entirely from this function as it's called during render
    return { error, added: toInsert.length }
}

export async function addMenuItem(payload: any, restaurantId?: string) {
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { data: null, error: new Error('Unauthorized') }

    const supabase = await createClient()
    const finalPayload = {
        ...payload,
        cafe_id: id,
    }

    const { data, error } = await supabase.from('menu_items').insert(finalPayload).select().single()
    if (error) {
        console.error('Add MenuItem Error:', error)
    }
    if (!error) revalidatePath('/menu')
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
    if (!error) revalidatePath('/menu')
    return { data, error }
}

export async function deleteMenuItem(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (!error) revalidatePath('/menu')
    return { error }
}

export async function addCategory(payload: any, restaurantId?: string) {
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { data: null, error: new Error('Unauthorized') }

    const supabase = await createClient()
    const finalPayload = {
        ...payload,
        cafe_id: id
    }

    const { data, error } = await supabase.from('categories').insert(finalPayload).select().single()
    if (!error) revalidatePath('/menu')
    return { data, error }
}

export async function updateCategory(id: string, payload: any) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
    if (!error) revalidatePath('/menu')
    return { data, error }
}

export async function deleteCategory(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) revalidatePath('/menu')
    return { error }
}

export async function addTable(payload: any, restaurantId?: string) {
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { data: null, error: new Error('Unauthorized') }

    const supabase = await createClient()
    const finalPayload = {
        ...payload,
        cafe_id: id,
    }

    const { data, error } = await supabase.from('restaurant_tables').insert(finalPayload).select().single()
    if (!error) revalidatePath('/tables')
    return { data, error }
}

export async function updateTable(id: string, payload: any) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('restaurant_tables')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
    if (!error) revalidatePath('/tables')
    return { data, error }
}

export async function deleteTable(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('restaurant_tables')
        .update({ is_active: false })
        .eq('id', id)
    if (!error) revalidatePath('/tables')
    return { error }
}

export async function notifyAdminTelegram(order: any, restaurant: any) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || restaurant?.telegram_bot_token
    const chatId = restaurant?.telegram_chat_id

    if (!botToken || !chatId) return

    const orderId = order.id.slice(0, 8)
    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mazir-admin.vercel.app'}/orders`
    const itemsText = order.order_items?.map((item: any) =>
        `- ${item.menu_items?.name_ru || item.menu_items?.name} x${item.quantity}`
    ).join('\n') || ''

    const isKk = restaurant.lang === 'kk'
    const message = isKk
        ? `🆕 *Жаңа тапсырыс #${orderId}*\n\n` +
        `👤 Клиент: ${order.customer_name || 'Клиент'}\n` +
        `📞 Телефон: ${order.customer_phone}\n` +
        `💰 Сомасы: ${order.total_amount} ₸\n` +
        `📍 Түрі: ${order.type === 'delivery' ? 'Жеткізу' : 'Алып кету'}\n\n` +
        `🛒 Тамақтар:\n${itemsText}\n\n` +
        `🔗 [Админ панелінде ашу](${adminUrl})`
        : `🆕 *Новый заказ #${orderId}*\n\n` +
        `👤 Клиент: ${order.customer_name || 'Клиент'}\n` +
        `📞 Телефон: ${order.customer_phone}\n` +
        `💰 Сумма: ${order.total_amount} ₸\n` +
        `📍 Тип: ${order.type === 'delivery' ? 'Доставка' : 'Самовывоз'}\n\n` +
        `🛒 Позиции:\n${itemsText}\n\n` +
        `🔗 [Открыть в админ панели](${adminUrl})`

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Telegram notification failed:', {
                status: response.status,
                error: errorData
            })
        }
    } catch (err) {
        console.error('Telegram notification network error:', err)
    }
}

export async function updateWorkingHours(hours: any[], restaurantId?: string) {
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { error: new Error('Unauthorized') }

    const supabase = await createClient()

    // 1. Delete existing hours
    const { error: deleteError } = await supabase
        .from('working_hours')
        .delete()
        .eq('cafe_id', id)

    if (deleteError) return { error: deleteError }

    // 2. Insert new hours
    const toInsert = hours.map(({ id: hourId, created_at, updated_at, ...h }) => ({
        ...h,
        cafe_id: id
    }))

    const { error: insertError } = await supabase
        .from('working_hours')
        .insert(toInsert)

    if (!insertError) revalidatePath('/profile')
    return { error: insertError }
}

export async function updateCafeSettings(payload: any, restaurantId?: string) {
    const id = restaurantId || await getCurrentRestaurantId()
    if (!id) return { data: null, error: new Error('Unauthorized') }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { data: null, error: new Error('Unauthorized') }

    // Use update since getCurrentRestaurantId guarantees the record exists
    const { data, error } = await supabase
        .from('restaurants')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

    if (!error) {
        revalidatePath('/profile')
        revalidatePath('/') // Dashboard might display some settings
        revalidatePath(`/restaurant/${id}`)
    }
    return { data, error }
}
