'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share, PlusSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/app-context'

export function InstallPrompt() {
    const { lang, isInstallable, installApp } = useApp()
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
            const timer = setTimeout(() => setShow(true), 3000)
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
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:w-96"
            >
                <Card className="bg-slate-900/90 backdrop-blur-3xl border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] rounded-[2.5rem] overflow-hidden border-2 text-white">
                    <CardContent className="p-8 relative">
                        {/* Close Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShow(false);
                            }}
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
                                {platform === 'ios' ? (
                                    <div className="flex items-center justify-center gap-4 py-4 px-6 bg-white/5 rounded-2xl border border-white/10">
                                        <Share className="w-6 h-6 text-red-500" />
                                        <span className="text-sm font-black">→</span>
                                        <PlusSquare className="w-6 h-6 text-red-500" />
                                        <span className="text-xs font-black uppercase tracking-[0.2em]">
                                            {lang === 'kk' ? 'Экранға қосу' : 'На экран Домой'}
                                        </span>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleInstallClick}
                                        className="w-full h-16 rounded-2xl font-black text-lg uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white shadow-2xl shadow-red-600/30 active:scale-[0.98] transition-all border-none"
                                    >
                                        {lang === 'kk' ? 'Орнату' : 'Установить'}
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

