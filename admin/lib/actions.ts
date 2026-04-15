'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentRestaurantId } from './db'
import { DEFAULT_CATEGORIES } from './constants'
import { sendEmail, sendPushNotification, notifyCustomer } from './notifications'

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
        console.error('[addMenuItem] Insert Error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            payload: finalPayload
        })
        return { data: null, error: new Error(error.message || JSON.stringify(error)) }
    }
    revalidatePath('/menu')
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
    if (error) {
        console.error('Update MenuItem Error:', error)
        return { data: null, error: new Error(error.message || JSON.stringify(error)) }
    }
    revalidatePath('/menu')
    return { data, error }
}

export async function deleteMenuItem(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) {
        console.error('[deleteMenuItem] Delete Error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            id
        })
        return { error: new Error(error.message || JSON.stringify(error)) }
    }
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

// Telegram notification removed as per user request. Use notifyAdminAllChannels instead.

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

export async function sendTestEmailAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    return await sendEmail({
        to: user.email!,
        subject: 'Mazir App - Тест хабарламасы',
        html: `
            <h1>Сәлем!</h1>
            <p>Бұл Mazir App жүйесінен келген тест хабарламасы.</p>
            <p>Егер сіз бұны оқып тұрсаңыз, SMTP баптауларыңыз <b>дұрыс</b> жасалған.</p>
        `
    });
}

export async function sendTestPushAction(manualSubscription?: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    let subscription = manualSubscription;
    let fcmToken = null;

    if (!subscription) {
        const { data: profile } = await supabase
            .from('staff_profiles')
            .select('push_subscription, push_token, fcm_token')
            .eq('id', user.id)
            .single();
        
        subscription = profile?.push_subscription;
        fcmToken = profile?.fcm_token;

        if (!subscription && profile?.push_token) {
            try {
                subscription = JSON.parse(profile.push_token);
            } catch (e) {
                subscription = profile.push_token;
            }
        }
    }

    if (!subscription && !fcmToken) {
        return { success: false, error: 'Push-хабарламаларға рұқсат берілмеген. Алдымен "Қосу" батырмасын басыңыз.' };
    }

    // Diagnostic: Check if VAPID keys are loaded on the server
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    
    if (!vapidPublic || !vapidPrivate) {
        console.error('[Push Debug] Missing VAPID keys on server:', { public: !!vapidPublic, private: !!vapidPrivate });
        return { 
            success: false, 
            error: `Серверде VAPID кілттері жоқ! (Public: ${!!vapidPublic}, Private: ${!!vapidPrivate}). Баптауларды (Env vars) тексеріңіз.` 
        };
    }

    // Parse push_subscription from various formats
    let subscription = profile?.push_subscription;
    if (!subscription && profile?.push_token) {
        try {
            subscription = JSON.parse(profile.push_token);
        } catch (e) {
    try {
        const result = await sendPushNotification({ 
            push_subscription: subscription,
            fcm_token: fcmToken
        }, {
            title: 'Тест хабарламасы',
            body: 'Native Web-Push сәтті қосылды! ✅',
            icon: '/icon-192x192.png'
        });
        
        if (!result.success) {
            return { success: false, error: `Жіберу сәтсіз: ${result.error}` };
        }
        
        return result;
    } catch (e: any) {
        console.error('[Push Action Error]:', e);
        return { success: false, error: `Жүйелік қате: ${e.message || 'Unknown server error'}` };
    }
}

// Server Actions for VPS syncing (securely authenticated)
export async function saveMerchantConfigAction(restaurantId: string, data: Record<string, any>) {
    const { saveMerchantConfig } = await import('./vps');
    return await saveMerchantConfig(restaurantId, data);
}

export async function updateRestaurantStatusAction(restaurantId: string, status: string) {
    const { updateRestaurantStatus } = await import('./vps');
    return await updateRestaurantStatus(restaurantId, status);
}

export async function notifyCustomerAction(userId: string, payload: { title: string; body: string; icon?: string; url?: string }) {
    return await notifyCustomer(userId, payload);
}

export async function signOutAction() {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    return { error }
}
