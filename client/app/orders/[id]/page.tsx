'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle2, XCircle, MessageCircle, CreditCard, PartyPopper, Bike, AlertTriangle, Lock, Loader2, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OrderRating } from '@/components/orders/order-rating'
import { OrderTracker } from '@/components/orders/order-tracker'
import { useI18n } from '@/lib/i18n/i18n-context'
import { toast } from 'sonner'

const statusMap: Record<string, number> = {
  pending: 0,
  awaiting_payment: 0.5,
  accepted: 1,
  preparing: 2,
  ready: 3,
  on_the_way: 4,
  delivered: 5,
  completed: 5,
  cancelled: -1,
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t, locale } = useI18n()
  const [order, setOrder] = useState<any>(null)
  const [existingReview, setExistingReview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancelOrder = async () => {
    setIsCancelling(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      toast.error(locale === 'ru' ? 'Ошибка при отмене' : 'Бас тарту кезінде қате шықты')
    } else {
      toast.success(locale === 'ru' ? 'Заказ отменен' : 'Тапсырыс тоқтатылды')
      setOrder((prev: any) => ({ ...prev, status: 'cancelled' }))
    }
    setIsCancelling(false)
    setShowConfirmCancel(false)
  }

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const savedPhone = localStorage.getItem('customer_phone')


      let { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants!cafe_id (*),
          order_items (
            *,
            menu_items (*)
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError || !orderData) {
        console.error('Order fetch error:', fetchError?.message || fetchError, fetchError?.details)
        // Check if phone matches as a backup if we have it
        if (savedPhone) {
          console.log('Attempting phone-based fallback...')
        }

        // If we still can't find it, redirect
        if (!orderData) {
          router.push('/orders')
          return
        }
      }

      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*')
        .eq('order_id', id)
        .maybeSingle()

      setOrder(orderData)
      setExistingReview(reviewData)
      setLoading(false)
    }

    fetchData()

    // Real-time listener for this specific order
    const supabase = createClient()
    const channel = supabase
      .channel(`order-details-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          console.log('Order update detected in parent:', payload.new.status)
          setOrder((prev: any) => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, router])

  // Confetti trigger
  useEffect(() => {
    if (order?.status === 'completed' || order?.status === 'delivered') {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [order?.status])

  if (loading || !order) {
    return (
      <div className="flex flex-col min-h-screen pb-16">
        <div className="sticky top-0 z-40 w-full border-b border-border bg-background">
          <div className="flex items-center h-14 px-4 max-w-screen-xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => router.push('/orders')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="ml-2 text-lg font-bold">
              {t.orders.order_id_label} {id.slice(0, 8)}
            </h1>
          </div>
        </div>
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="sticky top-0 z-40 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-lg">
        <div className="flex items-center h-14 px-4 max-w-screen-xl mx-auto">
          <Link href="/orders">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="ml-2 text-lg font-black tracking-tight text-white">
            {t.orders.order_id_label}{order.id.slice(0, 8)}
          </h1>
        </div>
      </div>

      <main className="flex-1 overflow-auto bg-zinc-900 pb-10">
        <div className="max-w-md mx-auto px-4 py-8">
          <Card className="overflow-hidden border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-[3rem] bg-zinc-950 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-8 relative">
              {/* Decorative Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              {/* Status Header */}
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 bg-primary/20 rounded-[2.5rem] flex items-center justify-center mb-4 text-primary animate-pulse shadow-[0_0_30px_-5px_rgba(var(--primary-rgb),0.3)]">
                   <Clock className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                  {(t.orders.status as any)[order.status] || order.status}
                </h2>
                <p className="text-sm font-medium text-zinc-400 mt-1">
                  {format(new Date(order.updated_at), 'dd MMM, HH:mm')}
                </p>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-2 gap-8 mb-10 pb-8 border-b border-dashed border-white/10">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {locale === 'ru' ? 'Номер заказа' : 'Тапсырыс номері'}
                  </p>
                  <p className="text-base font-bold text-white">#{order.id.slice(0, 8)}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {locale === 'ru' ? 'Телефон' : 'Телефон'}
                  </p>
                  <p className="text-base font-bold text-white">{order.customer_phone || '-'}</p>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {locale === 'ru' ? 'Адрес доставки' : 'Мекен-жайы'}
                  </p>
                  <p className="text-base font-bold text-white leading-snug">
                    {order.delivery_address || (locale === 'ru' ? 'Самовывоз' : 'Өзі алып кету')}
                  </p>
                </div>
              </div>

              {/* Items Section */}
              <div className="bg-white/5 rounded-[2.5rem] p-6 mb-10 border border-white/5">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{locale === 'ru' ? 'Блюдо' : 'Тамақ'}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{locale === 'ru' ? 'Сумма' : 'Бағасы'}</span>
                </div>
                <div className="space-y-4">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white leading-tight">
                          {locale === 'ru' ? (item.menu_items?.name_ru || item.name_ru) : (item.menu_items?.name_kk || item.name_kk || item.menu_items?.name_ru || item.name_ru || item.menu_items?.name)}
                        </p>
                        <p className="text-[10px] font-black text-primary/60 mt-0.5">
                          {item.quantity} × {item.price.toFixed(0)}₸
                        </p>
                      </div>
                      <p className="text-sm font-black text-white">
                        {(item.quantity * item.price).toFixed(0)}₸
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-4 mb-10">
                <div className="flex justify-between items-center px-2">
                  <p className="text-xs font-bold text-muted-foreground/60">{locale === 'ru' ? 'Доставка' : 'Жеткізу'}</p>
                  <p className="text-sm font-bold">{(order.delivery_fee || 0).toFixed(0)}₸</p>
                </div>
                <div className="flex justify-between items-center px-2">
                  <p className="text-xs font-bold text-muted-foreground/60">{locale === 'ru' ? 'Стоимость блюд' : 'Тамақ бағалары'}</p>
                  <p className="text-sm font-bold">{(order.total_amount - (order.delivery_fee || 0)).toFixed(0)}₸</p>
                </div>
                <div className="pt-6 border-t border-dashed border-white/10 flex justify-between items-end px-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary/80 mb-1">
                      {locale === 'ru' ? 'Итого' : 'Жалпы сумма'}
                    </p>
                    <p className="text-4xl font-black tracking-tighter text-white leading-none">
                      {order.total_amount.toFixed(0)}<span className="text-xl ml-1 text-zinc-500">₸</span>
                    </p>
                  </div>
                  {order.status === 'awaiting_payment' && (
                     <Badge className="bg-amber-500 text-white rounded-full px-4 py-1.5 font-black text-[10px] animate-bounce">
                        {locale === 'ru' ? 'ЖДЕТ ОПЛАТЫ' : 'ТӨЛЕМ КҮТІЛУДЕ'}
                     </Badge>
                  )}
                </div>
              </div>

              {/* Dynamic Actions Based on Status */}
              <div className="space-y-4">
                {order.status === 'awaiting_payment' && order.payment_url && (
                  <Button className="w-full bg-black text-white h-16 rounded-2xl text-base font-black shadow-xl hover:bg-zinc-800 transition-all gap-3" asChild>
                    <a href={order.payment_url} target="_blank" rel="noopener noreferrer">
                      <CreditCard className="w-5 h-5" />
                      <span>{locale === 'ru' ? 'ОПЛАТИТЬ СЕЙЧАС' : 'ҚАЗІР ТӨЛЕУ'}</span>
                    </a>
                  </Button>
                )}

                {order.status === 'on_the_way' && order.one_time_courier_phone && (
                   <Button className="w-full bg-blue-600 text-white h-16 rounded-2xl text-base font-black shadow-xl hover:bg-blue-700 transition-all gap-3" asChild>
                    <a href={`tel:${order.one_time_courier_phone}`}>
                      <Phone className="w-5 h-5" />
                      <span>{t.orders.contactCourier}</span>
                    </a>
                  </Button>
                )}

                {(order.status === 'delivered' || order.status === 'completed') && (
                  <div className="bg-emerald-500 text-white p-6 rounded-[2rem] text-center shadow-lg shadow-emerald-500/20">
                    <PartyPopper className="w-10 h-10 mx-auto mb-3 animate-bounce" />
                    <p className="font-black text-lg uppercase tracking-tight">{t.orders.deliveredToast}</p>
                    <p className="text-xs text-white/80 mt-1 font-medium">{locale === 'ru' ? 'Приятного аппетита!' : 'Ас болсын!'}</p>
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="bg-destructive/10 border-2 border-destructive/20 text-destructive p-6 rounded-[2rem] text-center">
                    <XCircle className="w-10 h-10 mx-auto mb-3" />
                    <p className="font-black text-lg uppercase tracking-tight">{t.orders.orderCancelled}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Info / Rating */}
          <div className="mt-8 space-y-4 px-2">
             {(order.status === 'delivered' || order.status === 'completed') && (
                <OrderRating
                  orderId={order.id}
                  restaurantId={order.cafe_id}
                  customerName={order.customer_name || t.common.client}
                  initialRating={existingReview?.rating}
                  initialComment={existingReview?.comment}
                />
              )}

              <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/10 shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Поддержка</p>
                    <p className="text-sm font-bold text-white">WhatsApp</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl w-12 h-12" asChild>
                  <a href={`https://wa.me/${(order.restaurants?.whatsapp_number || order.restaurants?.phone || '77771234567').replace(/[+\s-()]/g, '')}`} target="_blank">
                    <ChevronRight className="w-6 h-6" />
                  </a>
                </Button>
              </div>

              {['pending', 'awaiting_approval', 'awaiting_payment'].includes(order.status) && !showConfirmCancel && (
                <Button 
                  variant="ghost" 
                  className="w-full text-muted-foreground/40 hover:text-destructive hover:bg-transparent font-bold text-xs"
                  onClick={() => setShowConfirmCancel(true)}
                >
                  {locale === 'ru' ? 'ОТМЕНИТЬ ЗАКАЗ' : 'ТАПСЫРЫСТАН БАС ТАРТУ'}
                </Button>
              )}

              {showConfirmCancel && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-[2rem] p-6 text-center animate-in zoom-in-95 duration-300">
                   <p className="font-black text-destructive mb-4">ТОЧНО ОТМЕНИТЬ?</p>
                   <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 rounded-2xl h-12" onClick={() => setShowConfirmCancel(false)}>НЕТ</Button>
                      <Button variant="destructive" className="flex-1 rounded-2xl h-12 font-black" onClick={handleCancelOrder} disabled={isCancelling}>
                        {isCancelling ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'ДА'}
                      </Button>
                   </div>
                </div>
              )}
          </div>
        </div>
      </main>


      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ec4899'][Math.floor(Math.random() * 5)],
                width: '10px',
                height: '10px',
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 4s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}
