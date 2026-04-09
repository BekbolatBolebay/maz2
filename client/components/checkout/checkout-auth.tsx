'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Mail, ShieldCheck, Star, User, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n/i18n-context'

export function CheckoutAuth({ onLogin }: { onLogin: () => void }) {
    const { signInWithCustomOtp, verifyCustomOtp, signInAnonymous } = useAuth()
    const { locale } = useI18n()
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<'choice' | 'email' | 'otp'>('choice')
    const [loading, setLoading] = useState(false)

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !fullName || !phone) {
            toast.error('Барлық өрістерді толтырыңыз')
            return
        }
        setLoading(true)
        try {
            await signInWithCustomOtp(email, fullName, phone)
            setStep('otp')
            toast.success('Код почтаңызға жіберілді')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otp) return
        setLoading(true)
        try {
            await verifyCustomOtp(email, otp)
            toast.success('Жүйеге кірдіңіз!')
            onLogin()
        } catch (error: any) {
            toast.error('Код қате немесе уақыты өткен')
        } finally {
            setLoading(false)
        }
    }

    const handleAnonymousLogin = async () => {
        setLoading(true)
        try {
            await signInAnonymous()
            toast.success('Қонақ ретінде кірдіңіз')
            onLogin()
        } catch (e) {
            toast.error('Қате орын алды')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-sm mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black">Тапсырысты жалғастыру</h2>
                <p className="text-sm text-muted-foreground italic">Төлем бетіне өту үшін режимді таңдаңыз</p>
            </div>

            <AnimatePresence mode="wait">
                {step === 'choice' && (
                    <motion.div
                        key="choice"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                    >
                        {/* Option 1: Cashback (Registration) */}
                        <div className="relative group">
                            <div className="absolute -top-3 left-6 z-10 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse">
                                {locale === 'ru' ? 'РЕКОМЕНДУЕМ' : 'ҰСЫНАМЫЗ'}
                            </div>
                            <button
                                onClick={() => setStep('email')}
                                className="w-full text-left transition-all"
                            >
                                <Card className="border-2 border-primary bg-primary/5 rounded-[2.5rem] overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 active:scale-[0.98]">
                                    <CardContent className="p-7 flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[2rem] bg-primary text-primary-foreground flex items-center justify-center text-3xl shadow-xl shadow-primary/30 shrink-0">
                                            <Star className="w-8 h-8 fill-current" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-xl leading-tight mb-1 text-primary">
                                                {locale === 'ru' ? 'Регистрация' : 'Тіркелу'}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                                                {locale === 'ru' ? '+ Бонусы и кэшбек' : '+ Бонустар мен кэшбек'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </button>
                        </div>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
                            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground"><span className="bg-background px-6">немесе</span></div>
                        </div>

                        {/* Option 2: Guest */}
                        <button
                            onClick={handleAnonymousLogin}
                            disabled={loading}
                            className="w-full text-left group transition-all"
                        >
                            <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/20 hover:bg-muted/40 hover:border-muted-foreground/40 rounded-[2.5rem] overflow-hidden transition-all active:scale-[0.98]">
                                <CardContent className="p-6 flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-background transition-colors">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <User className="w-7 h-7" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-lg text-foreground/80">
                                            {locale === 'ru' ? 'Как гость' : 'Қонақ ретінде'}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-medium italic">
                                            {locale === 'ru' ? 'Быстро, без бонусов' : 'Жылдам, бонустарсыз'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </button>
                    </motion.div>
                )}

                {step === 'email' && (
                    <motion.div
                        key="email"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-background p-6">
                            <CardContent className="p-2 space-y-6">
                                <form onSubmit={handleSendOtp} className="space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Жеке деректер</label>
                                            <button
                                                type="button"
                                                onClick={() => setStep('choice')}
                                                className="text-[10px] font-bold text-primary hover:underline"
                                            >
                                                Артқа
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder="Атыңыз (мысалы: Бекболат)"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="h-14 rounded-2xl bg-muted/50 border-none pl-12 pr-4 text-base"
                                                required
                                            />
                                        </div>

                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                type="email"
                                                placeholder="Email (мысалы: bek@mail.com)"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-14 rounded-2xl bg-muted/50 border-none pl-12 pr-4 text-base"
                                                required
                                            />
                                        </div>

                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                type="tel"
                                                placeholder="Телефон (мысалы: +7707...)"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="h-14 rounded-2xl bg-muted/50 border-none pl-12 pr-4 text-base"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg mt-2" disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Код алу'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {step === 'otp' && (
                    <motion.div
                        key="otp"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-background p-6">
                            <CardContent className="p-2 space-y-6">
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="space-y-2 text-center">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Растау коды (Email арқылы келді)</label>
                                        <div className="relative mt-2">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder="000000"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="h-14 rounded-2xl bg-muted/50 border-none pl-12 pr-4 text-base tracking-[0.5em] font-black text-center"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg" disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Растау'}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setStep('email')}
                                        className="w-full text-xs font-bold text-muted-foreground hover:text-primary transition-colors py-2 flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft className="w-3 h-3" />
                                        Деректерді өзгерту
                                    </button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
