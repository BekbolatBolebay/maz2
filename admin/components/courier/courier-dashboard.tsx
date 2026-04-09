'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Courier, CourierSession } from './courier-utils'
import { Order } from '@/lib/db'
import { toast } from 'sonner'
import { Loader2, Package, MapPin, Phone, LogOut, CheckCircle2, Bike, Navigation } from 'lucide-react'
import { openIn2GIS } from './courier-utils'

interface CourierDashboardProps {
    initialCourier: CourierSession
    onLogout: () => void
}

export function CourierDashboard({ initialCourier, onLogout }: CourierDashboardProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    useEffect(() => {
        async function fetchOrders() {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('orders')
                .select('*, items:order_items(*)')
                .eq('courier_id', initialCourier.id)
                .in('status', ['accepted', 'preparing', 'ready', 'on_the_way', 'delivered'])
                .order('created_at', { ascending: false })

            if (error) {
                toast.error('Тапсырыстарды жүктеу мүмкін болмады')
            } else {
                setOrders(data || [])
            }
            setIsLoading(false)
        }

        fetchOrders()

        const supabase = createClient()
        const channel = supabase
            .channel('courier_orders')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `courier_id=eq.${initialCourier.id}`
            }, () => {
                fetchOrders()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [initialCourier.id])

    const updateStatus = async (orderId: string, nextStatus: string) => {
        if (updatingId) return
        setUpdatingId(orderId)
        
        const supabase = createClient()
        const { error } = await supabase
            .from('orders')
            .update({ 
                status: nextStatus, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', orderId)

        if (error) {
            toast.error('Күйді жаңарту мүмкін болмады')
        } else {
            toast.success(nextStatus === 'completed' ? 'Тапсырыс аяқталды ✅' : 'Күй жаңартылды')
            // Refresh local state immediately for better UX
            setOrders(prev => prev.filter(o => o.id !== orderId || nextStatus !== 'completed'))
        }
        setUpdatingId(null)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white px-6 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Bike className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">{initialCourier.full_name || 'Курьер'}</h1>
                        <p className="text-xs text-gray-500">Сәтті жұмыс!</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <LogOut className="w-6 h-6" />
                </button>
            </div>

            <div className="px-4 py-6 space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">Қазірше тапсырыстар жоқ</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-lg">#{order.order_number}</h3>
                                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString()}</p>
                                </div>
                                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">
                                    {order.status}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-sm font-medium">{order.delivery_address || order.address || 'Мекен-жай жоқ'}</p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openIn2GIS(order.latitude, order.longitude, order.delivery_address || order.address);
                                                }}
                                                className="shrink-0 bg-blue-600 text-white px-2 py-1 rounded-md text-[10px] flex items-center gap-1 active:scale-95 transition-all font-bold"
                                            >
                                                <Navigation className="w-3 h-3" />
                                                2GIS
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                                    <p className="text-sm font-medium">{order.customer_phone || order.phone || 'Көрсетілмеген'}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex gap-2">
                                {order.status === 'ready' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'on_the_way')}
                                        disabled={updatingId === order.id}
                                        className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {updatingId === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                        Тапсырысты алу
                                    </button>
                                )}
                                {order.status === 'on_the_way' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'completed')}
                                        disabled={updatingId === order.id}
                                        className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-green-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {updatingId === order.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-5 h-5" />
                                        )}
                                        Жеткізілді және Аяқталды
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
