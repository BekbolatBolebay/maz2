'use client'

import Link from 'next/link'
import { Gift, ChevronRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { motion } from 'framer-motion'

export function GiftBanner() {
    const { lang } = useI18n()

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-1"
        >
            <Link href="/certificates">
                <div className="relative overflow-hidden rounded-3xl bg-zinc-900 p-6 text-white shadow-xl group active:scale-[0.98] transition-all">
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary backdrop-blur-md border border-primary/20 group-hover:scale-110 transition-transform">
                                <Gift className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg tracking-tight leading-tight">
                                    {lang === 'kk' ? 'Сыйлық сертификаттары' : 'Подарочные сертификаты'}
                                </h3>
                                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                                    {lang === 'kk' ? 'Дәмді сыйлық жасаңыз' : 'Подарите вкусный момент'}
                                </p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/20 transition-all" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-2xl" />
                </div>
            </Link>
        </motion.div>
    )
}
