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
        const { messaging } = await import('./firebase-admin')
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.error('Unauthorized notification attempt')
            return
        }

        // 1. Determine which admin to notify. 
        let adminQuery = supabase
            .from('staff_profiles')
            .select('push_subscription, fcm_token')
            .eq('role', 'admin')

        if (restaurantId) {
            const { data: restaurant } = await supabase
                .from('restaurants')
                .select('owner_id')
                .eq('id', restaurantId)
                .single()

            if (restaurant?.owner_id) {
                adminQuery = adminQuery.eq('id', restaurant.owner_id)
            }
        }

        const { data: admins } = await adminQuery

        if (!admins || admins.length === 0) {
            console.log('No admins found for this restaurant')
            return
        }

        const orderId = data.id.slice(0, 8)
        const payload = {
            title: type === 'order' ? 'Жаңа тапсырыс!' : 'Жаңа брондау!',
            body: type === 'order'
                ? `#${orderId} тапсырыс - ${data.total_amount}₸`
                : `${data.date} күні сағат ${data.time}-ге брондау (${data.guests_count} адам). Сомасы: ${data.total_amount}₸`,
            url: type === 'order' ? '/orders' : '/reservations'
        }

        // 2. Send Push via Web-Push (Legacy) and Firebase (FCM)
        const pushPromises: Promise<any>[] = []

        admins.forEach(admin => {
            // Web-Push
            if (admin.push_subscription && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
                pushPromises.push(
                    webpush.sendNotification(
                        admin.push_subscription as any,
                        JSON.stringify(payload)
                    ).catch(err => console.error('Web-Push Error:', err))
                )
            }

            // Firebase FCM
            if (admin.fcm_token) {
                const message = {
                    token: admin.fcm_token,
                    notification: {
                        title: payload.title,
                        body: payload.body,
                    },
                    data: {
                        url: payload.url,
                        orderId: data.id,
                    },
                    webpush: {
                        fcm_options: {
                            link: payload.url,
                        },
                    },
                }

                pushPromises.push(
                    (messaging as any).send(message)
                        .then((response: any) => console.log('FCM Success:', response))
                        .catch((error: any) => console.error('FCM Error:', error))
                )
            }
        })

        await Promise.all(pushPromises)
    } catch (error) {
        console.error('Error notifying admins:', error)
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
