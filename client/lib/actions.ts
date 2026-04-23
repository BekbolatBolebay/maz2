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
        console.log(`[Notification][${timestamp}] Starting notifyAdmin via Bridge for type: ${type}, id: ${data.id}`);

        // Use the new bridge API to trigger notifications in the Admin app
        // This is more reliable as the Admin app is already configured for native push
        const { triggerAdminNotification } = await import('./admin-notify');
        const result = await triggerAdminNotification(data.id);

        if (result.success) {
            console.log(`[Notification][${timestamp}] ✅ Bridge notification triggered successfully`);
            return;
        }

        console.warn(`[Notification][${timestamp}] ⚠️ Bridge failed, falling back to direct delivery:`, result.error);

        // --- FALLBACK: Direct delivery from Client app (requires Client to have Firebase Admin keys) ---
        const supabase = await createClient()
        // ... (rest of existing logic)

        // Step 1: Find staff linked to this restaurant OR global admins
        let staffQuery = supabase
            .from('staff_profiles')
            .select('id, full_name, role, push_subscription, fcm_token, push_token, cafe_id')

        if (restaurantId) {
            // Find staff assigned to this cafe OR global admins
            staffQuery = staffQuery.or(`cafe_id.eq.${restaurantId},role.eq.admin`)
            console.log(`[Notification] Filtering for cafe_id: ${restaurantId} or global admins`);
        } else {
            // Fallback: Notify all admins
            staffQuery = staffQuery.eq('role', 'admin')
            console.log(`[Notification] Falling back to all global admins`);
        }

        const { data: staff, error: staffError } = await staffQuery

        if (staffError) {
            console.error('[Notification] Error fetching staff:', staffError)
            return
        }

        // Step 2: Filter only those with at least one push target
        const targetStaff = (staff || []).filter(member => !!member.fcm_token || !!member.push_subscription || !!member.push_token)

        if (targetStaff.length === 0) {
            console.warn(`[Notification][${timestamp}] ❌ No staff candidates found (Total staff checked: ${staff?.length || 0})`);
            return
        }
        
        console.log(`[Notification][${timestamp}] 🚀 Found ${targetStaff.length} recipients with active tokens`);

        const orderId = data.id.slice(0, 8)
        const tag = `${type}-${data.id}`
        const payload = {
            title: type === 'order' ? '🔔 Жаңа тапсырыс!' : '📅 Жаңа брондау!',
            body: type === 'order'
                ? `#${orderId} · ${data.total_amount}₸`
                : `${data.date} · ${data.time} · ${data.guests_count} адам · ${data.total_amount}₸`,
            url: type === 'order' ? '/orders' : '/orders',
            tag: tag
        }

        const pushPromises: Promise<any>[] = []

        for (const member of targetStaff) {
            // 1. FCM (High priority for background delivery)
            if (member.fcm_token) {
                try {
                    const { messaging } = await import('./firebase-admin')
                    if (messaging) {
                        const message = {
                            token: member.fcm_token,
                            android: {
                                priority: 'high',
                                notification: { sound: 'default' }
                            },
                            notification: {
                                title: payload.title,
                                body: payload.body,
                            },
                            data: {
                                url: payload.url,
                                orderId: data.id,
                                tag: tag
                            },
                            webpush: {
                                fcm_options: { link: payload.url },
                                headers: { Urgency: 'high' },
                                notification: {
                                    icon: '/icon-192x192.png',
                                    badge: '/icon-192x192.png',
                                    vibrate: [500, 110, 500, 110, 450],
                                    requireInteraction: true,
                                    silent: false,
                                    tag: tag
                                }
                            },
                        }
                        pushPromises.push(
                            (messaging as any).send(message)
                                .then((r: any) => console.log(`[FCM] ✅ Sent to ${member.full_name}`))
                                .catch((e: any) => console.error(`[FCM] ❌ Error for ${member.full_name}:`, e?.message))
                        )
                    }
                } catch (e) {
                    console.error('[FCM] Import error:', e)
                }
            }

            // 2. Web-Push fallback
            const subscription = member.push_subscription || (member.push_token ? JSON.parse(member.push_token) : null)

            if (subscription && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
                pushPromises.push(
                    webpush.sendNotification(
                        subscription as any,
                        JSON.stringify({
                            title: payload.title,
                            body: payload.body,
                            url: payload.url,
                            icon: '/icon-192x192.png',
                            badge: '/icon-192x192.png',
                            tag: tag,
                            vibrate: [500, 110, 500, 110, 450],
                            requireInteraction: true
                        }),
                        { 
                            headers: { 
                                'Urgency': 'high', 
                                'TTL': '86400' 
                            } 
                        }
                    )
                    .then(() => console.log(`[Web-Push] ✅ Sent successfully to ${member.full_name}`))
                    .catch((e: any) => console.error(`[Web-Push] ❌ Delivery failed for ${member.full_name}:`, e?.message))
                )
            }
        }

        await Promise.all(pushPromises)
        console.log('[Notification] ✅ All push notifications processed');

        // Step 3: Telegram Notification
        if (restaurantId) {
            const { data: restaurant, error: resError } = await supabase
                .from('restaurants')
                .select('telegram_bot_token, telegram_chat_id, name_ru')
                .eq('id', restaurantId)
                .single()

            if (resError) {
                console.warn(`[Notification] Restaurant info not found for Telegram:`, resError.message)
            }

            // Fallback to global token if restaurant-specific one is missing
            const botToken = restaurant?.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN
            const chatId = restaurant?.telegram_chat_id || process.env.TELEGRAM_CHAT_ID

            if (botToken && chatId) {
                console.log(`[Telegram] 🚀 Attempting to send to ${restaurant?.name_ru || 'Unknown'} (${chatId})`)
                await notifyAdminTelegram(data, type, {
                    ...restaurant,
                    telegram_bot_token: botToken,
                    telegram_chat_id: chatId
                })
            } else {
                console.warn(`[Telegram] ⚠️ Skipping: Bot token or Chat ID missing (Token: ${!!botToken}, ChatID: ${!!chatId})`)
            }
        }
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
