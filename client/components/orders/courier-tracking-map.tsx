'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Bike, Home, Navigation, Loader2 } from 'lucide-react'

const MapContent = dynamic(() => import('./courier-tracking-map-content'), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] w-full bg-zinc-800 animate-pulse rounded-[2.5rem] flex items-center justify-center border border-white/5">
            <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
        </div>
    )
})

interface CourierTrackingMapProps {
    courierId: string
    customerLat: number
    customerLng: number
    orderId: string
}

export function CourierTrackingMap({ courierId, customerLat, customerLng, orderId }: CourierTrackingMapProps) {
    const { locale } = useI18n()
    const [courierPos, setCourierPos] = useState<{ lat: number, lng: number } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        async function fetchInitial() {
            const { data } = await supabase
                .from('courier_locations')
                .select('latitude, longitude')
                .eq('courier_id', courierId)
                .single()
            
            if (data) {
                setCourierPos({ lat: data.latitude, lng: data.longitude })
            }
            setLoading(false)
        }

        fetchInitial()

        const channel = supabase
            .channel(`courier-loc-${courierId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'courier_locations',
                    filter: `courier_id=eq.${courierId}`
                },
                (payload) => {
                    if (payload.new) {
                        setCourierPos({ 
                            lat: (payload.new as any).latitude, 
                            lng: (payload.new as any).longitude 
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [courierId])

    if (loading) return (
        <div className="h-[300px] w-full bg-zinc-800 rounded-[2.5rem] flex items-center justify-center border border-white/5">
            <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {locale === 'ru' ? 'Живое отслеживание' : 'Тікелей бақылау'}
                    </span>
                </div>
                {courierPos && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Live
                    </span>
                )}
            </div>
            
            <MapContent 
                courierPos={courierPos} 
                customerLat={customerLat} 
                customerLng={customerLng} 
            />
            
            {!courierPos && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                    <Navigation className="w-5 h-5 text-amber-500" />
                    <p className="text-xs font-bold text-amber-500">
                        {locale === 'ru' 
                            ? 'Курьер еще не обновил свое местоположение' 
                            : 'Курьер әлі өзінің орнын жаңартқан жоқ'}
                    </p>
                </div>
            )}
        </div>
    )
}
