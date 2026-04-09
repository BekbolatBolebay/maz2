'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreditCard, Lock, ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export default function MockCardPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const orderId = searchParams.get('orderId')
    const reservationId = searchParams.get('reservationId')
    const amount = searchParams.get('amount')

    const [cardNumber, setCardNumber] = useState('')
    const [expiry, setExpiry] = useState('')
    const [cvv, setCvv] = useState('')
    const [name, setName] = useState('')
    const [isPaying, setIsPaying] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        const matches = v.match(/\d{4,16}/g)
        const match = matches && matches[0] || ''
        const parts = []
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4))
        }
        if (parts.length) return parts.join(' ')
        return value
    }

    const handlePay = async () => {
        if (cardNumber.length < 16 || expiry.length < 5 || cvv.length < 3 || !name) {
            return
        }
        setIsPaying(true)

        // Simulate bank processing time
        setTimeout(async () => {
            try {
                // Determine what we're updating
                const targetId = orderId || reservationId
                const targetTable = orderId ? 'orders' : 'reservations'

                console.log('Finalizing mock payment for:', { targetTable, targetId })

                if (!targetId) {
                    toast.error('ID is missing')
                    setIsPaying(false)
                    return
                }

                // Simulating the update Freedom Pay would do via webhook
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()

                const updates: any = {
                    payment_status: 'paid',
                    updated_at: new Date().toISOString()
                }

                if (orderId) {
                    updates.status = 'preparing'
                } else {
                    updates.status = 'confirmed'
                }

                const { error } = await supabase
                    .from(targetTable)
                    .update(updates)
                    .eq('id', targetId)

                if (error) {
                    console.error('Update error:', error)
                    toast.error('База мәліметтерін жаңарту қатесі')
                    setIsPaying(false)
                    return
                }

                // If it's a reservation, we might need to get the cafe_id for redirect
                let redirectUrl = orderId ? `/orders/${orderId}?status=success&mock=true` : '/';

                if (reservationId) {
                    const { data: res } = await supabase.from('reservations').select('cafe_id').eq('id', reservationId).single()
                    if (res) {
                        redirectUrl = `/booking/${res.cafe_id}?step=status&reservationId=${reservationId}&status=success&mock=true`
                    }
                }

                toast.success('Төлем сәтті өтті!')
                setIsSuccess(true)
                setTimeout(() => {
                    router.push(redirectUrl)
                }, 1500)
            } catch (err) {
                console.error('Mock Payment Error:', err)
                setIsPaying(false)
                alert('Payment failed in database update. Check console.')
            }
        }, 2000)
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-bold italic text-blue-900">Freedom <span className="text-blue-500">Pay</span> <span className="text-xs font-normal text-slate-400 not-italic ml-2">(MOCK MODE)</span></h1>
                </div>

                <AnimatePresence mode="wait">
                    {!isSuccess ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
                                <CardContent className="p-8 space-y-6">
                                    <div className="bg-blue-600 rounded-2xl p-6 text-white space-y-8 relative overflow-hidden h-48 shadow-lg">
                                        <div className="flex justify-between items-start relative z-10">
                                            <CreditCard className="w-10 h-10 opacity-80" />
                                            <div className="flex gap-1">
                                                <div className="w-8 h-8 rounded-full bg-red-500/80" />
                                                <div className="w-8 h-8 rounded-full bg-yellow-500/80 -ml-4" />
                                            </div>
                                        </div>
                                        <div className="space-y-1 relative z-10">
                                            <p className="text-xs opacity-60 uppercase tracking-widest">Card Number</p>
                                            <p className="text-xl font-mono tracking-wider tabular-nums">
                                                {cardNumber || '•••• •••• •••• ••••'}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-end relative z-10">
                                            <div className="space-y-1">
                                                <p className="text-[10px] opacity-60 uppercase">Holder</p>
                                                <p className="text-sm font-medium uppercase truncate max-w-[150px]">{name || 'Your Name'}</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <p className="text-[10px] opacity-60 uppercase">Expires</p>
                                                <p className="text-sm font-medium">{expiry || 'MM/YY'}</p>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Card Number</label>
                                            <Input
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                placeholder="0000 0000 0000 0000"
                                                maxLength={19}
                                                className="rounded-xl h-12 bg-slate-50 border-none px-4 font-bold"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Expiry</label>
                                                <Input
                                                    value={expiry}
                                                    onChange={(e) => {
                                                        let v = e.target.value.replace(/\D/g, '')
                                                        if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4)
                                                        setExpiry(v)
                                                    }}
                                                    placeholder="MM/YY"
                                                    maxLength={5}
                                                    className="rounded-xl h-12 bg-slate-50 border-none px-4 font-bold"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">CVV</label>
                                                <Input
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="•••"
                                                    maxLength={3}
                                                    type="password"
                                                    className="rounded-xl h-12 bg-slate-50 border-none px-4 font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cardholder Name</label>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value.toUpperCase())}
                                                placeholder="IVAN IVANOV"
                                                className="rounded-xl h-12 bg-slate-50 border-none px-4 font-bold uppercase"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handlePay}
                                        disabled={isPaying || cardNumber.length < 16}
                                        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-200 transition-all active:scale-95"
                                    >
                                        {isPaying ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </div>
                                        ) : `PAY ${amount} ₸`}
                                    </Button>

                                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                                        <Lock className="w-3 h-3" />
                                        Secure Encrypted Payment
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[2rem] p-12 text-center space-y-6 shadow-2xl"
                        >
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900">Success!</h2>
                                <p className="text-slate-500 font-medium italic">Payment confirmed. Redirecting back...</p>

                                <div className="pt-4 border-t border-slate-100">
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-200 gap-2 font-bold"
                                        asChild
                                    >
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(`My order tracking link: ${window.location.origin}/orders/${orderId || reservationId}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Save tracking in WhatsApp
                                        </a>
                                    </Button>
                                    <p className="text-[10px] text-slate-400 mt-2">
                                        Tip: Save this link to track your order anytime!
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
