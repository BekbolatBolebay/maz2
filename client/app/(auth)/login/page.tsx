'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signInWithCustomOtp, verifyCustomOtp, signInAnonymous, loading: authLoading } = useAuth()
    const { locale, t } = useI18n()
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<'email' | 'otp'>('email')
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
    const [loading, setLoading] = useState(false)

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setLoading(true)
        try {
            await signInWithCustomOtp(email, fullName, phone)
            setStep('otp')
            toast.success(t.common?.success || 'Код жіберілді')
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
            const next = searchParams.get('next') || '/'
            router.push(next)
            toast.success(locale === 'kk' ? 'Қош келдіңіз!' : 'Добро пожаловать!')
        } catch (error: any) {
            toast.error('Код қате')
        } finally {
            setLoading(false)
        }
    }

    const handleAnonymousLogin = async () => {
        setLoading(true)
        try {
            await signInAnonymous()
            toast.success('Сіз қонақ ретінде кірдіңіз')
            router.push('/')
        } catch (error: any) {
            toast.error('Қате: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Кіру</CardTitle>
                    <CardDescription>
                        Тапсырыс беру үшін жүйеге кіріңіз
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 'email' ? (
                        <div className="space-y-6">
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
                                <button
                                    onClick={() => setAuthMode('login')}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-black rounded-xl transition-all",
                                        authMode === 'login' ? "bg-white dark:bg-slate-800 shadow-sm text-primary" : "text-slate-500"
                                    )}
                                >
                                    {t.common?.signIn || 'Кіру'}
                                </button>
                                <button
                                    onClick={() => setAuthMode('register')}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-black rounded-xl transition-all",
                                        authMode === 'register' ? "bg-white dark:bg-slate-800 shadow-sm text-primary" : "text-slate-500"
                                    )}
                                >
                                    {t.common?.signUp || 'Тіркелу'}
                                </button>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                            Email
                                        </label>
                                        <Input
                                            type="email"
                                            placeholder="example@mail.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-6 focus-visible:ring-primary"
                                            disabled={loading}
                                            required
                                        />
                                    </div>

                                    {authMode === 'register' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                    {t.common?.fullName || 'Аты-жөні'}
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="Асхат Марат"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-6 focus-visible:ring-primary"
                                                    disabled={loading}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                    {t.common?.phone || 'Телефон'}
                                                </label>
                                                <Input
                                                    type="tel"
                                                    placeholder="+7 700 000 00 00"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-6 focus-visible:ring-primary"
                                                    disabled={loading}
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 mt-4 group" disabled={loading}>
                                    {loading ? (t.common?.loading || 'Күте тұрыңыз...') : (authMode === 'login' ? (t.common?.signIn || 'Кіру') : (t.common?.signUp || 'Тіркелу'))}
                                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">SMS-код</label>
                                <Input
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {locale === 'kk' ? 'Растау' : 'Подтвердить'}
                            </Button>
                            <Button
                                variant="link"
                                className="w-full text-xs"
                                onClick={() => setStep('email')}
                                disabled={loading}
                            >
                                Email-ді өзгерту
                            </Button>
                        </form>
                    )}

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Немесе</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-14 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-900 mt-2"
                        onClick={handleAnonymousLogin}
                        disabled={loading}
                    >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        {t.profile?.guest || 'Қонақ ретінде жалғастыру'}
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground">
                    <p>Жүйеге кіру арқылы сіз біздің пайдалану шарттарымен келісесіз</p>
                    <p className="opacity-30 pt-2 border-t w-full">V1.0.1 - SMTP_AUTH_REINFORCED</p>
                </CardFooter>
            </Card>
        </div>
    )
}
