'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronLeft, HelpCircle, MessageCircle, Phone, Mail, Globe, Sparkles, Send } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function HelpPage() {
    const router = useRouter()
    const { t, locale } = useI18n()
    const { user } = useAuth()
    const supabase = createClient()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [name, setName] = useState('')
    const [contact, setContact] = useState('')
    const [message, setMessage] = useState('')

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
        },
        {
            q: locale === 'kk' ? 'Тапсырысты қалай тоқтатуға болады?' : 'Как отменить заказ?',
            a: locale === 'kk' ? 'Егер кафе тапсырысты қабылдап үлгермесе, оны себеттен немесе тапсырыстар бөлімінен тоқтатуға болады. Кері жағдайда қолдау қызметіне хабарласыңыз.' : 'Если кафе еще не приняло заказ, его можно отменить в разделе заказов. В противном случае свяжитесь с поддержкой.'
        },
        {
            q: locale === 'kk' ? 'Курьер болу үшін не істеу керек?' : 'Как стать курьером?',
            a: locale === 'kk' ? 'Қосымшаның басты бетінде немесе профильде "Курьер болу" батырмасын басып, сауалнаманы толтырыңыз.' : 'Нажмите кнопку "Стать курьером" на главной или в профиле и заполните анкету.'
        }
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const { error } = await supabase.from('support_messages').insert([
                {
                    user_id: user?.id,
                    name,
                    contact,
                    message,
                    status: 'pending'
                }
            ])

            if (error) throw error

            toast.success(locale === 'kk' ? 'Хабарламаңыз жіберілді!' : 'Ваше сообщение отправлено!', {
                description: locale === 'kk' ? 'Біз тез арада жауап береміз.' : 'Мы ответим вам в ближайшее время.',
                icon: <Sparkles className="w-4 h-4 text-primary" />
            })

            setName('')
            setContact('')
            setMessage('')
        } catch (error: any) {
            console.error('Error sending message:', error)
            toast.error(locale === 'kk' ? 'Қате орын алды' : 'Произошла ошибка', {
                description: error.message
            })
        } finally {
            setIsSubmitting(false)
        }
    }

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
                    <h2 className="text-2xl font-black mb-2 italic">{locale === 'kk' ? 'Сұрақтарыңыз бар ма?' : 'Есть вопросы?'}</h2>
                    <p className="text-indigo-100 text-sm font-medium">{locale === 'kk' ? 'Біздің қолдау қызметі 24/7 жұмыс істейді' : 'Наша служба поддержки работает 24/7'}</p>
                    <HelpCircle className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 -rotate-12" />
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">{locale === 'kk' ? 'Жиі қойылатын сұрақтар' : 'Часто задаваемые вопросы'}</h3>
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
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">{locale === 'kk' ? 'Бізге жазыңыз' : 'Напишите нам'}</h3>
                    <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-6 bg-white dark:bg-slate-900">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="support-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{locale === 'kk' ? 'Атыңыз' : 'Ваше имя'}</Label>
                                    <Input 
                                        id="support-name"
                                        placeholder={locale === 'kk' ? 'Мысалы: Дархан' : 'Например: Дархан'}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="support-contact" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{locale === 'kk' ? 'Байланыс дерегі' : 'Контактные данные'}</Label>
                                    <Input 
                                        id="support-contact"
                                        placeholder={locale === 'kk' ? 'Телефон немесе Email' : 'Телефона или Email'}
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        required
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="support-message" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{locale === 'kk' ? 'Хабарлама' : 'Сообщение'}</Label>
                                    <Textarea 
                                        id="support-message"
                                        placeholder={locale === 'kk' ? 'Сұрағыңызды жазыңыз...' : 'Напишите ваш вопрос...'}
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                        className="rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 py-3 resize-none"
                                    />
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>{locale === 'kk' ? 'Жіберілуде...' : 'Отправка...'}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Send className="w-4 h-4" />
                                            <span>{locale === 'kk' ? 'Жіберу' : 'Отправить'}</span>
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4 pt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">{locale === 'kk' ? 'Жедел байланыс' : 'Быстрая связь'}</h3>
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
                            <span className="font-bold text-xs text-slate-600">{locale === 'kk' ? 'Қоңырау шалу' : 'Позвонить'}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
