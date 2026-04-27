'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Share2, Copy, CheckCircle2, Loader2, User, Phone, ArrowRight, ChevronLeft } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/i18n-context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

const AMOUNTS = [5000, 10000, 20000, 50000]
const MIN_AMOUNT = 500

export default function CertificatesPage() {
    const { lang, locale } = useI18n()
    const router = useRouter()
    const searchParams = useSearchParams()
    const restaurantId = searchParams.get('restaurant')
    const [restaurant, setRestaurant] = useState<any>(null)
    const [step, setStep] = useState<1 | 2 | 3>(1) // 1=amount, 2=contact, 3=done
    const [customAmount, setCustomAmount] = useState('10000')
    const [buyerName, setBuyerName] = useState('')
    const [buyerPhone, setBuyerPhone] = useState('+7 ')
    const [buyerEmail, setBuyerEmail] = useState('')
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

    const finalAmount = parseInt(customAmount.replace(/\D/g, ''), 10) || 0

    const handleNextStep = () => {
        if (finalAmount < MIN_AMOUNT) {
            toast.error(lang === 'kk' ? `Ең кем сомма ${MIN_AMOUNT.toLocaleString()} ₸` : `Минимальная сумма ${MIN_AMOUNT.toLocaleString()} ₸`)
            return
        }
        setStep(2)
    }

    const handleSubmit = async () => {
        if (!buyerName.trim()) {
            toast.error(lang === 'kk' ? 'Атыңызды жазыңыз' : 'Введите ваше имя')
            return
        }
        if (buyerPhone.length < 12) {
            toast.error(lang === 'kk' ? 'Телефон нөмірін жазыңыз' : 'Введите номер телефона')
            return
        }
        if (!buyerEmail.trim() || !buyerEmail.includes('@')) {
            toast.error(lang === 'kk' ? 'Дұрыс email жазыңыз' : 'Введите корректный email')
            return
        }

        setLoading(true)
        const supabase = createClient()
        let { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            const { data, error: anonError } = await supabase.auth.signInAnonymously()
            if (anonError) {
                console.error('[Certificates] Anon sign-in error:', anonError)
                toast.error(lang === 'kk' ? 'Жүйеге кіру мүмкін болмады' : 'Не удалось войти в систему')
                setLoading(false)
                return
            }
            user = data.user
        }

        // Generate a temporary request ID (not the final code)
        const requestId = 'REQ-' + Math.random().toString(36).substring(2, 8).toUpperCase()

        // 1. Create Certificate (pending status — not yet paid)
        const { error: certError } = await supabase
            .from('gift_certificates')
            .insert({
                code: requestId,
                cafe_id: restaurantId || null,
                initial_amount: finalAmount,
                current_balance: finalAmount,
                buyer_id: user?.id || null,
                expiry_date: null,
                status: 'pending_payment'
            })

        if (certError) {
            console.error('[Certificates] Cert error details:', {
                message: certError.message,
                code: certError.code,
                details: certError.details,
                hint: certError.hint
            })
            toast.error(lang === 'kk' ? `Қате: ${certError.message}` : `Ошибка: ${certError.message}`)
            setLoading(false)
            return
        }

        // 2. Create Order if restaurantId is available
        if (restaurantId && user?.id) {
            const { error: orderError } = await supabase.from('orders').insert({
                user_id: user.id,
                cafe_id: restaurantId,
                status: 'pending',
                total_amount: finalAmount,
                delivery_fee: 0,
                delivery_address: `Сертификат: ${buyerName}`,
                address: `Сертификат: ${buyerName}`,
                customer_name: buyerName,
                customer_phone: buyerPhone,
                notes: buyerEmail,
                payment_method: 'pending',
                payment_status: 'pending',
                phone: buyerPhone,
                type: 'certificate',
                items_count: 1,
                certificate_code: requestId
            })

            if (orderError) {
                console.error('[Certificates] Order error details:', {
                    message: orderError.message,
                    code: orderError.code,
                    details: orderError.details,
                    hint: orderError.hint
                })
            }
        }

        // 3. Notify Telegram — "Күтілуде / Ожидается"
        try {
            await fetch('/api/notify-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        id: requestId,
                        total_amount: finalAmount,
                        customer_name: buyerName,
                        customer_phone: buyerPhone,
                        address: `🎁 Сыйлық сертификаты | Сұраныс: ${requestId}`
                    },
                    type: 'certificate',
                    restaurantId
                })
            })
        } catch (e) {
            console.warn('[Certificates] Telegram notify failed:', e)
        }

        setPurchasedCode(requestId)
        setStep(3)
        setLoading(false)
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
                onBack={() => step === 2 ? setStep(1) : router.push('/')}
            />

            <main className="max-w-screen-md mx-auto p-4 space-y-8 mt-4">
                <AnimatePresence mode="wait">

                    {/* ── Step 1: Amount ── */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8"
                        >
                            {/* Hero */}
                            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/80 p-8 text-white shadow-2xl shadow-primary/20">
                                <div className="relative z-10 space-y-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Gift className="w-6 h-6" />
                                    </div>
                                    <h1 className="text-3xl font-black leading-tight">
                                        {restaurant
                                            ? (locale === 'ru' ? `Подарок в ${restaurant.name_ru}` : `Сыйлық: ${restaurant.name_kk || restaurant.name_ru}`)
                                            : (lang === 'kk' ? 'Ең жақсы сыйлық — дәмді тағам!' : 'Лучший подарок — вкусная еда!')}
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

                                {/* Quick pick */}
                                <div className="grid grid-cols-4 gap-2">
                                    {AMOUNTS.map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => setCustomAmount(String(amount))}
                                            className={cn(
                                                "h-14 rounded-2xl border-2 transition-all flex items-center justify-center text-sm font-black",
                                                finalAmount === amount
                                                    ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5"
                                                    : "border-zinc-100 bg-white text-zinc-400 hover:border-primary/30"
                                            )}
                                        >
                                            {(amount / 1000)}K₸
                                        </button>
                                    ))}
                                </div>

                                {/* Custom amount */}
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground pointer-events-none">₸</div>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min={MIN_AMOUNT}
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        placeholder="10 000"
                                        className={cn(
                                            "w-full h-20 rounded-3xl border-2 bg-white pl-12 pr-6 text-3xl font-black text-foreground outline-none transition-all",
                                            finalAmount >= MIN_AMOUNT
                                                ? "border-primary/40 focus:border-primary"
                                                : "border-zinc-100 focus:border-primary/40"
                                        )}
                                    />
                                    {finalAmount > 0 && finalAmount < MIN_AMOUNT && (
                                        <p className="text-[11px] font-bold text-destructive mt-1.5 ml-2">
                                            {lang === 'kk' ? `Ең кем ${MIN_AMOUNT.toLocaleString()} ₸` : `Минимум ${MIN_AMOUNT.toLocaleString()} ₸`}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Next */}
                            <Button
                                className="w-full h-16 rounded-[2rem] text-lg font-black shadow-xl shadow-primary/20 gap-3"
                                onClick={handleNextStep}
                                disabled={finalAmount < MIN_AMOUNT}
                            >
                                {lang === 'kk' ? 'Әрі қарай' : 'Продолжить'}
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                            <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                {lang === 'kk' ? 'Сертификаттың мерзімі шектеусіз' : 'Срок действия сертификата не ограничен'}
                            </p>
                        </motion.div>
                    )}

                    {/* ── Step 2: Contact Info ── */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            className="space-y-6"
                        >
                            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
                                <CardContent className="p-8 space-y-6">
                                    <div className="text-center space-y-2">
                                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                                            <Gift className="w-8 h-8 text-primary" />
                                        </div>
                                        <h2 className="text-2xl font-black">
                                            {lang === 'kk' ? 'Байланыс ақпаратыңыз' : 'Ваши контакты'}
                                        </h2>
                                        <p className="text-muted-foreground text-sm">
                                            {lang === 'kk'
                                                ? `Сертификат соммасы: ${finalAmount.toLocaleString()} ₸`
                                                : `Сумма сертификата: ${finalAmount.toLocaleString()} ₸`}
                                        </p>
                                    </div>

                                    {/* Name */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                                            {lang === 'kk' ? 'Аты-жөніңіз' : 'Ваше имя'}
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={buyerName}
                                                onChange={(e) => setBuyerName(e.target.value)}
                                                placeholder={lang === 'kk' ? 'Нұрболат Сейтқали' : 'Иван Иванов'}
                                                className="w-full h-14 rounded-2xl border-2 border-zinc-100 bg-zinc-50 pl-12 pr-4 font-bold text-base focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                                            {lang === 'kk' ? 'Телефон нөмірі' : 'Номер телефона'}
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <input
                                                type="tel"
                                                inputMode="tel"
                                                value={buyerPhone}
                                                onChange={(e) => setBuyerPhone(e.target.value)}
                                                placeholder="+7 777 123 4567"
                                                className="w-full h-14 rounded-2xl border-2 border-zinc-100 bg-zinc-50 pl-12 pr-4 font-bold text-base focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                                            Email (код осы почтаға жіберіледі)
                                        </label>
                                        <div className="relative">
                                            <ArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <input
                                                type="email"
                                                value={buyerEmail}
                                                onChange={(e) => setBuyerEmail(e.target.value)}
                                                placeholder="example@mail.com"
                                                className="w-full h-14 rounded-2xl border-2 border-zinc-100 bg-zinc-50 pl-12 pr-4 font-bold text-base focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            className="w-14 h-14 rounded-2xl shrink-0"
                                            onClick={() => setStep(1)}
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            className="flex-1 h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 gap-2"
                                            onClick={handleSubmit}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                            {lang === 'kk' ? 'Тапсырыс беру' : 'Оформить заказ'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* ── Step 3: Success ── */}
                    {step === 3 && purchasedCode && (
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
                                        <h2 className="text-2xl font-black">{lang === 'kk' ? 'Тапсырыс қабылданды!' : 'Заявка принята!'}</h2>
                                        <p className="text-muted-foreground text-sm font-medium">
                                            {lang === 'kk'
                                                ? 'Менеджер сізге жақын арада хабарласады. Төлем жасалғаннан кейін сертификат коды почтаңызға жіберіледі.'
                                                : 'Менеджер свяжется с вами в ближайшее время. После оплаты код сертификата будет отправлен на вашу почту.'}
                                        </p>
                                    </div>

                                     <div className="grid grid-cols-1 gap-3 pt-4">
                                         <Button
                                             className="h-16 rounded-[1.5rem] font-black text-lg bg-primary shadow-xl shadow-primary/20"
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
