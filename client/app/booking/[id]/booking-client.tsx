'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/auth-context'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Badge } from '@/components/ui/badge'
import {
    Calendar, Clock, Users, ChefHat, Minus, Plus, Trash2,
    CheckCircle, ArrowLeft, ArrowRight, Loader2, ShoppingCart, Phone, User, X, ChevronRight
} from 'lucide-react'
import {
    getBookingCart, addToBookingCart, updateBookingCartQuantity,
    clearBookingCart, BookingCartItem
} from '@/lib/storage/booking-cart'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MenuItem {
    id: string
    name_kk: string
    name_ru: string
    price: number
    image_url: string
    is_available: boolean
    category_id: string | null
}

interface Restaurant {
    id: string
    name_kk: string
    name_ru: string
    phone: string
    working_hours: string
    is_booking_enabled: boolean
    booking_accept_cash: boolean
    booking_accept_kaspi: boolean
    booking_accept_freedom: boolean
    booking_fee?: number | null
    kaspi_link?: string | null
}

interface Table {
    id: string
    table_number: string
    capacity: number
    is_active: boolean
}

const STEPS = ['tables', 'datetime', 'menu', 'confirm', 'status'] as const
type Step = typeof STEPS[number]

// Уақыт слоттары
const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
]

function getTodayDate() {
    return new Date().toISOString().split('T')[0]
}

function getNext7Days() {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return d.toISOString().split('T')[0]
    })
}

function formatDateKK(dateStr: string) {
    const d = new Date(dateStr)
    const days = ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб']
    const months = ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел']
    return { day: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] }
}

export default function BookingPage({ restaurantId }: { restaurantId: string }) {
    const router = useRouter()
    const { user, profile } = useAuth()
    const { locale } = useI18n()
    const [step, setStep] = useState<Step>('tables')

    // Step 0: Tables
    const [tables, setTables] = useState<Table[]>([])
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
    const [loadingTables, setLoadingTables] = useState(false)

    // Step 1: DateTime
    const [selectedDate, setSelectedDate] = useState(getTodayDate())
    const [selectedTime, setSelectedTime] = useState('')
    const [guests, setGuests] = useState(2)
    const [busySlots, setBusySlots] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    // Step 2: Menu
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [bookingCart, setBookingCart] = useState<BookingCartItem[]>([])
    const [loadingMenu, setLoadingMenu] = useState(false)

    // Step 3: Confirm
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')

    // Sync name and phone with profile if authenticated
    useEffect(() => {
        if (profile) {
            setCustomerName(profile.full_name || '')
            const profilePhone = profile.phone || ''
            if (profilePhone) {
                // Formatting helper for initial sync
                let val = profilePhone.replace(/\D/g, '');
                if (val.startsWith('7')) val = val.substring(1);
                if (val.length > 10) val = val.substring(0, 10);
                
                let formatted = '+7';
                if (val.length > 0) {
                    formatted += ' (' + val.substring(0, 3);
                    if (val.length > 3) {
                        formatted += ') ' + val.substring(3, 6);
                        if (val.length > 6) {
                            formatted += '-' + val.substring(6, 8);
                            if (val.length > 8) {
                                formatted += '-' + val.substring(8, 10);
                            }
                        }
                    }
                }
                setCustomerPhone(formatted)
            } else {
                setCustomerPhone('+7')
            }
        } else {
            setCustomerPhone('+7')
        }
    }, [profile])
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'kaspi' | 'freedom' | null>(null)
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [reservationId, setReservationId] = useState<string | null>(null)
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false)
    const [duration, setDuration] = useState(1) // Жаңа: брондау ұзақтығы (сағат)
    const [workingHours, setWorkingHours] = useState<any[]>([])

    // Жұмыс уақытын өңдеу функциясы
    const getAvailableSlots = useCallback(() => {
        const todayIdx = new Date(selectedDate).getDay()
        const schedule = workingHours.find(h => h.day_of_week === todayIdx)

        if (!schedule || schedule.is_day_off) {
            // Егер кесте табылмаса, ескі тәсілмен көреміз
            if (!restaurant?.working_hours) return TIME_SLOTS
            try {
                const [start, end] = restaurant.working_hours.split('-').map(s => s.trim())
                const [startH, startM] = start.split(':').map(Number)
                const [endH, endM] = end.split(':').map(Number)
                const startMinutes = startH * 60 + startM
                const endMinutes = endH * 60 + endM

                return TIME_SLOTS.filter(slot => {
                    const [h, m] = slot.split(':').map(Number)
                    const slotMinutes = h * 60 + m
                    const endOfBooking = slotMinutes + (duration * 60)
                    return slotMinutes >= startMinutes && endOfBooking <= endMinutes
                })
            } catch (e) {
                return TIME_SLOTS
            }
        }

        const [startH, startM] = schedule.open_time.split(':').map(Number)
        const [endH, endM] = schedule.close_time.split(':').map(Number)

        const startMinutes = startH * 60 + startM
        let endMinutes = endH * 60 + endM

        // Егер түнгі уақыт болса (мысалы 02:00 < 10:00)
        if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60
        }

        return TIME_SLOTS.filter(slot => {
            const [h, m] = slot.split(':').map(Number)
            let slotMinutes = h * 60 + m

            // Егер бұл кешегі күннен қалған слот болса (CheckShift логикасы сияқты)
            // Бұл жерде тек таңдалған күн үшін тексереміз
            const endOfBooking = slotMinutes + (duration * 60)
            return slotMinutes >= startMinutes && endOfBooking <= endMinutes
        })
    }, [restaurant?.working_hours, workingHours, selectedDate, duration])

    const availableSlots = getAvailableSlots()

    // Booking cart sync
    useEffect(() => {
        setBookingCart(getBookingCart())
        const handler = () => setBookingCart(getBookingCart())
        window.addEventListener('bookingCartUpdated', handler)
        return () => window.removeEventListener('bookingCartUpdated', handler)
    }, [])

    // Load restaurant + menu
    useEffect(() => {
        if (!restaurantId) return
        const supabase = createClient()

        const fetchSettings = async () => {
            const { data: rest } = await supabase
                .from('restaurants')
                .select('id,name_kk,name_ru,phone,working_hours,is_booking_enabled,booking_accept_cash,booking_accept_kaspi,booking_accept_freedom,booking_fee,kaspi_link')
                .eq('id', restaurantId)
                .single()
            if (rest) {
                setRestaurant(rest)
            }
        }

        const fetchMenu = async () => {
            if (step !== 'menu') return
            setLoadingMenu(true)
            const { data: items } = await supabase
                .from('menu_items')
                .select('id,name_kk,name_ru,price,image_url,is_available,category_id')
                .eq('cafe_id', restaurantId)
                .eq('is_available', true)
                .order('sort_order')
            setMenuItems(items || [])
            setLoadingMenu(false)
        }

        const fetchWorkingHours = async () => {
            const { data } = await supabase
                .from('working_hours')
                .select('*')
                .eq('cafe_id', restaurantId)
            if (data) setWorkingHours(data)
        }

        fetchSettings()
        fetchMenu()
        fetchWorkingHours()

        // Real-time updates for restaurant settings
        const channel = supabase
            .channel(`restaurant-booking-settings-all-${restaurantId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'restaurants',
                filter: `id=eq.${restaurantId}`
            }, fetchSettings)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurantId, step])

    // Reactive Payment Method Selection
    useEffect(() => {
        if (!restaurant) return;
        const canKaspi = restaurant.booking_accept_kaspi;
        const canFreedom = restaurant.booking_accept_freedom;
        const canCash = restaurant.booking_accept_cash;

        setPaymentMethod(prev => {
            if (prev === 'kaspi' && canKaspi) return 'kaspi';
            if (prev === 'freedom' && canFreedom) return 'freedom';
            if (prev === 'cash' && canCash) return 'cash';

            // Auto-select first available
            if (canKaspi) return 'kaspi';
            if (canFreedom) return 'freedom';
            if (canCash) return 'cash';
            return null;
        });
    }, [restaurant]);

    // Fetch tables
    useEffect(() => {
        if (step !== 'tables') return
        setLoadingTables(true)
        const supabase = createClient()
        supabase
            .from('restaurant_tables')
            .select('*')
            .eq('cafe_id', restaurantId)
            .eq('is_active', true)
            .then(({ data, error }) => {
                if (!error && data) {
                    setTables(data)
                }
                setLoadingTables(false)
            })
    }, [step, restaurantId])

    // Fetch busy slots
    useEffect(() => {
        if (!selectedTableId || !selectedDate) return
        setLoadingSlots(true)
        const supabase = createClient()
        supabase
            .from('reservations')
            .select('time')
            .eq('table_id', selectedTableId)
            .eq('date', selectedDate)
            .not('status', 'eq', 'cancelled')
            .then(({ data, error }) => {
                if (!error && data) {
                    setBusySlots(data.map(r => r.time))
                }
                setLoadingSlots(false)
            })
    }, [selectedTableId, selectedDate])

    function handleAddToCart(item: MenuItem) {
        addToBookingCart({
            id: `bk_${item.id}`,
            menu_item_id: item.id,
            cafe_id: restaurantId,
            quantity: 1,
            name_kk: item.name_kk,
            name_ru: item.name_ru,
            price: item.price,
            image_url: item.image_url,
        })
    }

    function getCartQty(itemId: string) {
        return bookingCart.find(i => i.menu_item_id === itemId)?.quantity || 0
    }

    function changeQty(itemId: string, delta: number) {
        const item = bookingCart.find(i => i.menu_item_id === itemId)
        if (!item) return
        updateBookingCartQuantity(item.id, item.quantity + delta)
    }

    const bookingTotal = bookingCart.reduce((s, i) => s + i.price * i.quantity, 0) + (restaurant?.booking_fee || 0)

    async function handleSubmit() {
        if (!customerName.trim() || customerPhone.length < 18) {
            toast.error(locale === 'kk' ? 'Аты-жөн мен толық телефон нөмірін енгізіңіз' : 'Введите ФИО и полный номер телефона')
            return
        }
        if (!paymentMethod) {
            toast.error('Төлем әдісін таңдаңыз')
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cafe_id: restaurantId,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    date: selectedDate,
                    time: selectedTime,
                    guests_count: guests,
                    duration_hours: duration,
                    customer_id: profile?.id,
                    table_id: selectedTableId,
                    payment_method: paymentMethod,
                    notes,
                    items: bookingCart.map(i => ({
                        menu_item_id: i.menu_item_id,
                        name_kk: i.name_kk,
                        name_ru: i.name_ru,
                        price: i.price,
                        quantity: i.quantity,
                    })),
                }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Қате')

            setReservationId(json.reservation.id)

            if (paymentMethod === 'freedom') {
                const payRes = await fetch('/api/payment/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reservationId: json.reservation.id,
                        amount: bookingTotal,
                        description: `Брондау #${json.reservation.id.slice(0, 8)}`,
                        customerPhone: customerPhone
                    })
                })
                const payData = await payRes.json()
                if (payData.redirectUrl) {
                    clearBookingCart()
                    window.location.href = payData.redirectUrl
                    return
                }
            }

            if (paymentMethod === 'kaspi' && restaurant?.phone) {
                const tableNum = tables.find(t => t.id === selectedTableId)?.table_number || ''
                const menuSummary = bookingCart.map(i => `- ${i.name_ru || i.name_kk} x${i.quantity} (${(i.price * i.quantity).toLocaleString()}₸)`).join('\n')
                const bookingFeeLine = (restaurant.booking_fee && restaurant.booking_fee > 0) 
                    ? `Брондау ақысы: ${restaurant.booking_fee.toLocaleString()}₸\n` 
                    : ''
                const kaspiLinkLabel = restaurant.kaspi_link ? `\nТөлем сілтемесі: ${restaurant.kaspi_link}` : ''

                const message = `Сәлем! Жаңа брондау #${json.reservation.id.slice(0, 8)}\n` +
                    `Аты: ${customerName}\n` +
                    `Тел: ${customerPhone}\n` +
                    `Уақыты: ${selectedDate} ${selectedTime}\n` +
                    `Адам саны: ${guests}\n` +
                    (tableNum ? `Үстел: №${tableNum}\n` : '') +
                    (menuSummary ? `Тапсырыс:\n${menuSummary}\n` : '') +
                    bookingFeeLine +
                    `Жиыны: ${bookingTotal.toLocaleString()}₸\n` +
                    `Төлем әдісі: Kaspi.kz` +
                    kaspiLinkLabel;

                const waPhone = restaurant.phone.replace(/\D/g, '');
                const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;

                clearBookingCart()
                window.location.href = waUrl;
                return;
            }

            clearBookingCart()
            setReservationId(json.reservation.id)
            setStep('status')

            // Reset form
            setSelectedTableId(null)
            setSelectedTime('')
            setCustomerName(profile?.full_name || '')
            setCustomerPhone(profile?.phone || '')
            setNotes('')
            setPaymentMethod(null)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSubmitting(false)
        }
    }

    const days = getNext7Days()

    return (
        <div className="flex flex-col min-h-screen pb-20">
            <Header title="Орын брондау" />

            {/* Step indicator */}
            <div className="flex items-center gap-0 px-4 sm:px-6 py-4 bg-card border-b border-border sticky top-0 z-50">
                {STEPS.map((s, i) => (
                    <div key={s} className={cn("flex items-center", i < STEPS.length - 1 ? "flex-1" : "flex-none")}>
                        <div className={cn(
                            'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 transition-all',
                            step === s ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20' :
                                STEPS.indexOf(step) > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                            {STEPS.indexOf(step) > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </div>
                        {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 mx-1 sm:mx-2 min-w-[10px]', STEPS.indexOf(step) > i ? 'bg-primary/40' : 'bg-muted')} />}
                    </div>
                ))}
            </div>

            <main className="flex-1 overflow-auto">

                {/* ═══════════════ ҚАДАМ 0: Үстел таңдау ═══════════════ */}
                {step === 'tables' && (
                    <div className="px-4 py-6 space-y-6">
                        {/* Артқа батырма */}
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 w-fit"
                        >
                            <ArrowLeft className="w-4 h-4" /> Ресторанға қайту
                        </button>

                        <div>
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Үстелді таңдаңыз
                            </h2>
                            {loadingTables ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : tables.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>Ешқандай үстел табылмады</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {tables.map(table => (
                                        <button
                                            key={table.id}
                                            onClick={() => setSelectedTableId(table.id)}
                                            className={cn(
                                                'flex flex-col items-center gap-2 p-5 rounded-3xl border-2 transition-all text-center',
                                                selectedTableId === table.id
                                                    ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10'
                                                    : 'bg-card border-transparent hover:border-border'
                                            )}
                                        >
                                            <div className={cn(
                                                'w-12 h-12 rounded-2xl flex items-center justify-center mb-1 text-2xl',
                                                selectedTableId === table.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                            )}>
                                                🪑
                                            </div>
                                            <p className="font-bold text-lg">№{table.table_number}</p>
                                            <p className="text-xs text-muted-foreground">{table.capacity} адамдық</p>
                                            {selectedTableId === table.id && (
                                                <Badge className="absolute top-2 right-2 p-0.5 bg-primary text-white">
                                                    <CheckCircle className="w-4 h-4" />
                                                </Badge>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full h-14 text-base font-bold rounded-2xl"
                            disabled={!selectedTableId}
                            onClick={() => setStep('datetime')}
                        >
                            Келесі — Уақыт таңдау <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                )}
                {step === 'datetime' && (
                    <div className="px-4 py-6 space-y-6">
                        {/* Артқа батырма */}
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 w-fit"
                        >
                            <ArrowLeft className="w-4 h-4" /> Рестораннға қайту
                        </button>
                        {/* Күн */}
                        <div>
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Күнді таңдаңыз
                            </h2>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {days.map(d => {
                                    const { day, date, month } = formatDateKK(d)
                                    const today = d === getTodayDate()
                                    return (
                                        <button
                                            key={d}
                                            onClick={() => setSelectedDate(d)}
                                            className={cn(
                                                'shrink-0 flex flex-col items-center w-[72px] py-4 rounded-2xl border transition-all',
                                                selectedDate === d
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-card border-border text-foreground hover:bg-muted/50'
                                            )}
                                        >
                                            <span className="text-[10px] font-bold uppercase opacity-80 mb-1">{day}</span>
                                            <span className="text-xl font-bold leading-none mb-1">{date}</span>
                                            <span className="text-[10px] font-medium opacity-80">{month}</span>
                                            {today && (
                                                <div className={cn(
                                                    'mt-2 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter',
                                                    selectedDate === d ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                                                )}>
                                                    Бүгін
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Уақыт */}
                        <div>
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Уақытты таңдаңыз
                            </h2>

                            <button
                                onClick={() => setIsTimePickerOpen(true)}
                                className={cn(
                                    "w-full h-16 rounded-2xl border-2 flex items-center justify-between px-6 transition-all active:scale-[0.98]",
                                    selectedTime
                                        ? "bg-primary/5 border-primary shadow-lg shadow-primary/5"
                                        : "bg-card border-border hover:border-muted-foreground/20"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        selectedTime ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Уақыт</p>
                                        <p className="font-black text-lg">
                                            {selectedTime || "Таңдалмады"}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </button>

                            {/* Time Picker Modal */}
                            <AnimatePresence>
                                {isTimePickerOpen && (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setIsTimePickerOpen(false)}
                                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                                        />
                                        <motion.div
                                            initial={{ y: "100%" }}
                                            animate={{ y: 0 }}
                                            exit={{ y: "100%" }}
                                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-[2.5rem] z-[101] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden shadow-black/20"
                                        >
                                            <div className="p-4 flex flex-col items-center">
                                                <div className="w-12 h-1.5 bg-muted rounded-full mb-6" />
                                                <div className="w-full px-4 flex justify-between items-center mb-6">
                                                    <h3 className="text-xl font-black">Уақытты таңдаңыз</h3>
                                                    <button
                                                        onClick={() => setIsTimePickerOpen(false)}
                                                        className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="overflow-y-auto px-6 pb-12 space-y-8 custom-scrollbar">
                                                {/* Group slots by hour for better organization */}
                                                {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                                                    const hourStr = hour.toString().padStart(2, '0');
                                                    const slots = availableSlots.filter(s => s.startsWith(hourStr));
                                                    if (slots.length === 0) return null;

                                                    return (
                                                        <div key={hourStr} className="space-y-3">
                                                            <p className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest ml-1">{hourStr}:00 - {hourStr}:59</p>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {slots.map(t => {
                                                                    const isBusy = busySlots.includes(t);
                                                                    return (
                                                                        <button
                                                                            key={t}
                                                                            disabled={isBusy}
                                                                            onClick={() => {
                                                                                setSelectedTime(t);
                                                                                setIsTimePickerOpen(false);
                                                                            }}
                                                                            className={cn(
                                                                                "h-14 rounded-2xl text-base font-bold transition-all border-2 flex items-center justify-center gap-2",
                                                                                selectedTime === t
                                                                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                                                                    : "bg-card border-border hover:border-primary/30",
                                                                                isBusy && "opacity-30 grayscale cursor-not-allowed bg-muted border-transparent"
                                                                            )}
                                                                        >
                                                                            <Clock className="w-4 h-4 opacity-70" />
                                                                            {t}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Ұзақтығы */}
                        <div>
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Брондау ұзақтығы
                            </h2>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => {
                                            setDuration(h);
                                            // Reset time when duration changes to re-validate via availableSlots
                                            setSelectedTime('');
                                        }}
                                        className={cn(
                                            "h-12 rounded-xl text-sm font-bold transition-all border-2",
                                            duration === h
                                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10"
                                                : "bg-card border-border hover:border-primary/20"
                                        )}
                                    >
                                        {h} сағат
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Адам саны */}
                        <div>
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Адам саны
                            </h2>
                            <div className="flex items-center gap-4 bg-card rounded-2xl border border-border p-4">
                                <Users className="w-5 h-5 text-primary" />
                                <span className="flex-1 text-sm text-muted-foreground">Қонақтар саны</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setGuests(g => Math.max(1, g - 1))}
                                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-all"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center text-xl font-bold">{guests}</span>
                                    <button
                                        onClick={() => setGuests(g => Math.min(20, g + 1))}
                                        className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 text-base font-bold rounded-2xl"
                            disabled={!selectedDate || !selectedTime}
                            onClick={() => setStep('menu')}
                        >
                            Келесі — Тамақ таңдау <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                )}

                {/* ═══════════════ ҚАДАМ 2: Меню (алдын ала тапсырыс) ═══════════════ */}
                {step === 'menu' && (
                    <div className="px-4 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setStep('datetime')} className="flex items-center gap-1 text-sm text-muted-foreground">
                                <ArrowLeft className="w-4 h-4" /> Артқа
                            </button>
                            <h2 className="text-sm font-bold">Тамақты алдын ала тапсырыс</h2>
                            {bookingCart.length > 0 && (
                                <button onClick={() => clearBookingCart()} className="text-xs text-red-500 flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Тазалау
                                </button>
                            )}
                        </div>

                        {/* Алынып тасталуы мүмкін екенін ескерту */}
                        <div className="bg-primary/5 rounded-xl p-3 mb-4 text-xs text-muted-foreground">
                            💡 Тамақты алдын ала тапсырыс етуіңіз міндетті емес — қалауыңыз бойынша
                        </div>

                        {loadingMenu ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {menuItems.map(item => {
                                    const qty = getCartQty(item.id)
                                    return (
                                        <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                                            <div className="relative h-28 bg-muted">
                                                {item.image_url ? (
                                                    <Image src={item.image_url} alt={item.name_ru} fill className="object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-3xl">🍽️</div>
                                                )}
                                            </div>
                                            <div className="p-2.5">
                                                <p className="text-xs font-semibold text-foreground line-clamp-2 mb-1">{item.name_ru}</p>
                                                <p className="text-sm font-bold text-primary">{item.price.toLocaleString()}₸</p>
                                                {qty === 0 ? (
                                                    <button
                                                        onClick={() => handleAddToCart(item)}
                                                        className="w-full mt-2 bg-primary text-primary-foreground text-xs font-semibold py-1.5 rounded-xl active:scale-95 transition-all"
                                                    >
                                                        + Қосу
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-between mt-2">
                                                        <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="text-sm font-bold">{qty}</span>
                                                        <button onClick={() => changeQty(item.id, +1)} className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Cart summary sticky bottom */}
                        <div className="sticky bottom-4">
                            {bookingTotal > 0 && (
                                <div className="bg-card rounded-2xl border border-primary/20 shadow-lg p-3 mb-3 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        {bookingCart.length > 0 ? (
                                            <>
                                                <ShoppingCart className="w-4 h-4" />
                                                <span>{bookingCart.reduce((s, i) => s + i.quantity, 0)} тағам таңдалды</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center p-0.5">
                                                    <div className="w-full h-full rounded-full bg-primary" />
                                                </div>
                                                <span>Орын брондау ақысы</span>
                                            </>
                                        )}
                                        <span className="ml-auto font-bold text-primary">{bookingTotal.toLocaleString()}₸</span>
                                    </div>
                                </div>
                            )}
                            <Button
                                className="w-full h-14 text-base font-bold rounded-2xl shadow-xl shadow-primary/10 transition-all active:scale-[0.98]"
                                onClick={() => setStep('confirm')}
                            >
                                Келесі — Растау <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ═══════════════ ҚАДАМ 3: Растау ═══════════════ */}
                {step === 'confirm' && (
                    <div className="px-4 py-6 space-y-6">
                        <button onClick={() => setStep('menu')} className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <ArrowLeft className="w-4 h-4" /> Артқа
                        </button>

                        {/* Брондау қорытындысы */}
                        <div className="bg-primary/5 rounded-2xl p-4 space-y-2">
                            <h2 className="font-bold text-foreground mb-3">Брондау мәліметтері</h2>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-primary shrink-0" />
                                <span>{selectedDate}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Clock className="w-4 h-4 text-primary shrink-0" />
                                <span>{selectedTime}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Users className="w-4 h-4 text-primary shrink-0" />
                                <span>{guests} адам</span>
                            </div>
                            {bookingCart.length > 0 && (
                                <div className="flex items-center gap-3 text-sm">
                                    <ChefHat className="w-4 h-4 text-primary shrink-0" />
                                    <span>{bookingCart.length} тағам — {(bookingTotal - (restaurant?.booking_fee || 0)).toLocaleString()}₸</span>
                                </div>
                            )}
                            {restaurant?.booking_fee && restaurant.booking_fee > 0 && (
                                <div className="flex items-center gap-3 text-sm text-primary font-bold">
                                    <Badge variant="outline" className="border-primary text-primary text-[10px]">Брондау ақысы</Badge>
                                    <span>{restaurant.booking_fee.toLocaleString()}₸</span>
                                </div>
                            )}
                            <div className="pt-2 mt-2 border-t border-primary/10 flex justify-between items-center">
                                <span className="font-bold text-sm">Жиыны:</span>
                                <span className="font-black text-lg text-primary">{bookingTotal.toLocaleString()}₸</span>
                            </div>
                        </div>

                        {/* Байланыс ақпараты */}
                        <div className="space-y-3">
                            <h2 className="font-bold text-foreground">Байланыс ақпараты</h2>

                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Аты-жөніңіз *"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className="w-full bg-card rounded-2xl border border-border pl-10 pr-4 py-3.5 text-sm outline-none focus:border-primary/50 transition-all"
                                />
                            </div>

                            <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="tel"
                                    placeholder={locale === 'kk' ? "Телефон нөміріңіз * (+7...)" : "Ваш номер телефона * (+7...)"}
                                    value={customerPhone}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val.startsWith('7')) val = val.substring(1);
                                        if (val.length > 10) val = val.substring(0, 10);
                                        
                                        let formatted = '+7';
                                        if (val.length > 0) {
                                            formatted += ' (' + val.substring(0, 3);
                                            if (val.length > 3) {
                                                formatted += ') ' + val.substring(3, 6);
                                                if (val.length > 6) {
                                                    formatted += '-' + val.substring(6, 8);
                                                    if (val.length > 8) {
                                                        formatted += '-' + val.substring(8, 10);
                                                    }
                                                }
                                            }
                                        }
                                        setCustomerPhone(formatted);
                                    }}
                                    className="w-full bg-card rounded-2xl border border-border pl-10 pr-4 py-3.5 text-sm outline-none focus:border-primary/50 transition-all"
                                />
                            </div>

                            <textarea
                                placeholder="Қосымша ескертпе (аллергия, арнайы сұраныс...)"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                className="w-full bg-card rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all resize-none"
                            />
                        </div>

                        {/* Төлем әдісі */}
                        <div className="space-y-3">
                            <h2 className="font-bold text-foreground">Төлем әдісі</h2>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'kaspi', label: 'Kaspi.kz', icon: '💰', desc: 'Kaspi.kz қосымшасы арқылы', enabled: restaurant?.booking_accept_kaspi },
                                    { id: 'cash', label: 'Қолма-қол', icon: '💵', desc: 'Кафеде төлеу', enabled: restaurant?.booking_accept_cash },
                                    { id: 'freedom', label: 'Freedom Pay', icon: '💳', desc: 'Банк картасымен онлайн', enabled: restaurant?.booking_accept_freedom },
                                ].filter(m => {
                                    if (!restaurant) return true
                                    return m.enabled === true
                                }).map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setPaymentMethod(m.id as any)}
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all text-left bg-card relative overflow-hidden group",
                                            paymentMethod === m.id
                                                ? "border-primary bg-primary/[0.03] shadow-xl shadow-primary/5"
                                                : "border-border/50 hover:border-primary/20 hover:bg-muted/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-all shadow-sm",
                                            paymentMethod === m.id ? "bg-primary text-primary-foreground scale-110" : "bg-muted"
                                        )}>
                                            {m.id === 'kaspi' ? '💰' : m.id === 'cash' ? '💵' : '💳'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "font-black text-base transition-colors",
                                                paymentMethod === m.id ? "text-primary" : "text-foreground"
                                            )}>{m.label}</p>
                                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{m.desc}</p>
                                        </div>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            paymentMethod === m.id ? "bg-primary border-primary scale-110 shadow-lg shadow-primary/20" : "border-muted-foreground/30"
                                        )}>
                                            {paymentMethod === m.id && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                                        </div>

                                        {/* Subtle highlight effect */}
                                        {paymentMethod === m.id && (
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full blur-2xl" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Final Submit Button */}
                        <div className="pt-4">
                            <Button
                                disabled={submitting}
                                onClick={handleSubmit}
                                className="w-full h-16 text-lg font-black rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:bg-primary/95 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {submitting ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        {paymentMethod === 'freedom' ? 'Төлеу' : 'Растау және брондау'}
                                        <ArrowRight className="w-6 h-6" />
                                    </>
                                )}
                            </Button>
                            <p className="text-[10px] text-center text-muted-foreground mt-4 px-6 italic">
                                "Брондау" батырмасын басу арқылы сіз кафе ережелерімен келісесіз
                            </p>
                        </div>

                    </div>
                )}

                {/* ═══════════════ ҚАДАМ 4: Статус ═══════════════ */}
                {step === 'status' && reservationId && (
                    <ReservationStatusView
                        reservationId={reservationId}
                        restaurantId={restaurantId}
                    />
                )}
            </main>
        </div>
    )
}

function ReservationStatusView({ reservationId, restaurantId }: { reservationId: string, restaurantId: string }) {
    const router = useRouter()
    const { locale } = useI18n()
    const [reservation, setReservation] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        const fetchRes = async () => {
            const { data } = await supabase
                .from('reservations')
                .select('*, restaurants!cafe_id (*)')
                .eq('id', reservationId)
                .single()
            if (data) setReservation(data)
            setLoading(false)
        }

        fetchRes()

        const channel = supabase
            .channel(`reservation-${reservationId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservations', filter: `id=eq.${reservationId}` }, (payload) => {
                setReservation((prev: any) => ({ ...prev, ...payload.new }))
                if (payload.new.status === 'confirmed') {
                    toast.success('Брондауыңыз расталды! 🎉')
                }
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [reservationId])

    if (loading || !reservation) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Мәліметтерді жүктеуде...</p>
            </div>
        )
    }

    const statuses = [
        { key: 'pending', label: 'Өтінім жіберілді', icon: <Clock className="w-5 h-5" />, desc: 'Кафе өтініміңізді қарауда' },
        { key: 'awaiting_payment', label: 'Төлем күтілуде', icon: <ShoppingCart className="w-5 h-5" />, desc: 'Брондау үшін төлем жасаңыз' },
        { key: 'confirmed', label: 'Расталды', icon: <CheckCircle className="w-5 h-5" />, desc: 'Сізді кафеде күтеміз!' },
        { key: 'completed', label: 'Аяқталды', icon: <CheckCircle className="w-5 h-5" />, desc: 'Асыңыз дәмді болсын!' }
    ]

    const currentIndex = statuses.findIndex(s => s.key === reservation.status)
    const activeStatus = statuses[currentIndex] || statuses[0]

    return (
        <div className="px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Header */}
            <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary animate-bounce">
                    {activeStatus.icon}
                </div>
                <h1 className="text-2xl font-black">{activeStatus.label}</h1>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">{activeStatus.desc}</p>
            </div>

            {/* Stepper view like delivery */}
            <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-sm">
                <div className="relative space-y-6 sm:space-y-8">
                    {/* Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-muted" />

                    {statuses.map((s, i) => (
                        <div key={s.key} className="flex items-start gap-4 relative z-10">
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all border-2",
                                i < currentIndex && "bg-emerald-500 border-emerald-600 text-white",
                                i === currentIndex && "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110 animate-pulse",
                                i > currentIndex && "bg-background border-muted text-muted-foreground"
                            )}>
                                {i < currentIndex ? "✓" : i + 1}
                            </div>
                            <div className="flex-1 -mt-0.5">
                                <p className={cn(
                                    "font-bold text-sm transition-colors",
                                    i <= currentIndex ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {s.label}
                                </p>
                                {i === currentIndex && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
                                        <p className="text-[10px] text-primary font-bold">{locale === 'ru' ? 'В процессе...' : 'Орындалуда...'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment URL (if awaiting_payment) */}
            {reservation.status === 'awaiting_payment' && reservation.payment_url && (
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-3xl p-6 border-2 border-orange-200 dark:border-orange-900 shadow-xl animate-in zoom-in-95 duration-300">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-orange-900 dark:text-orange-200">Төлем қажет</p>
                            <p className="text-xs text-orange-700/80 dark:text-orange-400 font-medium">Брондауды бекіту үшін төлем жасаңыз</p>
                        </div>
                    </div>
                    <Button
                        className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
                        onClick={() => window.open(reservation.payment_url, '_blank')}
                    >
                        Төлеу — {Number(reservation.total_amount).toLocaleString()} ₸
                    </Button>
                </div>
            )}

            {/* Reservation Summary */}
            <div className="bg-muted/40 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Мәліметтер</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card p-3 rounded-2xl border border-border/50">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Күні</p>
                        <p className="font-bold text-sm tracking-tight">{reservation.date}</p>
                    </div>
                    <div className="bg-card p-3 rounded-2xl border border-border/50">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Уақыты</p>
                        <p className="font-bold text-sm tracking-tight">{reservation.time.slice(0, 5)}</p>
                    </div>
                    <div className="bg-card p-3 rounded-2xl border border-border/50">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Қонақтар</p>
                        <p className="font-bold text-sm tracking-tight">{reservation.guests_count} адам</p>
                    </div>
                    <div className="bg-card p-3 rounded-2xl border border-border/50">
                        <p className="text-[10px] text-muted-foreground mb-0.5">ID</p>
                        <p className="font-bold text-[10px] tracking-tight truncate">#{reservation.id.slice(0, 8)}</p>
                    </div>
                </div>
            </div>

            {/* Support button */}
            <div className="pt-2">
                <Button
                    variant="outline"
                    className="w-full h-14 rounded-2xl border-emerald-100 flex items-center justify-center gap-3 bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold shadow-sm transition-all active:scale-95"
                    onClick={() => {
                        const phone = reservation.restaurants?.phone?.replace(/\D/g, '') || '77771234567'
                        window.open(`https://wa.me/${phone}`, '_blank')
                    }}
                >
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                        <Phone className="w-4 h-4" />
                    </div>
                    WhatsApp қолдау
                </Button>
            </div>

            <Button
                variant="ghost"
                className="w-full text-muted-foreground font-bold hover:text-foreground"
                onClick={() => router.push(`/restaurant/${restaurantId}`)}
            >
                Ресторанға қайту
            </Button>
        </div>
    )
}
