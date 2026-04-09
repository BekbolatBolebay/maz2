'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bell, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'

export function PushPrompt() {
    const { user, subscribeToPush } = useAuth()
    const { locale } = useI18n()
    const [open, setOpen] = useState(false)

    useEffect(() => {
        // Check if browser supports notifications
        if (!('Notification' in window)) return

        // Only show if permission is 'default' (not yet asked)
        if (Notification.permission === 'default') {
            const timer = setTimeout(() => setOpen(true), 500) // Show almost immediately
            return () => clearTimeout(timer)
        }
    }, [])

    const [loading, setLoading] = useState(false)

    const handleAllow = async () => {
        setLoading(true)
        try {
            await subscribeToPush()
            setOpen(false)
        } catch (err) {
            // Error is handled by toasts in subscribeToPush
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent
                className="max-w-sm rounded-[2.5rem] p-8 border-none shadow-2xl overflow-hidden [&>button]:hidden"
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
                            {locale === 'ru' ? 'Включите уведомления' : 'Хабарламаларды қосыңыз'}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
                            {locale === 'ru'
                                ? 'Это ОБЯЗАТЕЛЬНО, чтобы вы могли отслеживать статус заказа в реальном времени'
                                : 'Тапсырыс мәртебесін нақты уақытта бақылау үшін бұл МІНДЕТТІ'}
                        </DialogDescription>
                    </div>

                    <div className="w-full space-y-3 pt-2">
                        <Button
                            onClick={handleAllow}
                            disabled={loading}
                            className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{locale === 'ru' ? 'Загрузка...' : 'Жүктелуде...'}</span>
                                </div>
                            ) : (
                                <>
                                    <ShieldCheck className="w-5 h-5" />
                                    {locale === 'ru' ? 'Разрешить' : 'Рұқсат ету'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
