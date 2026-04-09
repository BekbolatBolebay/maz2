'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { LogIn, Mail, Lock, Loader2, ArrowRight, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
    const { lang } = useApp()
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast.error(t(lang, 'invalidData'))
            setLoading(false)
        } else {
            toast.success(t(lang, 'welcome'))
            router.push('/')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
                        <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
                        {t(lang, 'welcome')}
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        {t(lang, 'loginToContinue')}
                    </p>
                </div>

                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl shadow-black/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground px-1">
                                Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@cafe.com"
                                    className="w-full bg-secondary/50 border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground px-1">
                                {t(lang, 'password')}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-secondary/50 border border-border rounded-2xl pl-12 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {t(lang, 'login')}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border text-center">
                        <p className="text-sm text-muted-foreground">
                            {t(lang, 'noAccount')}{' '}
                            <Link
                                href="/register"
                                className="text-primary font-bold hover:underline underline-offset-4"
                            >
                                {t(lang, 'register')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
