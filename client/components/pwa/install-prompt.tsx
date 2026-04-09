'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share, PlusSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'

export function InstallPrompt() {
    const [show, setShow] = useState(false)
    const [platform, setPlatform] = useState<'ios' | 'android' | 'other' | null>(null)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
        // Detect platform
        const ua = window.navigator.userAgent.toLowerCase()
        const isIos = /iphone|ipad|ipod/.test(ua)
        const isAndroid = /android/.test(ua)

        setPlatform(isIos ? 'ios' : isAndroid ? 'android' : 'other')

        // Handle Android/Chrome install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Only show if not already installed
            if (!window.matchMedia('(display-mode: standalone)').matches) {
                setShow(true)
            }
        })

        // Handle iOS check
        if (isIos && !window.matchMedia('(display-mode: standalone)').matches) {
            // Show iOS prompt after a short delay
            const timer = setTimeout(() => setShow(true), 3000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                setShow(false)
            }
            setDeferredPrompt(null)
        }
    }

    if (!show) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-20 left-4 right-4 z-[100]"
            >
                <Card className="bg-white dark:bg-slate-900 border-primary/20 shadow-2xl rounded-2xl overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Download className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-bold">Қолданбаны орнату</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {platform === 'ios'
                                        ? 'Safari-де "Бөлісу" батырмасын басып, "Home Screen-ге қосу" таңдаңыз.'
                                        : 'Қолданбаны жылдам ашу үшін негізгі экранға қосыңыз.'}
                                </p>

                                {platform === 'ios' ? (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Share className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-medium">{"->"}</span>
                                        <PlusSquare className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-medium">Бас экранға қосу</span>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        className="w-full mt-2 h-8 text-[10px] uppercase font-black tracking-widest"
                                        onClick={handleInstallClick}
                                    >
                                        Орнату
                                    </Button>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShow(false);
                                }}
                                className="w-10 h-10 -mr-2 -mt-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer touch-manipulation z-[110]"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}
