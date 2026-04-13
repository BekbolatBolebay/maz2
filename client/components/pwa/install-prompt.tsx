'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share, PlusSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/app-context'
import { useI18n } from '@/lib/i18n/i18n-context'

export function InstallPrompt() {
    const { isInstallable, installApp } = useApp()
    const { locale } = useI18n()
    const [show, setShow] = useState(false)
    const [platform, setPlatform] = useState<'ios' | 'android' | 'other' | null>(null)

    useEffect(() => {
        // Detect platform
        const ua = window.navigator.userAgent.toLowerCase()
        const isIos = /iphone|ipad|ipod/.test(ua)
        const isAndroid = /android/.test(ua)

        setPlatform(isIos ? 'ios' : isAndroid ? 'android' : 'other')

        // Show prompt if installable
        if (isInstallable) {
            setShow(true)
        }

        // Handle iOS check
        if (isIos && !window.matchMedia('(display-mode: standalone)').matches) {
            // Show iOS prompt after a short delay
            const timer = setTimeout(() => setShow(true), 5000)
            return () => clearTimeout(timer)
        }
    }, [isInstallable])

    const handleInstallClick = async () => {
        await installApp()
        setShow(false)
    }

    if (!show) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:w-80"
            >
                <Card className="bg-card/80 backdrop-blur-xl border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[2rem] overflow-hidden border-2 animate-in slide-in-from-bottom-10 duration-700">
                    <CardContent className="p-6 relative">
                        {/* Improved Close Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShow(false);
                            }}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-all active:scale-95 cursor-pointer z-20"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-4 pt-2">
                            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center shadow-inner group">
                                <Download className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-lg font-black tracking-tight">
                                    {locale === 'kk' ? 'Məzir қосымшасы' : 'Приложение Məzir'}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed px-2">
                                    {platform === 'ios'
                                        ? (locale === 'kk'
                                            ? 'Safari-де "Бөлісу" батырмасын басып, "Home Screen-ге қосу" таңдаңыз.'
                                            : 'Нажмите "Поделиться" в Safari и выберите "На экран Домой".')
                                        : (locale === 'kk'
                                            ? 'Тапсырыс беруді тездету үшін қосымшаны негізгі экранға қосыңыз.'
                                            : 'Добавьте приложение на главный экран для быстрого заказа еды.')}
                                </p>
                            </div>

                            <div className="w-full pt-2">
                                {platform === 'ios' ? (
                                    <div className="flex items-center justify-center gap-3 py-3 px-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <Share className="w-5 h-5 text-primary" />
                                        <span className="text-xs font-bold">→</span>
                                        <PlusSquare className="w-5 h-5 text-primary" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">
                                            {locale === 'kk' ? 'Экранға қосу' : 'На экран Домой'}
                                        </span>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleInstallClick}
                                        className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
                                    >
                                        {locale === 'kk' ? 'Орнату' : 'Установить'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}
