'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, HelpCircle, MessageCircle, Phone, Mail, Globe, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function HelpPage() {
    const router = useRouter()
    const { t, locale } = useI18n()

    const faqs = [
        {
            q: locale === 'kk' ? 'Тапсырыс қалай беріледі?' : 'Как сделать заказ?',
            a: locale === 'kk' ? 'Кафе таңдап, тағамдарды себетке қосып, "Тапсырыс беру" түймесін басыңыз.' : 'Выберите кафе, добавьте блюда в корзину и нажмите "Подтвердить заказ".'
        },
        {
            q: locale === 'kk' ? 'Төлем қалай жасалады?' : 'Как оплатить?',
            a: locale === 'kk' ? 'Сіз Kaspi арқылы немесе курьерге қолма-қол ақшамен төлей аласыз.' : 'Вы можете оплатить через Kaspi или наличными курьеру.'
        },
        {
            q: locale === 'kk' ? 'Жеткізу қанша уақыт алады?' : 'Сколько времени занимает доставка?',
            a: locale === 'kk' ? 'Орташа уақыт — 30-50 минут, кафе мен қашықтыққа байланысты.' : 'Среднее время — 30-50 минут, зависит от кафе и расстояния.'
        }
    ]

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24">
            <div className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-black tracking-tight">{t.profile?.helpSupport || 'Көмек орталығы'}</h1>
            </div>

            <div className="p-6 space-y-8">
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <h2 className="text-2xl font-black mb-2 italic">Сұрақтарыңыз бар ма?</h2>
                    <p className="text-indigo-100 text-sm font-medium">Біздің қолдау қызметі 24/7 жұмыс істейді</p>
                    <HelpCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 -rotate-12" />
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Жиі қойылатын сұрақтар</h3>
                    <Accordion type="single" collapsible className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <AccordionItem key={idx} value={`item-${idx}`} className="border-none bg-white dark:bg-slate-900 rounded-3xl px-6 shadow-sm">
                                <AccordionTrigger className="hover:no-underline font-bold text-sm text-left">{faq.q}</AccordionTrigger>
                                <AccordionContent className="text-slate-500 text-xs leading-relaxed pb-6">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                <div className="space-y-4 pt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Жедел байланыс</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-28 flex-col rounded-[2rem] gap-2 border-slate-200" onClick={() => window.open('https://t.me/mazirapp_support', '_blank')}>
                            <div className="p-3 bg-sky-50 rounded-2xl text-sky-600">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-xs text-slate-600">Telegram</span>
                        </Button>
                        <Button variant="outline" className="h-28 flex-col rounded-[2rem] gap-2 border-slate-200" onClick={() => window.location.href = 'tel:+77001234567'}>
                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                <Phone className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-xs text-slate-600">Қоңырау шалу</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
