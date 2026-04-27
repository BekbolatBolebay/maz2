'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, CreditCard, ChevronRight, Share2, Copy, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/i18n-context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const AMOUNTS = [5000, 10000, 20000, 50000]

export default function CertificatesPage() {
    const { lang, locale } = useI18n()
    const router = useRouter()
    const searchParams = useSearchParams()
    const restaurantId = searchParams.get('restaurant')
    const [restaurant, setRestaurant] = useState<any>(null)
    const [selectedAmount, setSelectedAmount] = useState(10000)
    const [loading, setLoading] = useState(false)
    const [purchasedCode, setPurchasedCode] = useState<string | null>(null)

    useEffect(() => {
        if (restaurantId) {
            const supabase = createClient()
            supabase.from('restaurants').select('*').eq('id', restaurantId).single().then(({ data }) => {
                if (data) setRestaurant(data)
            })
        }
    }, [restaurantId])

    const handlePurchase = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Generate a random unique code
        const code = 'GIFT-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.random().toString(36).substring(2, 4).toUpperCase()

        const { data, error } = await supabase
            .from('gift_certificates')
            .insert({
                code,
                cafe_id: restaurantId || null,
                initial_amount: selectedAmount,
                current_balance: selectedAmount,
                buyer_id: user?.id || null,
                expiry_date: null, // Unlimited duration
                status: 'active'
            })
            .select()
            .single()

        if (error) {
            toast.error(lang === 'kk' ? 'Төлем кезінде қате кетті' : 'Ошибка при оплате')
            setLoading(false)
            return
        }

        setPurchasedCode(code)
        setLoading(false)
        toast.success(lang === 'kk' ? 'Сертификат сәтті сатып алынды!' : 'Сертификат успешно куплен!')
    }

    const shareViaWhatsApp = () => {
        const baseUrl = window.location.origin
        const shareLink = restaurantId 
            ? `${baseUrl}/restaurant/${restaurantId}?gift=${purchasedCode}`
            : `${baseUrl}/?gift=${purchasedCode}`

        const text = lang === 'kk' 
            ? `Сәлем! Саған MazirApp-тан сыйлық сертификатын жібердім! Коды: ${purchasedCode}. Оны мына сілтеме арқылы бірден пайдалана аласың: ${shareLink}`
            : `Привет! Я отправил тебе подарочный сертификат MazirApp! Код: ${purchasedCode}. Ты можешь использовать его сразу по этой ссылке: ${shareLink}`
        
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    return (
        <div className="min-h-screen bg-zinc-50 pb-20">
            <Header 
                title={lang === 'kk' ? 'Сыйлық сертификаттары' : 'Подарочные сертификаты'} 
                backButton={true}
                onBack={() => router.push('/')}
            />

            <main className="max-w-screen-md mx-auto p-4 space-y-8 mt-4">
                <AnimatePresence mode="wait">
                    {!purchasedCode ? (
                        <motion.div 
                            key="selection"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8"
                        >
                            {/* Hero Card */}
                            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/80 p-8 text-white shadow-2xl shadow-primary/20">
                                <div className="relative z-10 space-y-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Gift className="w-6 h-6" />
                                    </div>
                                    <h1 className="text-3xl font-black leading-tight">
                                        {restaurant 
                                            ? (locale === 'ru' ? `Подарок в ${restaurant.name_ru}` : `Сыйлық: ${restaurant.name_kk || restaurant.name_ru}`)
                                            : (lang === 'kk' ? 'Ең жақсы сыйлық - дәмді тағам!' : 'Лучший подарок — вкусная еда!')}
                                    </h1>
                                    <p className="text-white/80 text-sm font-medium">
                                        {restaurant 
                                            ? (locale === 'ru' ? 'Сертификат только для этого заведения' : 'Сертификат тек осы мекеме үшін жарамды')
                                            : (lang === 'kk' ? 'Жақындарыңызға қуаныш сыйлаңыз' : 'Подарите радость своим близким')}
                                    </p>
                                </div>
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-12 -mt-12 blur-3xl" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-8 -mb-8 blur-2xl" />
                            </div>

                            {/* Amount Selector */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    {lang === 'kk' ? 'Сертификат соммасын таңдаңыз' : 'Выберите сумму сертификата'}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {AMOUNTS.map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => setSelectedAmount(amount)}
                                            className={cn(
                                                "h-20 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                                                selectedAmount === amount 
                                                    ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5" 
                                                    : "border-zinc-100 bg-white text-zinc-400"
                                            )}
                                        >
                                            <span className="text-xl font-black">{amount.toLocaleString()}₸</span>
                                            {selectedAmount === amount && <div className="w-1 h-1 bg-primary rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Purchase Button */}
                            <div className="pt-4">
                                <Button 
                                    className="w-full h-16 rounded-[2rem] text-lg font-black shadow-xl shadow-primary/20 gap-3"
                                    onClick={handlePurchase}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                    {lang === 'kk' ? 'Сатып алу' : 'Купить сейчас'}
                                </Button>
                                <p className="text-center text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-widest">
                                    {lang === 'kk' ? 'Сертификаттың мерзімі шектеусіз' : 'Срок действия сертификата не ограничен'}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
                                <CardContent className="p-8 text-center space-y-6">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black">{lang === 'kk' ? 'Құттықтаймыз!' : 'Поздравляем!'}</h2>
                                        <p className="text-muted-foreground text-sm font-medium">
                                            {lang === 'kk' ? 'Сертификат сатып алынды. Кодты сақтап қойыңыз немесе сыйлыққа жіберіңіз.' : 'Сертификат куплен. Сохраните код или отправьте его в подарок.'}
                                        </p>
                                    </div>

                                    <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl p-6 relative group">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                            {lang === 'kk' ? 'Сертификат коды' : 'Код сертификата'}
                                        </p>
                                        <p className="text-3xl font-black tracking-tighter text-primary font-mono">{purchasedCode}</p>
                                        <button 
                                            className="absolute top-4 right-4 p-2 rounded-xl bg-white shadow-sm hover:bg-zinc-50 transition-colors"
                                            onClick={() => {
                                                navigator.clipboard.writeText(purchasedCode)
                                                toast.success(lang === 'kk' ? 'Көшірілді!' : 'Скопировано!')
                                            }}
                                        >
                                            <Copy className="w-4 h-4 text-zinc-400" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 pt-4">
                                        <Button 
                                            className="h-14 rounded-2xl font-black gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                                            onClick={shareViaWhatsApp}
                                        >
                                            <Share2 className="w-5 h-5" />
                                            {lang === 'kk' ? 'WhatsApp-пен жіберу' : 'Отправить через WhatsApp'}
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            className="h-14 rounded-2xl font-black text-muted-foreground"
                                            onClick={() => router.push('/')}
                                        >
                                            {lang === 'kk' ? 'Бас бетке өту' : 'На главную'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
