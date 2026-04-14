'use server'

import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    )
}

export async function notifyAdmin(data: any, type: 'order' | 'booking', restaurantId?: string) {
    try {
        console.log(`[Notification] Starting notifyAdmin for type: ${type}, restaurantId: ${restaurantId}`);
        const { messaging } = await import('./firebase-admin')
        const supabase = await createClient()

        // 1. Determine which staff members to notify.
        // We notify admins, managers, and staff (for orders) who are associated with the restaurant.
        let staffQuery = supabase
            .from('staff_profiles')
            .select('id, full_name, role, push_subscription, fcm_token')
            .not('fcm_token', 'is', null) // Prioritize FCM

        if (restaurantId) {
            staffQuery = staffQuery.eq('cafe_id', restaurantId)
        } else {
            // General admins if no restaurantId
            staffQuery = staffQuery.eq('role', 'admin')
        }

        const { data: staff, error: staffError } = await staffQuery

        if (staffError) {
            console.error('[Notification] Error fetching staff:', staffError)
            return
        }

        if (!staff || staff.length === 0) {
            console.log(`[Notification] No staff with FCM tokens found for restaurant ${restaurantId}`);
            // Fallback: check if anyone has legacy push_subscription
            const { data: legacyStaff } = await supabase
                .from('staff_profiles')
                .select('id, full_name, role, push_subscription, fcm_token')
                .eq('cafe_id', restaurantId)
                .not('push_subscription', 'is', null)
            
            if (!legacyStaff || legacyStaff.length === 0) {
                console.log('[Notification] Totally no staff found to notify');
                return
            }
        }

        const orderId = data.id.slice(0, 8)
        const payload = {
            title: type === 'order' ? 'Жаңа тапсырыс!' : 'Жаңа брондау!',
            body: type === 'order'
                ? `#${orderId} тапсырыс - ${data.total_amount}₸`
                : `${data.date} күні сағат ${data.time}-ге брондау (${data.guests_count} адам). Сомасы: ${data.total_amount}₸`,
            url: type === 'order' ? '/orders' : '/reservations'
        }

        const pushPromises: Promise<any>[] = []

        // Filter staff based on the "бәріне өз рөлдеріне сай" (everyone according to their role)
        // For orders: notify all staff
        // For bookings: notify only admins and managers
        const targetStaff = staff?.filter(member => {
            if (type === 'order') return true; // All roles get order notifications
            if (type === 'booking') return ['admin', 'manager'].includes(member.role || '');
            return false;
        }) || [];

        console.log(`[Notification] Found ${targetStaff.length} targets to notify`);

        targetStaff.forEach(member => {
            // Priority 1: Firebase FCM
            if (member.fcm_token) {
                const message = {
                    token: member.fcm_token,
                    notification: {
                        title: payload.title,
                        body: payload.body,
                    },
                    data: {
                        url: payload.url,
                        orderId: data.id,
                        click_action: payload.url, // For some background handlers
                    },
                    webpush: {
                        fcm_options: {
                            link: payload.url,
                        },
                        notification: {
                            icon: '/favicon-32x32.png',
                            badge: '/icon-192x192.png',
                             vibrate: [200, 100, 200],
                        }
                    },
                }

                pushPromises.push(
                    (messaging as any).send(message)
                        .then((response: any) => console.log(`[FCM] Success for ${member.full_name}:`, response))
                        .catch((error: any) => {
                            console.error(`[FCM] Error for ${member.full_name}:`, error);
                            // If token is invalid, we might want to clear it (optional)
                        })
                )
            }

            // Priority 2: Web-Push (Fallback)
            if (member.push_subscription && !member.fcm_token && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
                pushPromises.push(
                    webpush.sendNotification(
                        member.push_subscription as any,
                        JSON.stringify(payload)
                    ).catch(err => console.error(`[Web-Push] Error for ${member.full_name}:`, err))
                )
            }
        })

        await Promise.all(pushPromises)
        console.log('[Notification] Finished sending all push promises');
    } catch (error) {
        console.error('[Notification] Fatal error notifying staff:', error)
    }
}

// Deprecated: keeping only for reference, but wont be called
export async function notifyAdminTelegram(order: any, restaurant: any) {
    // Disabled
    return
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
