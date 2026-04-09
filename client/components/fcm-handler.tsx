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

                const token = await getFcmToken()
                
                if (token) {
                    // Update fcm_token in clients table
                    await supabase
                        .from('clients')
                        .update({ 
                            fcm_token: token,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', user.id)
                }

                // Listen for foreground messages
                onMessageListener().then((payload: any) => {
                    console.log('[FCMHandler] Foreground message received:', payload)
                    toast.success(payload.notification?.title || 'Новое уведомление', {
                        description: payload.notification?.body,
                    })
                })
            } catch (error) {
                console.error('[FCMHandler] Error setting up FCM:', error)
            }
        }

        setupFCM()
    }, [])

    return null
}
