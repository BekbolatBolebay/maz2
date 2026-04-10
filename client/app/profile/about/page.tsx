'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, Info, Heart, ShieldCheck, Globe, Star } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
    const router = useRouter()
    const { t, locale } = useI18n()

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24">
            <div className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-black tracking-tight">{t.profile?.about || 'Қолданба туралы'}</h1>
            </div>

            <div className="p-6 space-y-12">
                <div className="flex flex-col items-center text-center space-y-4 pt-8">
                    <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-primary/40 rotate-12">
                        M
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">Mazir App</h2>
                        <p className="text-slate-400 font-bold text-sm">Version 1.0.1 (Reinforced)</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary shrink-0">
                                <Heart className="w-6 h-6 fill-primary/10" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm">Сүйіспеншілікпен жасалған</h3>
                                <p className="text-xs text-slate-500 leading-relaxed mt-1">Біз тағамға деген махаббат пен заманауи технологияны ұштастырамыз.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600 shrink-0">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm">Қауіпсіздік</h3>
                                <p className="text-xs text-slate-500 leading-relaxed mt-1">Сіздің деректеріңіз бен төлемдеріңіз сенімді қорғалған.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-orange-600 shrink-0">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm">Қазақстандық өнім</h3>
                                <p className="text-xs text-slate-500 leading-relaxed mt-1">Отандық кәсіпкерлер мен мейрамханаларды қолдаймыз.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center space-y-6 pt-8">
                    <p className="text-xs text-slate-400 px-12 line-clamp-3 leading-loose">
                        Жүйеге кіру арқылы сіз біздің пайдалану шарттарымен және құпиялылық саясатымен толық келісесіз.
                    </p>
                    <div className="flex flex-col gap-3 px-6">
                        <Button variant="link" className="text-primary font-black text-xs uppercase tracking-widest">Пайдалану шарттары</Button>
                        <Button variant="link" className="text-slate-400 font-bold text-xs">Құпиялылық саясаты</Button>
                    </div>
                </div>

                <div className="flex justify-center pt-8">
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 rounded-full">
                        <Star className="w-3 h-3 text-slate-400 fill-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Made in Kazakhstan</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
