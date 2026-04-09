'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signInWithEmail, verifyEmailOtp, signInAnonymous, loading: authLoading } = useAuth()
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<'email' | 'otp'>('email')
    const [loading, setLoading] = useState(false)

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setLoading(true)
        try {
            await signInWithEmail(email)
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
            await verifyEmailOtp(email, otp)
            const next = searchParams.get('next') || '/'
            router.push(next)
            toast.success('Қош келдіңіз!')
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
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder="example@mail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 rounded-xl bg-muted/50 border-none px-4"
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <Button className="w-full h-12 rounded-xl font-bold" disabled={loading}>
                                {loading ? 'Жіберілуде...' : 'Кодты алу'}
                            </Button>
                        </form>
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
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Растау
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
                        className="w-full"
                        onClick={handleAnonymousLogin}
                        disabled={loading}
                    >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Тіркелмей жалғастыру
                    </Button>
                </CardContent>
                <CardFooter className="text-center text-xs text-muted-foreground">
                    Жүйеге кіру арқылы сіз біздің пайдалану шарттарымен келісесіз
                </CardFooter>
            </Card>
        </div>
    )
}
