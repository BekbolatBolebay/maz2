'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/lib/app-context'
import { cn } from '@/lib/utils'
import {
    UserPlus, Mail, Lock, Loader2, ArrowRight,
    UtensilsCrossed, Store, MapPin, Phone,
    Clock, CheckCircle2, ShieldCheck, MailCheck,
    ChevronRight, ChevronLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { t } from '@/lib/i18n'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('@/components/restaurant/map-picker').then(mod => mod.MapPicker), {
    ssr: false,
    loading: () => <div className="h-10 w-full animate-pulse bg-secondary/50 rounded-2xl" />
})

export default function RegisterPage() {
    const { lang, setLang } = useApp()
    const router = useRouter()
    const supabase = createClient()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [sendingOtp, setSendingOtp] = useState(false)

    // Form State
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [cafeName, setCafeName] = useState('')
    const [address, setAddress] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [enteredOtp, setEnteredOtp] = useState('')
    const [correctOtp, setCorrectOtp] = useState('')
    const [mapOpen, setMapOpen] = useState(false)
    const [latitude, setLatitude] = useState<number | null>(null)
    const [longitude, setLongitude] = useState<number | null>(null)

    // Working Hours State
    const [openTime, setOpenTime] = useState('09:00')
    const [closeTime, setCloseTime] = useState('22:00')
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])

    async function sendOtp() {
        console.log('Sending OTP to:', email, 'Lang:', lang)
        setSendingOtp(true)
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, lang }),
            })
            const data = await res.json()
            if (data.success) {
                setCorrectOtp(data.otp)
                setStep(3)
                toast.success(t(lang, 'otpSuccess'))
            } else {
                toast.error(data.error || 'SMTP Error')
            }
        } catch (e) {
            console.error('OTP Error:', e)
            toast.error('Failed to send OTP')
        } finally {
            setSendingOtp(false)
        }
    }

    async function handleFinalRegister() {
        if (enteredOtp !== correctOtp) {
            toast.error(t(lang, 'invalidCode'))
            return
        }

        setLoading(true)
        try {
            // Call server-side registration API
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    cafeName,
                    address,
                    whatsapp,
                    latitude,
                    longitude,
                    openTime,
                    closeTime,
                    selectedDays
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed')
            }

            // After successful server-side registration, sign in on the client side
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (signInError) throw signInError

            toast.success(t(lang, 'registerSuccess'))
            
            // Redirect to home
            setTimeout(() => {
                window.location.href = '/'
            }, 1000)

        } catch (error: any) {
            console.error('Final Registration Error:', error)
            toast.error(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20 -rotate-3 transition-transform hover:rotate-0">
                        <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
                        {t(lang, 'register')}
                    </h1>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-500",
                                    step === s ? "w-8 bg-primary" : "w-4 bg-muted"
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl shadow-black/5 relative overflow-hidden transition-all duration-500">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                    {/* Step 1: Account Info */}
                    {step === 1 && (
                        <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground px-1">{t(lang, 'email')}</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@cafe.com"
                                            className="w-full bg-secondary/50 border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground px-1">{t(lang, 'cafeName')}</label>
                                    <div className="relative group">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={cafeName}
                                            onChange={(e) => setCafeName(e.target.value)}
                                            placeholder={t(lang, 'cafeNamePlaceholder')}
                                            className="w-full bg-secondary/50 border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground px-1">{t(lang, 'password')}</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-secondary/50 border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => (email && password && cafeName) ? setStep(2) : toast.error(t(lang, 'fillAllFields'))}
                                className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 mt-4"
                            >
                                {t(lang, 'continue')}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Cafe Details */}
                    {step === 2 && (
                        <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground px-1">{t(lang, 'address')}</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder={t(lang, 'addressPlaceholder')}
                                            className="w-full bg-secondary/50 border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setMapOpen(true)}
                                        className="text-[10px] font-bold text-primary flex items-center gap-1 mt-1 hover:underline ml-1"
                                    >
                                        <MapPin className="w-3 h-3" />
                                        {latitude && longitude ? t(lang, 'addressPicked') : t(lang, 'selectOnMap')}
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground px-1">{t(lang, 'whatsapp')}</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={whatsapp}
                                            onChange={(e) => setWhatsapp(e.target.value)}
                                            placeholder="+7 707 123 4567"
                                            className="w-full bg-secondary/50 border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="bg-secondary/30 p-5 rounded-3xl border border-border/50 space-y-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-5 h-5 text-primary" />
                                        <span className="text-xs font-black text-foreground uppercase tracking-wider">{t(lang, 'workingHours')}</span>
                                    </div>

                                    {/* Days Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">{t(lang, 'selectDays')}</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((dayKey, index) => (
                                                <button
                                                    key={dayKey}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedDays(prev =>
                                                            prev.includes(index)
                                                                ? prev.filter(d => d !== index)
                                                                : [...prev, index].sort()
                                                        )
                                                    }}
                                                    className={cn(
                                                        "w-9 h-9 rounded-xl text-[10px] font-black transition-all border",
                                                        selectedDays.includes(index)
                                                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                                                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                                    )}
                                                >
                                                    {t(lang, dayKey as any)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time Selection */}
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">{t(lang, 'openingTime')}</label>
                                            <input
                                                type="time"
                                                value={openTime}
                                                onChange={(e) => setOpenTime(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">{t(lang, 'closingTime')}</label>
                                            <input
                                                type="time"
                                                value={closeTime}
                                                onChange={(e) => setCloseTime(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-14 h-14 bg-secondary flex items-center justify-center rounded-2xl hover:bg-secondary/80 transition-all shrink-0"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => (address && whatsapp) ? sendOtp() : toast.error(t(lang, 'fillAllFields'))}
                                    disabled={sendingOtp}
                                    className="flex-1 bg-primary text-primary-foreground rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {sendingOtp ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            {t(lang, 'getCode')}
                                            <MailCheck className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: OTP Verification */}
                    {step === 3 && (
                        <div className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <ShieldCheck className="w-6 h-6 text-green-500" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t(lang, 'enterCode')}
                                </p>
                                <p className="font-bold text-foreground mt-1">{email}</p>
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    value={enteredOtp}
                                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000 000"
                                    className="w-full bg-secondary/50 border border-border rounded-2xl px-4 py-4 text-center text-3xl font-black tracking-[12px] text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:tracking-normal placeholder:text-muted-foreground/30"
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-14 h-14 bg-secondary flex items-center justify-center rounded-2xl hover:bg-secondary/80 transition-all shrink-0"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={handleFinalRegister}
                                    disabled={loading || enteredOtp.length !== 6}
                                    className="flex-1 bg-primary text-primary-foreground rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            {t(lang, 'verifyAndLogin')}
                                            <CheckCircle2 className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <button
                                onClick={sendOtp}
                                disabled={sendingOtp}
                                className="w-full text-xs font-bold text-muted-foreground hover:text-primary transition-colors mt-2"
                            >
                                {t(lang, 'resendCode')}
                            </button>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-border text-center">
                        <p className="text-sm text-muted-foreground">
                            {t(lang, 'accountExists')}{' '}
                            <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">
                                {t(lang, 'login')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <MapPicker
                open={mapOpen}
                onOpenChange={setMapOpen}
                onSelect={(lat, lng, addr) => {
                    setLatitude(lat)
                    setLongitude(lng)
                    if (addr) setAddress(addr)
                }}
                lang={lang}
            />
        </div>
    )
}
