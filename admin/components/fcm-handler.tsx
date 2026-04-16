'use client'

import { useEffect } from 'react'
import { getFcmToken, onMessageListener } from '@/lib/firebase'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function FCMHandler() {
    useEffect(() => {
        const setupFCM = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                
                if (!user) return

                const registration = await navigator.serviceWorker.ready
                const token = await getFcmToken(registration)
                
                if (token) {
                    // Update token in database if it exists
                    await supabase
                        .from('staff_profiles')
                        .update({ 
                            fcm_token: token,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', user.id)
                }

                // Listen for foreground messages
                const unsubscribe = onMessageListener((payload: any) => {
                    console.log('[FCMHandler] Foreground message received:', payload)
                    toast.success(payload.notification?.title || 'Жаңа хабарлама', {
                        description: payload.notification?.body,
                        action: {
                            label: 'Көру',
                            onClick: () => window.location.href = payload.data?.url || '/orders'
                        }
                    })
                })

                return unsubscribe
            } catch (error) {
                console.error('[FCMHandler] Error setting up FCM:', error)
            }
        }

        let unsubscribe: (() => void) | undefined
        setupFCM().then(u => unsubscribe = u)
        
        return () => {
            if (unsubscribe) unsubscribe()
        }
    }, [])

    return null
}
