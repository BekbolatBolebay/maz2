'use server'

import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    const pubKey = VAPID_PUBLIC_KEY.trim();
    const privKey = VAPID_PRIVATE_KEY.trim();

    webpush.setVapidDetails(
        VAPID_SUBJECT,
        pubKey,
        privKey
    )
    console.log('[Push] Client VAPID configured successfully');
} else {
    console.warn('[Push] Client VAPID keys missing! Order notifications will fail.');
}

export async function notifyAdmin(data: any, type: 'order' | 'booking', restaurantId?: string) {
    try {
        const timestamp = new Date().toISOString();
        const supabase = await createClient()

        console.log(`[Notification][${timestamp}] Starting notification process for type: ${type}`);

        // --- Step 0: Telegram Notification (ULTIMATE FALLBACK) ---
        let botToken = process.env.TELEGRAM_BOT_TOKEN
        let chatId = process.env.TELEGRAM_CHAT_ID
        let restaurantName = 'Unknown'

        if (restaurantId) {
            const { data: restaurant } = await supabase
                .from('restaurants')
                .select('telegram_bot_token, telegram_chat_id, name_ru')
                .eq('id', restaurantId)
                .single()

            if (restaurant) {
                if (restaurant.telegram_bot_token) botToken = restaurant.telegram_bot_token
                if (restaurant.telegram_chat_id) chatId = restaurant.telegram_chat_id
                restaurantName = restaurant.name_ru || 'Unknown'
            }
        }

        if (botToken && chatId) {
            console.log(`[Telegram] 🚀 Attempting send to ${restaurantName} (${chatId})`)
            await notifyAdminTelegram(data, type, {
                name_ru: restaurantName,
                telegram_bot_token: botToken,
                telegram_chat_id: chatId
            })
        } else {
            console.warn(`[Telegram] ❌ No configuration found (Restaurant: ${restaurantName}, GlobalToken: ${!!process.env.TELEGRAM_BOT_TOKEN})`)
        }

        console.log(`[Notification][${timestamp}] ✅ Notification process completed`);
    } catch (error) {
        console.error('[Notification] Fatal error:', error)
    }
}

// Deprecated: keeping only for reference, but wont be called
export async function notifyAdminTelegram(data: any, type: 'order' | 'booking', restaurant: any) {
    try {
        const orderId = data.id.slice(0, 8)
        const title = type === 'order' ? '🔔 *Жаңа тапсырыс!*' : '📅 *Жаңа брондау!*'

        let message = `${title}\n\n`
        message += `📍 Мейрамхана: ${restaurant.name_ru}\n`
        message += `🆔 ID: #${orderId}\n`

        if (type === 'order') {
            message += `💰 Сомасы: *${data.total_amount} ₸*\n`
            message += `📦 Тауар саны: ${data.items_count}\n`
            message += `👤 Клиент: ${data.customer_name || 'Көрсетілмеген'}\n`
            message += `📞 Тел: ${data.customer_phone || 'Көрсетілмеген'}\n`
            if (data.address) message += `🏠 Мекен-жай: ${data.address}\n`
        } else {
            message += `📅 Күні: ${data.date}\n`
            message += `⏰ Уақыты: ${data.time}\n`
            message += `👥 Адам саны: ${data.guests_count}\n`
            message += `👤 Клиент: ${data.customer_name}\n`
            message += `📞 Тел: ${data.customer_phone}\n`
        }

        message += `\n🔗 [Админ панельге өту](https://cafeadminis.mazirapp.kz/orders)`

        await fetch(`https://api.telegram.org/bot${restaurant.telegram_bot_token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: restaurant.telegram_chat_id,
                text: message,
                parse_mode: 'Markdown',
            }),
        }).then(res => res.json()).then(res => {
            if (res.ok) {
                console.log(`[Telegram] ✅ Sent successfully to restaurant: ${restaurant.name_ru || 'Unknown'}`)
            } else {
                console.error(`[Telegram] ❌ API Error:`, res.description)
            }
        })
    } catch (error: any) {
        console.error('[Telegram] ❌ Fatal Error:', error.message)
    }
}

/**
 * Updates the restaurant rating based on the average of all reviews
 * Called whenever a new review is submitted
 */
export async function updateRestaurantRating(restaurantId: string) {
    try {
        const supabase = await createClient()

        // Get all reviews for this restaurant
        const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('cafe_id', restaurantId)

        if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError)
            throw reviewsError
        }

        if (!reviews || reviews.length === 0) {
            console.log('No reviews found, setting rating to 0')
            // If no reviews, set rating to 0
            const { error: updateError } = await supabase
                .from('restaurants')
                .update({ rating: 0 })
                .eq('id', restaurantId)

            if (updateError) throw updateError
            return 0
        }

        // Calculate average rating
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        const roundedRating = Math.round(averageRating * 10) / 10 // Round to 1 decimal place

        // Update restaurant rating
        const { error: updateError } = await supabase
            .from('restaurants')
            .update({ rating: roundedRating })
            .eq('id', restaurantId)

        if (updateError) {
            console.error('Error updating restaurant rating:', updateError)
            throw updateError
        }

        console.log(`[updateRestaurantRating] Updated restaurant ${restaurantId} rating to ${roundedRating}`)
        return roundedRating
    } catch (error) {
        console.error('[updateRestaurantRating] Error:', error)
        throw error
    }
}

export async function getSecureMerchantConfig(restaurantId: string) {
    if (!restaurantId) return null;
    try {
        const supabase = await createClient();
        const { data: restaurant, error } = await supabase
            .from('restaurants')
            .select('kaspi_link, accept_kaspi, accept_freedom')
            .eq('id', restaurantId)
            .single();

        if (error) {
            console.error('[getSecureMerchantConfig] Supabase error:', error);
            // Fallback to VPS if Supabase record is missing or has error
            try {
                const { getMerchantConfig } = await import('./vps');
                const config = await getMerchantConfig(restaurantId);
                if (config) {
                    return {
                        kaspi_link: config.kaspi_link,
                        accept_kaspi: config.accept_kaspi,
                        accept_freedom: config.accept_freedom
                    };
                }
            } catch (vpsErr) {
                console.error('[getSecureMerchantConfig] VPS Fallback failed:', vpsErr);
            }
            return null;
        }

        return {
            kaspi_link: restaurant.kaspi_link,
            accept_kaspi: restaurant.accept_kaspi,
            accept_freedom: restaurant.accept_freedom
        };
    } catch (error) {
        console.error('[getSecureMerchantConfig] Error:', error);
        return null;
    }
}
