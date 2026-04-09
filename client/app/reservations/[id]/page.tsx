'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle2, XCircle, MessageCircle, CreditCard, Calendar, Users, Loader2, ChevronRight, Utensils, Info } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useI18n } from '@/lib/i18n/i18n-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const statusVariantMap: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    awaiting_payment: 'bg-orange-500 text-white animate-pulse',
    accepted: 'bg-primary text-primary-foreground',
    confirmed: 'bg-primary text-primary-foreground',
    completed: 'bg-emerald-500 text-white',
    cancelled: 'bg-destructive text-destructive-foreground',
}

export default function ReservationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { t, locale } = useI18n()
    const [reservation, setReservation] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            
            const { data, error } = await supabase
                .from('reservations')
                .select(`
                    *,
                    restaurants!cafe_id (*),
                    reservation_items (*),
                    restaurant_tables (*)
                `)
                .eq('id', id)
                .single()

            if (error || !data) {
                console.error('Reservation fetch error:', error)
                router.push('/orders')
                return
            }

            setReservation(data)
            setLoading(false)
        }

        fetchData()

        // Real-time listener
        const supabase = createClient()
        const channel = supabase
            .channel(`reservation-details-${id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'reservations', filter: `id=eq.${id}` },
                (payload) => {
                    setReservation((prev: any) => ({ ...prev, ...payload.new }))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id, router])

    if (loading || !reservation) {
        return (
            <div className="flex flex-col min-h-screen pb-16">
                <Header title={t.cart.details} id={id} />
                <main className="flex-1 flex items-center justify-center bg-muted/30">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </main>
            </div>
        )
    }

    const restaurantName = locale === 'ru' ? reservation.restaurants?.name_ru : reservation.restaurants?.name_kk
    const statusText = (t.orders.status as any)[reservation.status] || reservation.status

    return (
        <div className="flex flex-col min-h-screen pb-16 bg-muted/30">
            <Header title={t.cart.details} id={id} />

            <main className="flex-1 overflow-auto pb-10">
                <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                    {/* Status Card */}
                    <Card className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-card text-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={cn(
                            "w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4",
                            reservation.status === 'cancelled' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        )}>
                            {reservation.status === 'cancelled' ? <XCircle className="w-10 h-10" /> : <Calendar className="w-10 h-10" />}
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                            {statusText}
                        </h2>
                        <p className="text-sm font-medium text-muted-foreground mt-1">
                            {format(new Date(reservation.date), 'dd MMMM yyyy', { locale: locale === 'ru' ? undefined : undefined })} • {reservation.time.slice(0, 5)}
                        </p>
                        
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                             <Badge className={cn("rounded-full px-4 py-1 font-bold text-[10px] border-none", statusVariantMap[reservation.status])}>
                                {statusText}
                             </Badge>
                             {reservation.payment_status === 'paid' && (
                                <Badge className="rounded-full px-4 py-1 font-bold text-[10px] bg-emerald-500 text-white border-none">
                                    {locale === 'kk' ? 'ТӨЛЕНДІ' : 'ОПЛАЧЕНО'}
                                </Badge>
                             )}
                        </div>
                    </Card>

                    {/* Reservation Details */}
                    <Card className="border-none shadow-lg rounded-[2.5rem] overflow-hidden bg-card">
                        <CardContent className="p-6 space-y-6">
                            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest px-2">{locale === 'kk' ? 'Бронь мәліметтері' : 'Детали брони'}</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem 
                                    icon={<Users className="w-4 h-4" />} 
                                    label={t.cart.guests} 
                                    value={`${reservation.guests_count}`} 
                                />
                                <DetailItem 
                                    icon={<Clock className="w-4 h-4" />} 
                                    label={locale === 'kk' ? 'Ұзақтығы' : 'Длительность'} 
                                    value={`${reservation.duration_hours} ${locale === 'kk' ? 'сағат' : 'часа'}`} 
                                />
                                <DetailItem 
                                    icon={<Utensils className="w-4 h-4" />} 
                                    label={locale === 'kk' ? 'Үстел' : 'Стол'} 
                                    value={reservation.tables?.table_number ? `№ ${reservation.tables.table_number}` : (locale === 'kk' ? 'Күтілуде...' : 'Ожидается...')} 
                                />
                                <DetailItem 
                                    icon={<CreditCard className="w-4 h-4" />} 
                                    label={t.cart.payment_method} 
                                    value={reservation.payment_method === 'kaspi' ? 'Kaspi' : (reservation.payment_method === 'freedom' ? 'Карта' : 'Наличные')} 
                                />
                            </div>

                            {reservation.notes && (
                                <div className="mt-4 p-4 rounded-3xl bg-muted/30 text-xs italic text-muted-foreground border border-dashed">
                                    <div className="flex items-center gap-2 mb-1.5 non-italic not-italic font-bold uppercase tracking-tighter text-[10px]">
                                        <Info className="w-3 h-3" /> {t.cart.notes}
                                    </div>
                                    "{reservation.notes}"
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pre-ordered Items */}
                    {reservation.reservation_items?.length > 0 && (
                        <Card className="border-none shadow-lg rounded-[2.5rem] overflow-hidden bg-card">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center mb-6 px-2">
                                     <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">{locale === 'kk' ? 'Мәзір (алдын ала)' : 'Меню (предзаказ)'}</h3>
                                     <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black">{reservation.reservation_items.length}</span>
                                </div>
                                
                                <div className="space-y-4">
                                    {reservation.reservation_items.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-start gap-4 p-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-foreground leading-tight">
                                                    {locale === 'ru' ? item.name_ru : item.name_kk}
                                                </p>
                                                <p className="text-[10px] font-black text-primary/60 mt-0.5">
                                                    {item.quantity} × {item.price.toLocaleString()}₸
                                                </p>
                                            </div>
                                            <p className="text-sm font-black text-foreground">
                                                {(item.quantity * item.price).toLocaleString()}₸
                                            </p>
                                        </div>
                                    ))}
                                    
                                    <Separator className="my-2 bg-muted/50" />
                                    
                                    {reservation.booking_fee > 0 && (
                                        <div className="flex justify-between items-center px-2 py-1 text-primary">
                                            <p className="text-xs font-bold uppercase tracking-tighter">Брондау ақысы</p>
                                            <p className="text-sm font-black">{Number(reservation.booking_fee).toLocaleString()}₸</p>
                                        </div>
                                    )}
                                    <Separator className="my-2 bg-muted/50" />
                                    
                                    <div className="flex justify-between items-center px-2 pt-2">
                                        <p className="text-sm font-black uppercase tracking-tighter text-muted-foreground">{t.cart.total}</p>
                                        <p className="text-xl font-black text-primary">{(Number(reservation.total_amount) || 0).toLocaleString()}₸</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Support Card */}
                    <div className="bg-card border border-border shadow-sm rounded-[2rem] p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">{locale === 'kk' ? 'Қолдау' : 'Поддержка'}</p>
                                <p className="text-sm font-bold">WhatsApp</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-xl w-12 h-12" asChild>
                            <a href={`https://wa.me/${(reservation.restaurants?.whatsapp_number || reservation.restaurants?.phone || '77771234567').replace(/[+\s-()]/g, '')}`} target="_blank">
                                <ChevronRight className="w-6 h-6" />
                            </a>
                        </Button>
                    </div>

                    {/* Actions */}
                    {reservation.status === 'awaiting_payment' && reservation.payment_url && (
                        <Button className="w-full bg-black text-white h-16 rounded-[2rem] text-base font-black shadow-xl hover:bg-zinc-800 transition-all gap-3" asChild>
                            <a href={reservation.payment_url} target="_blank" rel="noopener noreferrer">
                                <CreditCard className="w-5 h-5" />
                                <span>{locale === 'ru' ? 'ОПЛАТИТЬ СЕЙЧАС' : 'ҚАЗІР ТӨЛЕУ'}</span>
                            </a>
                        </Button>
                    )}
                </div>
            </main>
        </div>
    )
}

function Header({ title, id }: { title: string, id: string }) {
    const router = useRouter()
    return (
        <div className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="flex items-center h-14 px-4 max-w-screen-xl mx-auto">
                <Button variant="ghost" size="icon" onClick={() => router.push('/orders')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="ml-2 text-lg font-bold">
                    {title} #{id.slice(0, 8)}
                </h1>
            </div>
        </div>
    )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="bg-muted/30 p-4 rounded-3xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {icon}
                {label}
            </div>
            <p className="text-sm font-bold truncate">{value}</p>
        </div>
    )
}

