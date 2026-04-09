'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CreditCard, ExternalLink, Lock } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import type { Restaurant } from '@/lib/db'

interface SubscriptionGuardProps {
    children: React.ReactNode
    restaurant: Restaurant | null
}

export function SubscriptionGuard({ children, restaurant }: SubscriptionGuardProps) {
    const { lang } = useApp()
    const [isBlocked, setIsBlocked] = useState(false)

    useEffect(() => {
        if (!restaurant) return

        const status = restaurant.platform_status
        const expiryDate = restaurant.expiry_date ? new Date(restaurant.expiry_date) : null
        const now = new Date()

        // Block if status is explicitly blocked/expired OR if expiry date is passed
        const isExpired = expiryDate && expiryDate < now
        const shouldBlock = status === 'blocked' || status === 'expired' || isExpired

        setIsBlocked(!!shouldBlock)
    }, [restaurant])

    if (!isBlocked) {
        return <>{children}</>
    }

    const title = lang === 'kk' ? 'Төлем қажет' : 'Требуется оплата'
    const description = lang === 'kk'
        ? 'Сіздің жазылымыңыз аяқталды немесе бұғатталды. Жұмысты жалғастыру үшін төлем жасаңыз.'
        : 'Ваша подписка истекла или была заблокирована. Пожалуйста, произведите оплату для продолжения работы.'

    const contactText = lang === 'kk' ? 'Қолдау көрсету орталығы' : 'Служба поддержки'
    const payText = lang === 'kk' ? 'Төлем жасау' : 'Оплатить'

    // Kaspi link fallback or specific payment info
    const paymentUrl = restaurant?.kaspi_link || '#'

    return (
        <>
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
            <Dialog open={true} onOpenChange={() => { }}>
                <DialogContent
                    className="sm:max-w-[425px] z-[60] [&>button]:hidden"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader className="flex flex-col items-center pt-4">
                        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                            <Lock className="w-10 h-10 text-destructive" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-center">{title}</DialogTitle>
                        <DialogDescription className="text-center text-base pt-2">
                            {description}
                            {restaurant?.expiry_date && (
                                <span className="block mt-2 font-bold text-destructive">
                                    {lang === 'kk' ? 'Мерзімі:' : 'Истекло:'} {new Date(restaurant.expiry_date).toLocaleDateString()}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-6">
                        <div className="bg-muted p-4 rounded-2xl border border-border">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                </div>
                                <p className="font-bold text-sm">
                                    {lang === 'kk' ? 'Тариф:' : 'Тариф:'} {restaurant?.plan || 'Standard'}
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {lang === 'kk'
                                    ? 'Төлем жасағаннан кейін менеджер сіздің келісіміңізді растайды.'
                                    : 'После совершения оплаты менеджер подтвердит ваше продление.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            size="lg"
                            className="w-full text-base font-bold h-14 rounded-2xl shadow-lg shadow-primary/20"
                            onClick={() => window.open(paymentUrl, '_blank')}
                        >
                            {payText}
                            <ExternalLink className="ml-2 w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => window.open('https://t.me/mazir_support', '_blank')}
                        >
                            {contactText}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <div className="pointer-events-none opacity-20 blur-sm">
                {children}
            </div>
        </>
    )
}
