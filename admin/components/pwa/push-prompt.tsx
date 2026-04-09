'use client'

import { useState, useEffect } from 'react'
import { Bell, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/lib/app-context'
import { toast } from 'sonner'
import { resumeAudioContext } from '@/lib/sound-utils'
import { getFcmToken } from '@/lib/firebase'

export function PushPrompt() {
    const { lang } = useApp()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
            console.warn('[PushPrompt] Browser does not support Notifications API')
            return
        }

        console.log('[PushPrompt] Notification permission:', Notification.permission)

        // Only show if permission is 'default' (not yet asked)
        if (Notification.permission === 'default') {
            const timer = setTimeout(() => {
                console.log('[PushPrompt] Showing notification permission dialog')
                setOpen(true)
            }, 3000) // Show after 3 seconds
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAllow = async () => {
        setLoading(true)
        setError(null)
        
        const startTime = Date.now()
        console.log('[PushPrompt] Starting permission request process...')

        try {
            // Step 1: Request notification permission
            console.log('[PushPrompt] Requesting notification permission')
            const permission = await Notification.requestPermission()
            
            if (permission !== 'granted') {
                const errorMsg = lang === 'ru' ? 'Уведомления были отклонены' : 'Хабарламалар қабылданбады'
                console.warn('[PushPrompt] Permission denied:', permission)
                setError(errorMsg)
                toast.error(errorMsg)
                setLoading(false)
                return
            }

            console.log('[PushPrompt] Permission granted')

            // Step 2: Check service worker support
            if (!('serviceWorker' in navigator)) {
                const errorMsg = lang === 'ru' ? 'Service Worker не поддерживается' : 'Service Worker қоса қолдау берілмеген'
                console.error('[PushPrompt]', errorMsg)
                setError(errorMsg)
                toast.error(errorMsg)
                setLoading(false)
                return
            }

            console.log('[PushPrompt] Service Worker is supported')
            
            // Step 3: Ensure service worker is registered
            // next-pwa handles registration, but we want to make sure it's active
            console.log('[PushPrompt] Checking existing registrations...')
            let registrations = await navigator.serviceWorker.getRegistrations()
            
            if (registrations.length === 0) {
                console.log('[PushPrompt] No registrations found, attempting manual registration...')
                try {
                    await navigator.serviceWorker.register('/sw.js')
                    console.log('[PushPrompt] Manual registration successful')
                    // Wait a bit for it to be recognized
                    await new Promise(r => setTimeout(r, 1000))
                    registrations = await navigator.serviceWorker.getRegistrations()
                } catch (regError) {
                    console.error('[PushPrompt] Manual registration failed:', regError)
                }
            }

            console.log('[PushPrompt] Found service worker registrations:', registrations.length)

            // Step 4: Get service worker registration
            console.log('[PushPrompt] Waiting for service worker ready...')
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Service Worker timeout')), 10000)
                )
            ]) as ServiceWorkerRegistration

            console.log('[PushPrompt] Service worker ready, subscribing to push...')

            // Step 5: Subscribe to push notifications
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidKey) {
                const errorMsg = lang === 'ru' ? 'VAPID ключ не настроен' : 'VAPID кілт орнатылмаған'
                console.error('[PushPrompt]', errorMsg)
                setError(errorMsg)
                toast.error(errorMsg)
                setLoading(false)
                return
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey
            })

            console.log('[PushPrompt] Push subscription created:', {
                endpoint: subscription.endpoint.substring(0, 50) + '...',
                keys: Object.keys(subscription.getKey('auth') ?  { auth: true, p256dh: true } : {}),
            })

            // Step 6: Get FCM Token
            console.log('[PushPrompt] Getting FCM token...')
            const fcmToken = await getFcmToken()
            
            if (fcmToken) {
              console.log('[PushPrompt] FCM Token generated:', fcmToken.substring(0, 20) + '...')
            } else {
              console.warn('[PushPrompt] FCM Token generation failed or returned null')
            }

            // Step 7: Save subscription and FCM token to database
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                const errorMsg = lang === 'ru' ? 'Пользователь не авторизован' : 'Пайдаланушы авторизацияланбаған'
                console.error('[PushPrompt]', errorMsg)
                setError(errorMsg)
                toast.error(errorMsg)
                setLoading(false)
                return
            }

            console.log('[PushPrompt] Saving subscription and FCM token to database for user:', user.id)

            const { error: updateError } = await supabase
                .from('staff_profiles')
                .update({ 
                    push_subscription: subscription,
                    fcm_token: fcmToken,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (updateError) {
                console.error('[PushPrompt] Database update error:', updateError)
                throw updateError
            }

            const duration = Date.now() - startTime
            console.log(`[PushPrompt] Push notifications enabled successfully in ${duration}ms`)
            toast.success(lang === 'ru' ? 'Уведомления включены' : 'Хабарламалар қосылды')
            
            // Resume audio context for future notifications
            resumeAudioContext()
            
            setOpen(false)
        } catch (error) {
            const duration = Date.now() - startTime
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.error(`[PushPrompt] Error during setup (${duration}ms):`, errorMsg)
            setError(errorMsg)
            toast.error(lang === 'ru' ? 'Ошибка при подписке' : 'Жазылу кезінде қате шықты')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            // Prevent closing if permission is default (haven't asked yet)
            if (Notification.permission === 'default') return
            setOpen(val)
        }}>
            <DialogContent
                className="max-w-sm rounded-[2.5rem] p-8 border-none shadow-2xl overflow-hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary animate-bounce">
                        <Bell className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                        <DialogTitle className="text-2xl font-black tracking-tight">
                            {lang === 'ru' ? 'Включите уведомления' : 'Хабарламаларды қосыңыз'}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
                            {lang === 'ru'
                                ? 'Это необходимо администратору, чтобы первыми узнавать о новых заказах и бронированиях в реальном времени. Вы также сможете услышать звуковой сигнал при новом заказе.'
                                : 'Бұл әкімшіге жаңа тапсырыстар мен брондаулар туралы нақты уақыт режимінде бірінші болып білу үшін қажет. Сіз жаңа тапсырыс болғанда дыбыс сигналын да естей аласыз.'}
                        </DialogDescription>
                    </div>

                    {error && (
                        <div className="w-full p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="w-full pt-2">
                        <Button
                            onClick={handleAllow}
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck className="w-5 h-5" />
                                    {lang === 'ru' ? 'Разрешить' : 'Рұқсат ету'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
