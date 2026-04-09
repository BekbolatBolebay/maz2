'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/lib/db'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Package, MapPin, Phone, Navigation } from 'lucide-react'
import { openIn2GIS } from './courier-utils'
import { cn } from '@/lib/utils'

interface TrackingViewProps {
    token: string
}

export function TrackingView({ token }: TrackingViewProps) {
    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        async function fetchOrder() {
            try {
                const response = await fetch('/api/courier/track-order/details', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    console.error('[TrackingView] Details API Error:', response.status, errorData)
                    throw new Error(errorData.error || 'Тапсырыс табылмады')
                }

                const data = await response.json()
                setOrder(data)
            } catch (error: any) {
                console.error('[TrackingView] Fetch error:', error)
                toast.error(error.message || 'Тапсырыс табылмады')
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrder()
    }, [token])

    const markAsDelivered = async () => {
        if (!order) return
        setIsUpdating(true)

        try {
            const response = await fetch('/api/courier/track-order/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            })

            if (!response.ok) {
                const errData = await response.json()
                console.error('[TrackingView] Complete API Error:', response.status, errData)
                const errMsg = errData.details || errData.error || 'Қате орын алды'
                throw new Error(errMsg)
            }

            toast.success('Тапсырыс сәтті аяқталды!')
            setOrder({ ...order, status: 'delivered' })
        } catch (error: any) {
            console.error('[TrackingView] Update error:', error)
            toast.error(error.details || error.message || 'Қате орын алды')
        } finally {
            setIsUpdating(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center px-4">
                <div>
                    <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-bold">Тапсырыс табылмады</h2>
                    <p className="text-gray-500 mt-2">Сілтеме қате болуы мүмкін</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-primary text-primary-foreground px-6 py-8 rounded-b-[2.5rem] shadow-lg">
                <h1 className="text-2xl font-black">Тапсырыс #{order.order_number}</h1>
                <p className="opacity-80 text-sm mt-1">Жеткізу күйі: {(['completed', 'delivered'] as string[]).includes(order.status) ? 'Аяқталды' : order.status}</p>
            </div>

            <div className="px-4 -mt-6 space-y-4">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Клиент мәліметі</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500">Мекен-жайы</p>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-bold text-sm">{order.delivery_address || order.address || 'Мекен-жай көрсетілмеген'}</p>
                                    <button
                                        onClick={() => openIn2GIS(order.latitude, order.longitude, order.delivery_address || order.address)}
                                        className="shrink-0 bg-blue-600 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1.5 text-[10px] font-bold"
                                    >
                                        <Navigation className="w-3.5 h-3.5" />
                                        2GIS
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                <Phone className="w-5 h-5" />
                            </div>
                            <a href={`tel:${order.customer_phone || order.phone}`} className="block">
                                <p className="text-xs text-gray-500">Телефон</p>
                                <p className="font-bold text-sm text-blue-600">{order.customer_phone || order.phone || 'Көрсетілмеген'}</p>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Тапсырыс мазмұны</h3>
                    <div className="space-y-3">
                        {(order as any).items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{item.name} x {item.quantity}</span>
                                <span className="text-gray-500">{item.price * item.quantity} ₸</span>
                            </div>
                        ))}
                        <div className="pt-3 border-t border-gray-50 flex justify-between items-center font-bold">
                            <span>Жиыны</span>
                            <span className="text-primary text-lg">{order.total_amount} ₸</span>
                        </div>
                    </div>
                </div>

                {['accepted', 'preparing', 'ready', 'on_the_way'].includes(order.status) && (
                    <button
                        onClick={markAsDelivered}
                        disabled={isUpdating}
                        className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                        Жеткізілді және Аяқталды
                    </button>
                )}

                {(['completed', 'delivered', 'cancelled'] as string[]).includes(order.status) && (
                    <div className={cn(
                        "rounded-2xl py-4 px-6 font-bold flex items-center justify-center gap-2",
                        (order.status as string) === 'cancelled' ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                    )}>
                        <CheckCircle2 className="w-6 h-6" />
                        {(order.status as string) === 'cancelled' ? 'Тапсырыс тоқтатылды' : 'Тапсырыс сәтті жеткізіліп, аяқталды'}
                    </div>
                )}
            </div>
        </div>
    )
}
