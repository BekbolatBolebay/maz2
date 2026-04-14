'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share, PlusSquare, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/app-context'

export function InstallPrompt() {
    const { lang, isInstallable, isStandalone, installApp } = useApp()
    const [show, setShow] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)
    const [platform, setPlatform] = useState<'ios' | 'android' | 'other' | null>(null)

    useEffect(() => {
        // Check session dismissal
        const dismissed = sessionStorage.getItem('pwa_prompt_dismissed')
        if (dismissed) setIsDismissed(true)

        // Detect platform
        const ua = window.navigator.userAgent.toLowerCase()
        const isIos = /iphone|ipad|ipod/.test(ua)
        const isAndroid = /android/.test(ua)

        setPlatform(isIos ? 'ios' : isAndroid ? 'android' : 'other')

        // Show prompt if not standalone and not dismissed
        // We don't wait for isInstallable (which depends on beforeinstallprompt)
        // so that the button is "Directly" available as a guide even if the native prompt isn't ready.
        if (!isStandalone && !dismissed) {
            // Short delay for better UX
            const timer = setTimeout(() => setShow(true), 2000)
            return () => clearTimeout(timer)
        }
    }, [isStandalone])

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation()
        setShow(false)
        setIsDismissed(true)
        sessionStorage.setItem('pwa_prompt_dismissed', 'true')
    }

    const handleInstallClick = async () => {
        if (isInstallable) {
            await installApp()
            setShow(false)
        } else {
            // If not directly installable (e.g. Chrome on iOS or native prompt not ready), 
            // the UI already shows the manual instructions.
            console.log('[PWA] Native install not available, showing guide instead.')
        }
    }

    if (!show || isDismissed || isStandalone) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:w-96"
            >
                <Card className="bg-slate-900/90 backdrop-blur-3xl border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] rounded-[2.5rem] overflow-hidden border-2 text-white">
                    <CardContent className="p-8 relative">
                        {/* Close Button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer z-20"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-white/70" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center shadow-inner group border border-red-500/20">
                                <Download className="w-10 h-10 text-red-500 group-hover:scale-110 transition-transform" />
                            </div>
                            
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black tracking-tight">
                                    {lang === 'kk' ? 'Məzir қосымшасы' : 'Приложение Məzir'}
                                </h3>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed px-4 opacity-80">
                                    {platform === 'ios'
                                        ? (lang === 'kk'
                                            ? 'Safari-де "Бөлісу" батырмасын басып, "Бас экранға қосу" таңдаңыз.'
                                            : 'Нажмите "Поделиться" в Safari и выберите "На экран Домой".')
                                        : (lang === 'kk'
                                            ? 'Тапсырыс беруді тездету үшін қосымшаны негізгі экранға қосыңыз.'
                                            : 'Добавьте приложение на главный экран для быстрого заказа еды.')}
                                </p>
                            </div>

                            <div className="w-full pt-4">
                                {(platform === 'ios' || !isInstallable) ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-center gap-4 py-4 px-6 bg-white/5 rounded-2xl border border-white/10">
                                            {platform === 'ios' ? (
                                                <>
                                                    <Share className="w-6 h-6 text-red-500" />
                                                    <span className="text-sm font-black">→</span>
                                                    <PlusSquare className="w-6 h-6 text-red-500" />
                                                </>
                                            ) : (
                                                <>
                                                    <MoreVertical className="w-6 h-6 text-red-500" />
                                                    <span className="text-sm font-black">→</span>
                                                    <Download className="w-6 h-6 text-red-500" />
                                                </>
                                            )}
                                            <span className="text-xs font-black uppercase tracking-[0.2em]">
                                                {lang === 'kk' 
                                                    ? (platform === 'ios' ? 'Экранға қосу' : 'Қосымшаны орнату') 
                                                    : (platform === 'ios' ? 'На экран Домой' : 'Установить приложение')}
                                            </span>
                                        </div>
                                        
                                        {/* Specific instruction text for Android workaround */}
                                        {platform !== 'ios' && !isInstallable && (
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center mt-2">
                                                {lang === 'kk' 
                                                    ? 'Мәзірді (3 нүкте) басып, "Қолданбаны орнату" таңдаңыз' 
                                                    : 'Нажмите на меню (3 точки) и выберите "Установить приложение"'}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleInstallClick}
                                        className="w-full h-16 rounded-2xl font-black text-lg uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white shadow-2xl shadow-red-600/30 active:scale-[0.98] transition-all border-none"
                                    >
                                        {lang === 'kk' ? 'Жүктеп алу' : 'Скачать'}
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
