'use server'

import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.com'

// Configure web push with retry logic
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    )
    console.log('[Notifications] Web push configured successfully')
} else {
    console.warn('[Notifications] VAPID keys not configured! Push notifications will not work.')
}



export async function notifyCustomer(
    customerId: string,
    payload: { title: string; body: string; url?: string },
    retries = 3
) {
    const startTime = Date.now()
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const clientSupabase = await createClient()
            const { data: { user } } = await clientSupabase.auth.getUser()

            if (!user) {
                throw new Error('Unauthorized: No user session')
            }

            // Verify role (admin or super_admin)
            const { data: profile } = await clientSupabase
                .from('staff_profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
                throw new Error('Forbidden: User is not an admin')
            }

            const supabase = createAdminClient()

            // Fetch customer push info
            let { data: customer } = await supabase
                .from('clients')
                .select('push_subscription, fcm_token')
                .eq('id', customerId)
                .single()

            if (!customer) {
                // Try staff_profiles table (in case admin is the customer, e.g. testing)
                const { data: staff } = await supabase
                    .from('staff_profiles')
                    .select('push_subscription, fcm_token')
                    .eq('id', customerId)
                    .single()
                customer = staff as any
            }

            if (!customer || (!customer.push_subscription && !customer.fcm_token)) {
                console.log(`[Notifications] Customer ${customerId} has no push subscription/token`)
                return { success: false, error: 'No subscription found' }
            }

            const pushPromises: Promise<any>[] = []

            // 1. Web-Push (Legacy)
            if (customer.push_subscription && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
                const subObj = typeof customer.push_subscription === 'string' 
                    ? JSON.parse(customer.push_subscription) 
                    : customer.push_subscription
                
                pushPromises.push(
                    webpush.sendNotification(subObj, JSON.stringify(payload))
                )
            }

            // 2. Firebase FCM
            if (customer.fcm_token) {
                const { messaging } = await import('./firebase-admin')
                const message = {
                    token: customer.fcm_token,
                    notification: {
                        title: payload.title,
                        body: payload.body,
                    },
                    data: {
                        url: payload.url || '/',
                    },
                    webpush: {
                        fcm_options: {
                            link: payload.url || '/',
                        },
                    },
                }
                pushPromises.push((messaging as any).send(message))
            }

            await Promise.all(pushPromises)

            console.log(`[Notifications] Sent to customer ${customerId} on attempt ${attempt}`)
            return { success: true, attempts: attempt }
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))
            if (attempt < retries) {
                const backoffMs = Math.pow(3, attempt - 1) * 100
                await new Promise((resolve) => setTimeout(resolve, backoffMs))
            }
        }
    }

    console.error(`[Notifications] Failed for customer ${customerId}:`, lastError?.message)
    return { success: false, error: lastError?.message }
}

