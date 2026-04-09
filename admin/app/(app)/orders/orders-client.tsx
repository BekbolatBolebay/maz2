'use client'

import { useState, useEffect, useRef } from 'react'
import { UtensilsCrossed, Pencil, X, Phone, MapPin, Package, Calendar, Users, CreditCard, CheckCircle2, Clock, Search, Bike, PartyPopper, Hash, ChevronRight, XCircle, Loader2, MessageCircle, Truck, ChefHat, CheckCircle, Star } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { getBulkPII } from '@/lib/vps'
import type { Order, Reservation, RestaurantTable } from '@/lib/db'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { notifyCustomerAction } from '@/lib/actions'
import { getStatusNotificationDraft, getReservationNotificationDraft } from '@/lib/notification-utils'
import { playImmediateBeep, resumeAudioContext } from '@/lib/sound-utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const OrderMap = dynamic(() => import('@/components/restaurant/order-map'), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full bg-muted animate-pulse rounded-2xl mt-3" />
})

const STATUS_TABS = ['all', 'new', 'awaiting_payment', 'accepted', 'preparing', 'ready', 'on_the_way', 'completed'] as const

const statusColors: Record<string, string> = {
  new: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 animate-pulse-slow',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  awaiting_approval: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  awaiting_payment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  accepted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  preparing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  ready: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  on_the_way: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
}

const typeColors: Record<string, string> = {
  delivery: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  pickup: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
}

const nextStatus: Record<string, string> = {
  new: 'accepted', // Will be intercepted for Kaspi
  pending: 'accepted',
  awaiting_payment: 'accepted',
  awaiting_approval: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'on_the_way',
  on_the_way: 'delivered',
}

const RESERVATION_STATUS_TABS = ['all', 'pending', 'awaiting_payment', 'confirmed', 'cancelled', 'completed'] as const
const MAIN_TABS = ['orders', 'reservations'] as const

const resStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    awaiting_payment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
}

const resStatusLabels: Record<string, { kk: string; ru: string }> = {
    pending: { kk: 'Күтуде', ru: 'Ожидает' },
    awaiting_payment: { kk: 'Төлем күтілуде', ru: 'Ожидает оплаты' },
    confirmed: { kk: 'Расталды', ru: 'Подтверждено' },
    cancelled: { kk: 'Бас тартылды', ru: 'Отменено' },
    completed: { kk: 'Аяқталды', ru: 'Завершено' },
    all: { kk: 'Барлығы', ru: 'Все' },
}

function nextActionLabel(status: string, lang: 'kk' | 'ru'): string {
  const map: Record<string, string> = {
    new: lang === 'kk' ? 'Қабылдау' : 'Принять',
    awaiting_payment: lang === 'kk' ? 'Төлемді растау' : 'Подтвердить оплату',
    accepted: lang === 'kk' ? 'Дайындауды бастау' : 'Начать готовку',
    preparing: lang === 'kk' ? 'Дайын' : 'Готово',
    ready: lang === 'kk' ? 'Курьерге беру' : 'Передать курьеру',
    on_the_way: lang === 'kk' ? 'Аяқтау' : 'Завершить',
  }
  const key = map[status]
  return key ? t(lang, key as any) : ''
}

function getStatusLabel(status: string, lang: 'kk' | 'ru'): string {
  const keys: Record<string, string> = {
    new: lang === 'kk' ? 'Жаңа' : 'Новый',
    awaiting_approval: lang === 'kk' ? 'Мақұлдау күтілуде' : 'Ожидает одобрения',
    awaiting_payment: lang === 'kk' ? 'Төлем күтілуде' : 'Ожидает оплаты',
    accepted: lang === 'kk' ? 'Қабылданды' : 'Принят',
    preparing: lang === 'kk' ? 'Дайындалуда' : 'Готовится',
    ready: lang === 'kk' ? 'Дайын' : 'Готов',
    on_the_way: lang === 'kk' ? 'Тапсырыс жолда' : 'В пути',
    completed: lang === 'kk' ? 'Аяқталды' : 'Завершен',
    cancelled: lang === 'kk' ? 'Бас тартылды' : 'Отменен',
  }
  return t(lang, keys[status] as any)
}

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ru })
  } catch { return '' }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

interface Props {
  initialOrders: Order[]
  initialReservations: Reservation[]
  restaurant: import('@/lib/db').Restaurant | null
}

type ActivityItem = Order & {
  order_num: string
  items_total: number
  activity_type: Order['type']
}

export default function OrdersClient({ initialOrders, initialReservations, restaurant }: Props) {
  const { lang } = useApp()

  // Merge initial items
  const mergeItems = (orders: Order[]): ActivityItem[] => {
    return orders.map(o => {
      // Map order items to include names
      const mappedItems = o.order_items?.map((item: any) => ({
        ...item,
        name_kk: item.name_kk || item.menu_items?.name_kk || 'Белгісіз тағам',
        name_ru: item.name_ru || item.menu_items?.name_ru || 'Неизвестное блюдо'
      }))

      return {
        ...o,
        order_num: String(o.order_number),
        items_total: o.items_count,
        activity_type: o.type,
        status: (o.status as any) === 'delivered' ? 'completed' : o.status,
        customer_name: (o as any).clients?.full_name || o.customer_name || 'Клиент',
        order_items: mappedItems,
        review: (o as any).reviews?.[0] || null // Map review if joined
      }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const [items, setItems] = useState<ActivityItem[]>(mergeItems(initialOrders))
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [activeMainTab, setActiveMainTab] = useState<typeof MAIN_TABS[number]>('orders')
  const [couriers, setCouriers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<typeof STATUS_TABS[number]>('new')
  const [activeResTab, setActiveResTab] = useState<typeof RESERVATION_STATUS_TABS[number]>('all')
  const [selected, setSelected] = useState<ActivityItem | null>(null)
  const [manualPaymentUrl, setManualPaymentUrl] = useState('')
  const [activeModal, setActiveModal] = useState<'payment' | 'prep' | 'courier' | 'tracking' | 'res_payment' | null>(null)
  const [modalItem, setModalItem] = useState<ActivityItem | null>(null)
  const [modalRes, setModalRes] = useState<Reservation | null>(null)
  const [modalValue, setModalValue] = useState('')
  const [assignMode, setAssignMode] = useState<'permanent' | 'one-time' | null>(null)
  const [oneTimeInfo, setOneTimeInfo] = useState({ name: '', phone: '' })
  const [prepTime, setPrepTime] = useState('20')
  const [mounted, setMounted] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevItemsCount = useRef(items.length)
  const soundRetryCount = useRef<Record<string, number>>({})

  // Enhanced notification sound helper with logging and retry
  const playSound = async (eventType: 'new-order' | 'reservation' = 'new-order') => {
    try {
      // Resume audio context for browser permission
      resumeAudioContext()

      console.log(
        `[Admin Sound] Playing ${eventType} notification sound`,
        {
          timestamp: new Date().toISOString(),
          audioSupported: 'Audio' in window,
        }
      )

      // Use the enhanced sound utility
      playImmediateBeep('order-alert')
    } catch (error) {
      console.error(
        `[Admin Sound] Error playing sound:`,
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  // Hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  // Notification sound logic
  useEffect(() => {
    const newItemsCount = items.filter(i => i.status === 'new').length
    const prevCount = prevItemsCount.current
    if (newItemsCount > prevCount) {
      playSound()
    }
    prevItemsCount.current = newItemsCount
  }, [items])

  // Hydration effect for VPS PII
  useEffect(() => {
    async function hydrate() {
      const orderVpsIds = items.map(o => o.customer_name).filter(id => id && id.length === 15 && !id.includes(' '))
      const resVpsIds = reservations.map(r => r.customer_name).filter(id => id && id.length === 15 && !id.includes(' '))
      const allIds = Array.from(new Set([...orderVpsIds, ...resVpsIds]))
      
      if (!allIds.length) return

      const piiData = await getBulkPII('profiles', allIds)
      if (!piiData.length) return

      const piiMap = new Map(piiData.map(p => [p.id, p]))

      setItems(prev => prev.map(o => {
        const pii = piiMap.get(o.customer_name)
        if (pii) {
          return {
            ...o,
            customer_name: pii.full_name,
            customer_phone: pii.phone,
            delivery_address: pii.address || o.delivery_address
          }
        }
        return o
      }))

      setReservations(prev => prev.map(r => {
        const pii = piiMap.get(r.customer_name)
        if (pii) {
          return {
            ...r,
            customer_name: pii.full_name,
            customer_phone: pii.phone
          }
        }
        return r
      }))
    }
    
    if (mounted && (items.length > 0 || reservations.length > 0)) {
      hydrate()
    }
  }, [mounted, items.length, reservations.length])

  // Fetch couriers & tables
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const [cRes, tRes] = await Promise.all([
        supabase.from('staff_profiles').select('*').eq('role', 'courier'),
        supabase.from('restaurant_tables').select('*').eq('cafe_id', restaurant?.id).order('table_number')
      ])
      if (cRes.data) setCouriers(cRes.data)
      if (tRes.data) setTables(tRes.data)
    }
    if (restaurant?.id) fetchData()
  }, [restaurant?.id])

  // Polling and visibility change fallback for missed realtime events
  useEffect(() => {
    if (!restaurant?.id) return;

    const fetchOrders = async () => {
      try {
        const supabase = createClient()
        // We fetch the latest 50 orders just to sync missing ones
        const { data, error } = await supabase
          .from('orders')
          .select('*, restaurants!cafe_id(*), order_items(*, menu_items(*))')
          .eq('cafe_id', restaurant.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error('[Admin Orders] Sync error:', error)
          return
        }

        if (data && data.length > 0) {
          const fetchedItems = mergeItems(data as unknown as Order[])
          setItems(prev => {
            const newArray = [...prev]
            let changed = false
            fetchedItems.forEach(fetched => {
              const idx = newArray.findIndex(i => i.id === fetched.id)
              if (idx >= 0) {
                if (newArray[idx].status !== fetched.status || newArray[idx].order_items?.length !== fetched.order_items?.length) {
                  newArray[idx] = { ...newArray[idx], ...fetched }
                  changed = true
                }
              } else {
                newArray.push(fetched)
                changed = true
              }
            })
            if (changed) {
              return newArray.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            }
            return prev
          })
        }
      } catch (e) {
        console.error('[Admin Orders] Polling error:', e)
      }
    }

    const intervalId = setInterval(fetchOrders, 30000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders()
      }
    }
    
    const handleFocus = () => {
      fetchOrders()
    }

    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [restaurant?.id])

  // Real-time subscription for Orders & Reservations
  useEffect(() => {
    if (!restaurant?.id) return

    const supabase = createClient()
    const ordersChannel = supabase
      .channel(`orders-realtime-${restaurant.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `cafe_id=eq.${restaurant.id}` }, async (payload) => {
          console.log('[Admin Orders] Real-time event:', payload.eventType, (payload.new as any)?.id || (payload.old as any)?.id)
          
          if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((o) => o.id !== (payload.old as any).id))
            return
          }

          const o = payload.new as any
          if (!o) return

          const fetchDetails = async () => {
            try {
              // Wait 1 second to allow client to insert order_items
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              // Fetch items, customer name and reviews in parallel
              const [itemsRes, clientRes, reviewsRes] = await Promise.all([
                supabase.from('order_items').select('*, menu_items(*)').eq('order_id', o.id),
                supabase.from('clients').select('full_name').eq('id', o.user_id).maybeSingle(),
                supabase.from('reviews').select('*').eq('order_id', o.id).maybeSingle()
              ])

              const mappedItems = itemsRes.data?.map((item: any) => ({
                ...item,
                name_kk: item.menu_items?.name_kk || item.name_kk || 'Белгісіз тағам',
                name_ru: item.menu_items?.name_ru || item.name_ru || 'Неизвестное блюдо'
              }))

              const newItem = { 
                ...o, 
                order_num: String(o.order_number), 
                items_total: o.items_count, 
                activity_type: o.type, 
                status: o.status === 'delivered' ? 'completed' : o.status,
                order_items: mappedItems || [],
                customer_name: clientRes.data?.full_name || o.customer_name || 'Клиент',
                review: reviewsRes.data || null
              }
              
              setItems((prev) => {
                const exists = prev.find(item => item.id === o.id)
                if (exists) {
                  return prev.map(item => item.id === o.id ? { ...item, ...newItem } : item)
                }
                return [newItem, ...prev]
              })
              
              if (payload.eventType === 'INSERT') {
                await playSound('new-order')
                toast.success(lang === 'kk' ? 'Жаңа тапсырыс!' : 'Новый заказ!')
              }
            } catch (error) {
              console.error('[Admin Orders] Error processing real-time order:', error)
            }
          }
          fetchDetails()
      }).subscribe()

    const resChannel = supabase
        .channel(`reservations-realtime-${restaurant.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `cafe_id=eq.${restaurant.id}` }, (payload) => {
            if (payload.eventType === 'INSERT') {
                console.log('[Admin Orders] New reservation received:', { reservationId: payload.new.id })
                
                setReservations(prev => {
                  const updated = [payload.new as Reservation, ...prev]
                  console.log('[Admin Orders] Updated reservations list', { newCount: updated.length })
                  return updated
                })
                
                // Play sound for new reservation
                console.log('[Admin Orders] Triggering sound for new reservation')
                playSound('reservation')
                
                // Show toast notification
                toast.info(lang === 'kk' ? 'Жаңа брондау келді!' : 'Новое бронирование!')
            } else if (payload.eventType === 'UPDATE') {
                setReservations(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...(payload.new as Reservation) } : r))
            } else if (payload.eventType === 'DELETE') {
                setReservations(prev => prev.filter(r => r.id !== payload.old.id))
            }
        }).subscribe()

    return () => { 
        console.log('[Admin Orders] Unsubscribing from real-time channels')
        supabase.removeChannel(ordersChannel)
        supabase.removeChannel(resChannel)
    }
  }, [lang, restaurant?.id])


  const tabCounts: Record<string, number> = {}
  STATUS_TABS.forEach((s) => {
    const visibleItems = items.filter(o => {
      // Hide unpaid Freedom Pay orders ONLY from the 'new' tab to prevent clutter, but show them everywhere else
      if (s === 'new' && o.payment_method === 'freedom' && o.payment_status !== 'paid' && o.status !== 'cancelled') {
        return false
      }
      return true
    })
    tabCounts[s] = s === 'all' ? visibleItems.length : visibleItems.filter((o) => o.status === s).length
  })

  const filtered = (activeTab === 'all' ? items : items.filter((o) => o.status === activeTab)).filter(o => {
    // Hide unpaid Freedom Pay orders ONLY from the 'new' tab
    if (activeTab === 'new' && o.payment_method === 'freedom' && o.payment_status !== 'paid' && o.status !== 'cancelled') {
      return false
    }
    return true
  })

  async function updateStatus(item: ActivityItem, newStatus: string, value?: string) {
    const supabase = createClient()

    const updates: any = { status: newStatus, updated_at: new Date().toISOString() }

    // Add estimated_ready_at if status becomes preparing
    if (newStatus === 'preparing') {
      const minutes = parseInt(value || prepTime) || 20
      const readyAt = new Date()
      readyAt.setMinutes(readyAt.getMinutes() + minutes)
      updates.estimated_ready_at = readyAt.toISOString()
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', item.id)

    if (error) {
      toast.error(t(lang, 'error'))
    } else {
      setItems((prev) => prev.map((o) => o.id === item.id ? { ...o, status: (newStatus as any) === 'delivered' ? 'completed' : newStatus as any } : o))
      if (selected?.id === item.id) setSelected({ ...selected, status: (newStatus as any) === 'delivered' ? 'completed' : newStatus as any })
      setActiveModal(null)
      setModalItem(null)

      // Send Push Notification to Customer
      if (item.user_id) {
        const draft = getStatusNotificationDraft(newStatus, item.order_num, lang)
        if (draft) {
          notifyCustomerAction(item.user_id!, {
            title: draft.title,
            body: draft.body,
            url: `/orders/${item.id}`
          })
        }
      }
    }
  }

  function sendWhatsAppUpdate(item: ActivityItem) {

    const phone = item.customer_phone.replace(/[^\d+]/g, '')
    const orderId = item.id.slice(0, 8)
    const trackingUrl = `${window.location.origin}/orders/${item.id}`

    let message = ''
    if (lang === 'kk') {
      if (item.status === 'accepted') message = `Сіздің #${orderId} тапсырысыңыз қабылданды! Сәлден соң дайындауды бастаймыз. Тапсырыс күйін мына жерден бақылаңыз: ${trackingUrl}`
      else if (item.status === 'preparing') message = `Аспаз сіздің #${orderId} тапсырысыңызды дайындап жатыр! Тапсырыс күйін мына жерден бақылаңыз: ${trackingUrl}`
      else if (item.status === 'on_the_way') message = `Курьер сіздің #${orderId} тапсырысыңызбен шықты! Тапсырыс күйін мына жерден бақылаңыз: ${trackingUrl}`
      else if (item.status === 'ready') message = `Сіздің #${orderId} тапсырысыңыз дайын! Тапсырыс күйін мына жерден бақылаңыз: ${trackingUrl}`
      else if (item.status === 'completed') message = `Асыңыз дәмді болсын! #${orderId} тапсырысы орындалды. Бізді бағалауды ұмытпаңыз: ${trackingUrl}`
      else message = `Тапсырыс #${orderId} бойынша жаңарту! Мына жерден көріңіз: ${trackingUrl}`
    } else {
      if (item.status === 'accepted') message = `Ваш заказ #${orderId} принят! Скоро начнем готовить. Отслеживайте статус здесь: ${trackingUrl}`
      else if (item.status === 'preparing') message = `Шеф-повар уже готовит ваш заказ #${orderId}! Отслеживайте статус здесь: ${trackingUrl}`
      else if (item.status === 'on_the_way') message = `Курьер выехал с вашим заказом #${orderId}! Отслеживайте статус здесь: ${trackingUrl}`
      else if (item.status === 'ready') message = `Ваш заказ #${orderId} готов! Отслеживайте статус здесь: ${trackingUrl}`
      else if (item.status === 'completed') message = `Приятного аппетита! Заказ #${orderId} выполнен. Не забудьте оценить нас: ${trackingUrl}`
      else message = `Обновление по заказу #${orderId}! Посмотрите здесь: ${trackingUrl}`
    }

    const waUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  async function confirmPayment(item: ActivityItem) {
    const supabase = createClient()

    const updates: any = {
      payment_status: 'paid',
      status: 'accepted',
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', item.id)

    if (error) {
      toast.error(t(lang, 'error'))
    } else {
      toast.success(lang === 'kk' ? 'Төлем расталды!' : 'Оплата подтверждена!')
      const updated = { ...item, payment_status: 'paid', status: updates.status } as ActivityItem
      setItems((prev) => prev.map((o) => o.id === item.id ? updated : o))
      if (selected?.id === item.id) setSelected(updated)

      // Send Push Notification to Customer for Payment Confirmation
      if (item.user_id) {
        const draft = getStatusNotificationDraft(updates.status, item.order_num, lang)
        if (draft) {
          notifyCustomerAction(item.user_id!, {
            title: draft.title,
            body: draft.body,
            url: `/orders/${item.id}`
          })
        }
      }
    }
  }

  async function sendPaymentLink(item: ActivityItem, url: string) {
    if (!url) {
      toast.error(lang === 'kk' ? 'Сілтемені енгізіңіз' : 'Введите ссылку')
      return
    }
    const supabase = createClient()
    const updates: any = {
      payment_url: url,
      status: 'awaiting_payment',
      updated_at: new Date().toISOString()
    }

    // Add estimated ready at if provided
    const minutes = parseInt(prepTime) || 20
    const readyAt = new Date()
    readyAt.setMinutes(readyAt.getMinutes() + minutes)
    updates.estimated_ready_at = readyAt.toISOString()

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', item.id)

    if (error) {
      toast.error(t(lang, 'error'))
    } else {
      toast.success(lang === 'kk' ? 'Сілтеме жіберілді!' : 'Ссылка отправлена!')
      setManualPaymentUrl('')
      setActiveModal(null)
      setModalItem(null)
      // Update local state to reflect the change immediately
      const updated = { ...item, status: 'awaiting_payment', payment_url: url } as any
      setSelected(null)
      setItems(prev => prev.map(i => i.id === item.id ? updated : i))
    }
  }

  // Reservation Handlers
  async function handleResStatus(id: string, status: string) {
    setUpdating(id)
    const supabase = createClient()
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
    if (error) {
        toast.error(lang === 'kk' ? 'Қате кетті' : 'Произошла ошибка')
    } else {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r))
        toast.success(lang === 'kk' ? 'Статус жаңартылды' : 'Статус обновлён')

        // Send Push Notification
        const res = reservations.find(r => r.id === id)
        if (res?.customer_id) {
            const draft = getReservationNotificationDraft(status, res.date, res.time.slice(0, 5), lang)
            if (draft) {
                notifyCustomerAction(res.customer_id, {
                    title: draft.title,
                    body: draft.body,
                    url: `/orders?tab=bookings`
                })
            }
        }
    }
    setUpdating(null)
  }

  async function handleResPaymentStatus(id: string, currentStatus: string, url?: string) {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid'
    setUpdating(id)
    const supabase = createClient()
    const update: any = { payment_status: newStatus }
    if (url) {
        update.payment_url = url
        update.status = 'awaiting_payment'
    }
    const { error } = await supabase.from('reservations').update(update).eq('id', id)
    if (error) {
        toast.error(lang === 'kk' ? 'Қате кетті' : 'Произошла ошибка')
    } else {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, payment_status: newStatus as any, status: url ? 'awaiting_payment' as any : r.status, payment_url: url || r.payment_url } : r))
        toast.success(lang === 'kk' ? 'Төлем статусы жаңартылды' : 'Статус оплаты обновлён')

        // Send Push Notification if payment requested
        const res = reservations.find(r => r.id === id)
        if (res?.customer_id && url) {
            const draft = getReservationNotificationDraft('awaiting_payment', res.date, res.time.slice(0, 5), lang)
            if (draft) {
                notifyCustomerAction(res.customer_id, {
                    title: draft.title,
                    body: draft.body,
                    url: `/orders?tab=bookings`
                })
            }
        }
        setActiveModal(null)
        setModalRes(null)
    }
    setUpdating(null)
  }

  async function assignCourier(item: ActivityItem, courierId?: string, oneTime?: { name: string, phone: string }) {
    const supabase = createClient()
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    const updates: any = {
      status: 'on_the_way',
      updated_at: new Date().toISOString(),
      courier_tracking_token: token
    }

    if (courierId) {
      updates.courier_id = courierId
    } else if (oneTime) {
      updates.one_time_courier_name = oneTime.name
      updates.one_time_courier_phone = oneTime.phone
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', item.id)

    if (error) {
      toast.error(t(lang, 'error'))
    } else {
      toast.success(lang === 'kk' ? 'Курьер бекітілді!' : 'Курьер назначен!')
      if (oneTime) {
        // const trackingUrl = `${window.location.origin}/courier/track/${token}`
        // const msg = lang === 'kk'
        //   ? `Тапсырыс #${item.order_num} жеткізу сілтемесі: ${trackingUrl}`
        //   : `Ссылка на доставку заказа #${item.order_num}: ${trackingUrl}`
        // window.open(`https://wa.me/${oneTime.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
      }

      // Update local state
      const updatedItem = { ...item, ...updates } as any
      setItems(prev => prev.map(o => o.id === item.id ? updatedItem : o))
      if (selected?.id === item.id) setSelected(updatedItem)

      setAssignMode(null)
      setActiveModal(null)
      setModalItem(null)
    }
  }


  const sendKaspiLink = (item: ActivityItem | Reservation, isReservation = false) => {
    if (!restaurant?.kaspi_link) {
      toast.error(lang === 'kk' ? 'Профильде Kaspi сілтемесін көрсетіңіз' : 'Укажите Kaspi ссылку в профиле')
      return
    }

    const amount = isReservation ? (item as Reservation).total_amount : (item as ActivityItem).total_amount
    const idDisplay = isReservation ? (item as Reservation).customer_name : `#${(item as ActivityItem).order_num}`

    const message = isReservation
      ? (lang === 'kk'
        ? `Сәлеметсіз бе! Мазир арқылы жасаған брондауыңыз қабылданды. Төлем сомасы: ${amount} ₸.\nТөлем сілтемесі: ${restaurant.kaspi_link}`
        : `Здравствуйте! Ваше бронирование через Mazir принято. Сумма к оплате: ${amount} ₸.\nСсылка на оплату: ${restaurant.kaspi_link}`)
      : (lang === 'kk'
        ? `Сәлеметсіз бе! Мазир арқылы берген ${idDisplay} тапсырысыңыз қабылданды. Төлем сомасы: ${amount} ₸.\nТөлем сілтемесі: ${restaurant.kaspi_link}`
        : `Здравствуйте! Ваш заказ ${idDisplay} через Mazir принят. Сумма к оплате: ${amount} ₸.\nСсылка на оплату: ${restaurant.kaspi_link}`)

    const phone = item.customer_phone
    if (!phone) {
      toast.error(lang === 'kk' ? 'Телефон нөмірі табылмады' : 'Номер телефона не найден')
      return
    }
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const tabLabels: Record<string, any> = {
    all: lang === 'kk' ? 'Барлығы' : 'Все',
    new: 'newOrders', 
    pending: 'statusNew', 
    awaiting_approval: 'awaiting_approval', 
    awaiting_payment: 'statusAwaitingPayment', 
    accepted: 'statusAccepted', 
    preparing: 'statusPreparing',
    ready: 'statusReady', 
    on_the_way: 'statusOnTheWay', 
    completed: 'statusCompleted',
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Hidden audio for notifications */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Header */}
      <div className="bg-card px-4 pt-4 md:pt-12 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <UtensilsCrossed className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            {lang === 'kk'
              ? (restaurant?.name_kk || 'Мәзір')
              : (restaurant?.name_ru || 'Меню')}
          </h1>
          <button
            onClick={() => { playSound() }}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors"
            title="Дыбысты тексеру"
          >
            <span className="text-xs">🔔</span>
          </button>
        </div>

        {/* Main tabs */}
        <div className="flex gap-4 mb-4">
            {MAIN_TABS.map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveMainTab(tab)}
                    className={cn(
                        'pb-2 text-sm font-bold border-b-2 transition-all',
                        activeMainTab === tab
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground'
                    )}
                >
                    {tab === 'orders' ? (lang === 'kk' ? 'Тапсырыстар' : 'Заказы') : (lang === 'kk' ? 'Брондаулар' : 'Бронирования')}
                </button>
            ))}
        </div>

        {activeMainTab === 'orders' ? (
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_TABS.map((s) => (
                <button
                key={s}
                onClick={() => setActiveTab(s)}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0',
                    activeTab === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
                >
                {s === 'all' ? (lang === 'kk' ? 'Барлығы' : 'Все') : t(lang, tabLabels[s])}
                {tabCounts[s] > 0 && (
                    <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                    activeTab === s ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    )}>
                    {tabCounts[s]}
                    </span>
                )}
                </button>
            ))}
            </div>
        ) : (
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {RESERVATION_STATUS_TABS.map((s) => (
                <button
                    key={s}
                    onClick={() => setActiveResTab(s)}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0',
                        activeResTab === s
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                >
                    {resStatusLabels[s][lang]}
                    {s !== 'all' && (
                        <span className="ml-1 opacity-70">
                            ({reservations.filter(r => r.status === s).length})
                        </span>
                    )}
                </button>
            ))}
            </div>
        )}
      </div>
      {/* List Container */}
      <div className="flex-1 px-4 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeMainTab === 'orders' ? (
            filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 col-span-full">
                <Package className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t(lang, 'noData')}</p>
            </div>
            ) : (
            filtered.map((item) => (
                <Card
              key={`o-${item.id}`}
              className={cn(
                "overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2.5rem] bg-card",
                item.status === 'new' && "ring-2 ring-primary/20 animate-in zoom-in-95"
              )}
            >
              <CardContent className="p-7">
                {/* Header: ID and Edit */}
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                      #{item.activity_type === 'delivery' ? (lang === 'kk' ? 'Жеткізу' : 'Доставка') : (lang === 'kk' ? 'Өзі алып кету' : 'Самовывоз')}
                    </p>
                    <h3 className="text-lg font-black tracking-tight">#{item.order_num}</h3>
                  </div>
                  <button
                    onClick={() => setSelected(item)}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{lang === 'kk' ? 'Клиент' : 'Клиент'}</p>
                    <p className="text-sm font-bold truncate">{item.customer_name || '—'}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{lang === 'kk' ? 'Телефон' : 'Телефон'}</p>
                    <p className="text-sm font-bold">{item.customer_phone || '—'}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-6">
                   <div className={cn(
                     "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm",
                     statusColors[item.status]
                   )}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {getStatusLabel(item.status, lang)}
                   </div>
                </div>

                {/* Items Container */}
                <div className="bg-secondary/40 rounded-[2rem] p-5 mb-6 border border-secondary">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-secondary-foreground/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <span>{lang === 'kk' ? 'Тағам' : 'Блюдо'}</span>
                    <span>{lang === 'kk' ? 'Саны' : 'Кол-во'}</span>
                  </div>
                  <div className="space-y-2.5">
                    {item.order_items?.slice(0, 3).map((oi: any) => (
                      <div key={oi.id} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground/80 truncate pr-4">{lang === 'kk' ? oi.name_kk : oi.name_ru}</span>
                        <span className="font-black text-primary/60">×{oi.quantity}</span>
                      </div>
                    ))}
                    {item.order_items && item.order_items.length > 3 && (
                      <p className="text-[10px] text-center font-bold text-muted-foreground pt-1">
                        + {item.order_items.length - 3} {lang === 'kk' ? 'басқа' : 'других'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-between items-end mb-6 px-1">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{lang === 'kk' ? 'Жиыны' : 'Итого'}</p>
                    <p className="text-2xl font-black tracking-tight">{Number(item.total_amount).toLocaleString()}₸</p>
                  </div>
                  <button
                    onClick={() => sendWhatsAppUpdate(item)}
                    className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                </div>

                {/* Admin Actions */}
                <div className="space-y-3">
                  {item.payment_method === 'kaspi' && item.status === 'new' && (
                    <button
                      onClick={() => {
                        setModalItem(item)
                        setActiveModal('payment')
                        setModalValue((item as Order).payment_url || '')
                      }}
                      className="w-full bg-black text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      {lang === 'kk' ? 'Сілтеме жіберу' : 'Отправить ссылку'}
                    </button>
                  )}

                  {(item.payment_method === 'kaspi' || (item.payment_method === 'freedom' && item.payment_status !== 'paid')) && item.status === 'awaiting_payment' && (
                    <button
                      onClick={() => confirmPayment(item)}
                      className="w-full bg-emerald-600 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {lang === 'kk' ? 'Төлемді растау' : 'Подтвердить платёж'}
                    </button>
                  )}

                  {nextStatus[item.status] && (item.payment_method !== 'kaspi' || !['new', 'awaiting_payment'].includes(item.status)) && (
                    <button
                      onClick={() => {
                        const ns = nextStatus[item.status]
                        if (ns === 'preparing') {
                          setModalItem(item)
                          setActiveModal('prep')
                          setModalValue('20')
                        } else if (ns === 'on_the_way') {
                          setModalItem(item)
                          setActiveModal('courier')
                          setAssignMode('permanent')
                        } else {
                          updateStatus(item, ns)
                        }
                      }}
                      className="w-full bg-black text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      {nextActionLabel(item.status, lang)}
                    </button>
                  )}

                  {item.status === 'on_the_way' && item.courier_tracking_token && (
                    <button
                      onClick={() => {
                        setModalItem(item)
                        setActiveModal('tracking')
                      }}
                      className="w-full border-2 border-black rounded-2xl py-4 text-xs font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      {lang === 'kk' ? 'Бақылау коды' : 'Код отслеживания'}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
            ))
          )
        ) : (
            // Reservations List
            (activeResTab === 'all' ? reservations : reservations.filter(r => r.status === activeResTab)).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 col-span-full">
                    <Calendar className="w-12 h-12 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{lang === 'kk' ? 'Брондаулар жоқ' : 'Бронирований нет'}</p>
                </div>
            ) : (
                (activeResTab === 'all' ? reservations : reservations.filter(r => r.status === activeResTab)).map(res => (
                    <Card key={res.id} className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2.5rem] bg-card">
                        <CardContent className="p-7">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                                        {lang === 'kk' ? 'Брондау' : 'Бронирование'}
                                    </p>
                                    <h3 className="text-lg font-black tracking-tight">{res.customer_name}</h3>
                                </div>
                                <div className={cn('text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest', resStatusColors[res.status])}>
                                    {resStatusLabels[res.status]?.[lang]}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{lang === 'kk' ? 'Уақыты' : 'Время'}</p>
                                    <p className="text-sm font-bold truncate">{res.date} • {res.time?.slice(0, 5)}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{lang === 'kk' ? 'Қонақтар' : 'Гости'}</p>
                                    <div className="flex items-center justify-end gap-1.5 text-sm font-bold">
                                        <Users className="w-4 h-4" />
                                        {res.guests_count}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <a href={`tel:${res.customer_phone}`} className="flex items-center gap-2 text-primary text-sm font-bold">
                                    <Phone className="w-4 h-4" />
                                    {res.customer_phone}
                                </a>
                                {res.table_id && (
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
                                        <Hash className="w-4 h-4" />
                                        №{tables.find(t => t.id === res.table_id)?.table_number || '?'} үстел
                                    </div>
                                )}
                            </div>

                            {((res.reservation_items && res.reservation_items.length > 0) || (res.booking_fee && res.booking_fee > 0)) && (
                                <div className="bg-secondary/40 rounded-[2rem] p-5 mb-6 border border-secondary text-xs">
                                     <div className="flex items-center gap-1.5 font-black uppercase tracking-widest text-muted-foreground/40 mb-3">
                                        <ChefHat className="w-3.5 h-3.5" />
                                        {lang === 'kk' ? 'Брондау мәліметтері' : 'Детали бронирования'}
                                    </div>
                                    <div className="space-y-2">
                                        {res.reservation_items?.map(item => (
                                            <div key={item.id} className="flex justify-between items-center">
                                                <span className="font-bold text-foreground/80 truncate pr-4">{lang === 'kk' ? (item as any).name_kk : (item as any).name_ru}</span>
                                                <span className="font-black text-primary/60">×{item.quantity}</span>
                                            </div>
                                        ))}
                                        {res.booking_fee && res.booking_fee > 0 && (
                                            <div className="flex justify-between items-center text-primary/80 font-bold">
                                                <span>{t(lang, 'bookingFee')}</span>
                                                <span>{res.booking_fee.toLocaleString()}₸</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm font-black border-t border-secondary-foreground/5 pt-3 mt-1 text-primary">
                                            <span>{lang === 'kk' ? 'Жиыны' : 'Итого'}</span>
                                            <span>{res.total_amount.toLocaleString()}₸</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {res.notes && (
                                <p className="text-xs text-muted-foreground italic mb-6">"{res.notes}"</p>
                            )}

                            <div className="space-y-3">
                                {res.payment_method === 'kaspi' && res.status === 'pending' && (
                                    <button
                                        onClick={() => {
                                            sendKaspiLink(res, true)
                                            handleResStatus(res.id, 'awaiting_payment')
                                        }}
                                        className="w-full bg-black text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mb-3"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        {lang === 'kk' ? 'Kaspi сілтемесін жіберу' : 'Отправить Kaspi ссылку'}
                                    </button>
                                )}

                                {res.payment_status === 'pending' && res.status !== 'cancelled' && (
                                    <button
                                        onClick={() => handleResPaymentStatus(res.id, res.payment_status || 'pending')}
                                        disabled={updating === res.id}
                                        className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl active:scale-95 transition-all"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {lang === 'kk' ? 'Төлемді растау' : 'Подтвердить оплату'}
                                    </button>
                                )}

                                {res.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleResStatus(res.id, 'confirmed')}
                                            disabled={updating === res.id}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl active:scale-95 transition-all"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {lang === 'kk' ? 'Растау' : 'Подтвердить'}
                                        </button>
                                        <button
                                            onClick={() => handleResStatus(res.id, 'cancelled')}
                                            disabled={updating === res.id}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-all"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            {lang === 'kk' ? 'Бас тарту' : 'Отменить'}
                                        </button>
                                    </div>
                                )}

                                {res.status === 'confirmed' && (
                                    <button
                                        onClick={() => handleResStatus(res.id, 'completed')}
                                        disabled={updating === res.id}
                                        className="w-full flex items-center justify-center gap-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl active:scale-95 transition-all"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        {lang === 'kk' ? 'Аяқтау' : 'Завершить'}
                                    </button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))
            )
        )}
      </div>

      {/* Order detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-card rounded-t-[3rem] p-5 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-500 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber */}
            <div className="mx-auto w-12 h-1.5 bg-secondary rounded-full -mt-2 mb-4 opacity-50" />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                  {lang === 'kk' ? 'Тапсырыс мәліметтері' : 'Детали заказа'}
                </p>
                <h2 className="text-2xl font-black tracking-tight">#{selected.order_num}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex flex-wrap gap-3">
                <div className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm",
                  statusColors[selected.status]
                )}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {getStatusLabel(selected.status, lang)}
                </div>
                <div className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm",
                  typeColors[selected.activity_type]
                )}>
                  {selected.type === 'delivery' ? <Truck className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                  {selected.type === 'delivery' ? (lang === 'kk' ? 'Жеткізу' : 'Доставка') : (lang === 'kk' ? 'Өзі алып кету' : 'Самовывоз')}
                </div>
                {selected.payment_status && (
                  <div className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm',
                    (selected as Order).payment_status === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30'
                  )}>
                    {(selected as Order).payment_status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {(selected as Order).payment_status === 'paid'
                      ? (lang === 'kk' ? 'Төленді' : 'Оплачено')
                      : (lang === 'kk' ? 'Күтілуде' : 'Ожидание')}
                  </div>
                )}
              </div>

              {/* Customer Info Section */}
              <div className="bg-secondary/40 rounded-[2.5rem] p-6 space-y-4 border border-secondary shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-xl font-black text-white shadow-lg ring-4 ring-white dark:ring-slate-900">
                    {selected.customer_name?.[0] || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{lang === 'kk' ? 'Клиент' : 'Клиент'}</p>
                    <p className="text-lg font-black text-foreground truncate">{selected.customer_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2">
                  <div className="flex items-center gap-3 group border-b border-secondary pb-2">
                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 flex justify-between items-center pr-2">
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{lang === 'kk' ? 'Телефон' : 'Телефон'}</p>
                        <p className="text-sm font-black">{selected.customer_phone || '—'}</p>
                      </div>
                      <button
                        onClick={() => sendWhatsAppUpdate(selected)}
                        className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg active:scale-95"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {selected.delivery_address && (
                    <div className="flex items-start gap-3 group">
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{lang === 'kk' ? 'Мекен-жай' : 'Адрес'}</p>
                        <p className="text-sm font-black leading-tight">{selected.delivery_address}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selected.latitude && selected.longitude && (
                  <div className="rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-md">
                    <OrderMap
                      latitude={selected.latitude!}
                      longitude={selected.longitude!}
                      customerName={selected.customer_name}
                      address={selected.delivery_address || undefined}
                    />
                  </div>
                )}

                {selected.notes && (
                  <div className="pt-2 border-t border-secondary-foreground/5 space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                      {lang === 'kk' ? 'Ескерту' : 'Комментарий'}
                    </p>
                    <p className="text-sm font-medium italic opacity-80">"{selected.notes}"</p>
                  </div>
                )}
              </div>

              {/* Items Summary */}
              <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-secondary shadow-sm overflow-hidden">
                <div className="bg-secondary/40 px-6 py-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>{lang === 'kk' ? 'Тапсырыс құрамы' : 'Состав заказа'}</span>
                  <span>{selected.order_items?.length || 0} {lang === 'kk' ? 'позиция' : 'позиций'}</span>
                </div>
                <div className="p-6 space-y-4">
                  {selected.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center group">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-black text-sm text-foreground leading-tight group-hover:text-primary transition-colors">
                          {lang === 'kk' ? item.name_kk : item.name_ru}
                        </p>
                        <p className="text-[10px] font-black text-muted-foreground/60 mt-0.5 tracking-widest uppercase">
                          {item.quantity} × {item.price.toLocaleString()}₸
                        </p>
                      </div>
                      <p className="font-black text-base text-foreground tabular-nums">
                        {(item.quantity * item.price).toLocaleString()}₸
                      </p>
                    </div>
                  ))}
                  {selected.booking_fee && selected.booking_fee > 0 && (
                    <div className="flex justify-between items-center text-primary/80 font-bold mb-2">
                      <span>{lang === 'kk' ? 'Брондау ақысы' : 'Сбор за бронирование'}</span>
                      <span>{selected.booking_fee.toLocaleString()}₸</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-dashed border-secondary-foreground/10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{lang === 'kk' ? 'Жиыны' : 'Итоговая сумма'}</p>
                      <p className="text-3xl font-black tracking-tighter text-primary tabular-nums">
                        {Number(selected.total_amount).toLocaleString()}₸
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Section */}
              {((selected as any).review || (selected as any).rating) && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-[2.5rem] border border-yellow-200 dark:border-yellow-800/50 p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest leading-none">
                      {lang === 'kk' ? 'Клиент пікірі' : 'Отзыв клиента'}
                    </p>
                    <div className="flex bg-yellow-500 text-white px-2 py-0.5 rounded-lg items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-black">{(selected as any).review?.rating || (selected as any).rating}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium italic text-yellow-900 dark:text-yellow-200/80">
                    "{(selected as any).review?.comment || (selected as any).comment || (lang === 'kk' ? 'Пікірсіз' : 'Без комментария')}"
                  </p>
                </div>
              )}

              {/* Action Buttons Section */}
              <div className="space-y-3 pt-2">
                {/* Manual Payment Group */}
                {selected.payment_method === 'kaspi' && selected.status === 'awaiting_payment' && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] p-4 border border-emerald-200 dark:border-emerald-800 space-y-3 shadow-lg shadow-emerald-500/5">
                    <button
                      onClick={() => confirmPayment(selected)}
                      className="w-full bg-emerald-600 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {lang === 'kk' ? 'Төлемді растау' : 'Подтвердить платёж'}
                    </button>
                    <button
                      onClick={() => {
                        setModalItem(selected)
                        setActiveModal('payment')
                        setModalValue((selected as Order).payment_url || '')
                      }}
                      className="w-full bg-white dark:bg-slate-800 text-foreground border border-emerald-200 dark:border-emerald-800 rounded-xl py-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      {lang === 'kk' ? 'Сілтемені жаңарту' : 'Обновить ссылку'}
                    </button>
                  </div>
                )}

                {/* Main Action Transition */}
                {nextStatus[selected.status] && (selected.payment_method !== 'kaspi' || !['new', 'awaiting_payment'].includes(selected.status)) && (
                  <button
                    onClick={() => {
                      const ns = nextStatus[selected.status]
                      if (ns === 'preparing') {
                        setModalItem(selected)
                        setActiveModal('prep')
                        setModalValue('20')
                      } else if (ns === 'on_the_way') {
                        setModalItem(selected)
                        setActiveModal('courier')
                        setAssignMode('permanent')
                      } else {
                        updateStatus(selected, ns)
                      }
                    }}
                    disabled={selected.status === 'ready'}
                    className={cn(
                      "w-full rounded-2xl py-5 text-sm font-black uppercase tracking-widest transition-all shadow-xl",
                      (selected.status === 'ready')
                        ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                        : "bg-black text-white hover:bg-slate-800 active:scale-95"
                    )}
                  >
                    {nextActionLabel(selected.status, lang)}
                    {(selected.status === 'ready') && ` (${lang === 'kk' ? 'курьер күтілуде' : 'ждите курьера'})`}
                  </button>
                )}

                 {/* Cancel & Other Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {selected.status === 'on_the_way' && selected.courier_tracking_token && (
                    <button
                      onClick={() => {
                        setModalItem(selected)
                        setActiveModal('tracking')
                      }}
                      className="bg-secondary text-foreground rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Search className="w-3.5 h-3.5" />
                      {lang === 'kk' ? 'Код' : 'Код'}
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(selected, 'cancelled')}
                    className={cn(
                      "bg-rose-50 text-rose-600 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-rose-100",
                      selected.status !== 'on_the_way' && "col-span-2"
                    )}
                  >
                    {t(lang, 'cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal Overlays */}
      {activeModal && modalItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-sm bg-card rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center shadow-inner",
                activeModal === 'payment' ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"
              )}>
                {activeModal === 'payment' ? <CreditCard className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">
                  {activeModal === 'payment'
                    ? (lang === 'kk' ? 'Төлем сілтемесі' : 'Ссылка для оплаты')
                    : (lang === 'kk' ? 'Дайындалу уақыты' : 'Время приготовления')}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeModal === 'payment'
                    ? (lang === 'kk' ? 'Kaspi төлем сілтемесін енгізіңіз' : 'Введите ссылку Kaspi для оплаты')
                    : (lang === 'kk' ? 'Тапсырыс канша минутта дайын болады?' : 'Сколько минут займет приготовление?')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type={activeModal === 'prep' ? 'number' : 'text'}
                placeholder={activeModal === 'prep' ? '20' : 'https://kaspi.kz/...'}
                className="w-full bg-secondary border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all text-center"
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 bg-secondary text-foreground rounded-2xl py-4 text-sm font-bold active:scale-95 transition-all"
                >
                  {t(lang, 'cancel')}
                </button>
                <button
                  onClick={() => {
                    if (activeModal === 'payment') {
                      sendPaymentLink(modalItem, modalValue)
                    } else if (activeModal === 'prep') {
                      updateStatus(modalItem, nextStatus[modalItem.status], modalValue)
                    }
                  }}
                  className={cn(
                    "flex-[2] text-white rounded-2xl py-4 text-sm font-black active:scale-95 transition-all shadow-lg",
                    activeModal === 'payment' ? "bg-blue-600 shadow-blue-500/20" : "bg-primary shadow-primary/20"
                  )}
                >
                  {lang === 'kk' ? 'Жіберу' : 'Отправить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courier Assignment Modal */}
      {activeModal === 'courier' && modalItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-sm bg-card rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <Bike className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">
                  {lang === 'kk' ? 'Курьер таңдау' : 'Выбор курьера'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === 'kk' ? 'Тапсырысты кім жеткізеді?' : 'Кто доставит заказ?'}
                </p>
              </div>
            </div>

            <div className="flex bg-secondary p-1 rounded-2xl">
              <button
                onClick={() => setAssignMode('permanent')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all",
                  assignMode === 'permanent' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {lang === 'kk' ? 'Тұрақты' : 'Постоянный'}
              </button>
              <button
                onClick={() => setAssignMode('one-time')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all",
                  assignMode === 'one-time' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {lang === 'kk' ? 'Бір реттік' : 'Разовый'}
              </button>
            </div>

            {assignMode === 'permanent' ? (
              <div className="space-y-4">
                <select
                  className="w-full bg-secondary border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all appearance-none"
                  onChange={(e) => assignCourier(modalItem, e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>{lang === 'kk' ? 'Курьерді таңдаңыз' : 'Выберите курьера'}</option>
                  {couriers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
                  ))}
                </select>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full bg-secondary/50 text-muted-foreground rounded-2xl py-4 text-sm font-bold active:scale-95 transition-all"
                >
                  {t(lang, 'cancel')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder={lang === 'kk' ? 'Курьер аты' : 'Имя курьера'}
                  className="w-full bg-secondary border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                  value={oneTimeInfo.name}
                  onChange={(e) => setOneTimeInfo(prev => ({ ...prev, name: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder={lang === 'kk' ? 'Телефон нөмірі' : 'Номер телефона'}
                  className="w-full bg-secondary border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                  value={oneTimeInfo.phone}
                  onChange={(e) => setOneTimeInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="flex-1 bg-secondary text-foreground rounded-2xl py-4 text-sm font-bold active:scale-95 transition-all"
                  >
                    {t(lang, 'cancel')}
                  </button>
                  <button
                    onClick={() => assignCourier(modalItem, undefined, oneTimeInfo)}
                    className="flex-[2] bg-primary text-secondary-foreground rounded-2xl py-4 text-sm font-black active:scale-95 transition-all shadow-lg"
                  >
                    {lang === 'kk' ? 'Бекіту' : 'Назначить'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tracking Link & QR Modal */}
      {activeModal === 'tracking' && modalItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-sm bg-card rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <Package className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">
                  {lang === 'kk' ? 'Бақылау сілтемесі' : 'Ссылка на отслеживание'}
                </h3>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-3xl shadow-inner border border-border">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/courier/track/${(modalItem as Order).courier_tracking_token}`)}`}
                  alt="Tracking QR"
                  className="w-40 h-40"
                />
              </div>

              <div className="w-full space-y-3">
                <div className="w-full bg-secondary rounded-2xl px-4 py-3 text-[10px] font-mono break-all text-muted-foreground text-center">
                  {`${window.location.origin}/courier/track/${(modalItem as Order).courier_tracking_token}`}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/courier/track/${(modalItem as Order).courier_tracking_token || ''}`)
                      toast.success(lang === 'kk' ? 'Көшірілді!' : 'Скопировано!')
                    }}
                    className="flex-1 bg-secondary text-foreground rounded-2xl py-4 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    {lang === 'kk' ? 'Көшіру' : 'Копия'}
                  </button>
                  <button
                    onClick={() => {
                      const trackingUrl = `${window.location.origin}/courier/track/${(modalItem as Order).courier_tracking_token}`
                      const msg = lang === 'kk'
                        ? `Тапсырыс #${modalItem.order_num} жеткізу сілтемесі: ${trackingUrl}`
                        : `Ссылка на доставку заказа #${modalItem.order_num}: ${trackingUrl}`
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                    }}
                    className="flex-1 bg-emerald-500 text-white rounded-2xl py-4 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <PartyPopper className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-secondary/50 text-muted-foreground rounded-2xl py-4 text-sm font-bold active:scale-95 transition-all"
            >
              {lang === 'kk' ? 'Жабу' : 'Закрыть'}
            </button>
          </div>
        </div>
      )}
    </div >
  )
}
