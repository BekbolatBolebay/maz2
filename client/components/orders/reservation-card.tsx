'use client'

import { Clock, Users, ChevronRight, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Reservation = {
    id: string
    status: string
    date: string
    time: string
    guests_count: number
    total_amount: number
    restaurants: {
        name_kk: string
        name_ru: string
        image_url: string | null
    } | null
}

const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    awaiting_payment: 'default',
    accepted: 'default',
    confirmed: 'default',
    completed: 'outline',
    cancelled: 'destructive',
}

export function ReservationCard({ reservation }: { reservation: Reservation }) {
    const { locale, t } = useI18n()

    const statusText = (t.orders.status as any)[reservation.status] || reservation.status
    const variant = statusVariantMap[reservation.status] || 'secondary'

    const restaurantName = locale === 'ru' ? reservation.restaurants?.name_ru : reservation.restaurants?.name_kk

    return (
        <Card className="hover:bg-zinc-900/50 transition-all overflow-hidden border border-white/10 bg-zinc-950 rounded-[2rem] group shadow-xl">
            <CardContent className="p-0">
                <div className="flex items-stretch">
                    <div className="w-2 bg-primary/20 shrink-0 group-hover:bg-primary transition-colors" />
                    <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-black text-base mb-0.5 text-white">
                                    {restaurantName}
                                </h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                                    ID: {reservation.id.slice(0, 8)}
                                </p>
                            </div>
                            <Badge
                                variant={variant}
                                className={cn(
                                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                    reservation.status === 'awaiting_payment' && "bg-orange-500 hover:bg-orange-600 text-white"
                                )}
                            >
                                {statusText}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="flex items-center gap-2 text-xs text-zinc-300 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span className="font-bold">{format(new Date(reservation.date), 'dd.MM.yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-300 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="font-bold">{reservation.time.slice(0, 5)}</span>
                            </div>
                            <div className="col-span-2 flex items-center justify-between text-xs text-zinc-300 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span className="font-bold">{reservation.guests_count} {t.cart.guests}</span>
                                </div>
                                {reservation.total_amount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-tight">{locale === 'ru' ? 'ИТОГО:' : 'ЖИЫНЫ:'}</span>
                                        <span className="text-primary font-black">{reservation.total_amount.toLocaleString()}₸</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-zinc-600 font-black tracking-widest uppercase">
                                {t.orders.updatedAtLabel}: {format(new Date(), 'HH:mm')}
                            </span>
                            <div className="flex items-center gap-1 text-primary font-black text-[10px] uppercase tracking-wider">
                                {t.cart.details}
                                <ChevronRight className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
