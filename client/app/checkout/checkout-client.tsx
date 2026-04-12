'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { notifyAdmin } from '@/lib/actions'
import { useLocalCart } from '@/hooks/use-local-cart'
import { clearLocalCart } from '@/lib/storage/local-storage'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { savePII, getRestaurantStatus, subscribeToVPS } from '@/lib/vps'
import { getSecureMerchantConfig } from '@/lib/actions'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useAuth } from '@/lib/auth/auth-context'
import { CheckCircle2, MapPin, CreditCard, Banknote, ArrowLeft, Map as MapIcon, Navigation, Loader2, Truck, ShoppingBag, Users, Wallet, Utensils, ShoppingCart, Ban, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { isRestaurantOpen } from '@/lib/restaurant-utils'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { CheckoutAuth } from '@/components/checkout/checkout-auth'
import { MenuItemCard } from '@/components/restaurant/menu-item-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const MapPicker = dynamic(() => import('@/components/checkout/map-picker').then(mod => mod.MapPicker), {
    ssr: false,
    loading: () => <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
})

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export function CheckoutClient() {
    const router = useRouter()
    const cartItems = useLocalCart()
    const { t, locale } = useI18n()
    const { user: authUser, profile, loading: authLoading } = useAuth()
    const [checkoutLoading, setCheckoutLoading] = useState(false)
    const [restaurantSettings, setRestaurantSettings] = useState<any>(null)
    const [workingHours, setWorkingHours] = useState<any[]>([])
    const [step, setStep] = useState<'auth' | 'form' | 'summary'>('auth')

    // Redirect to form/summary if already logged in or after login
    useEffect(() => {
        if (authUser && step === 'auth') {
            setStep('form')
        }
    }, [authUser, step])

    // Form state
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('+7 ')

    // Sync name and phone with profile if authenticated
    useEffect(() => {
        if (profile) {
            setName(profile.full_name || '')
            const profilePhone = profile.phone || ''
            if (profilePhone) {
                // Ensure it has +7 if not present
                setPhone(profilePhone.startsWith('+7') ? profilePhone : `+7 ${profilePhone}`)
            }
        }
    }, [profile])

    const [address, setAddress] = useState('')
    const [notes, setNotes] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<'kaspi' | 'freedom' | 'cash' | null>(null)

    // Load persisted payment method
    useEffect(() => {
        const persisted = localStorage.getItem('last_payment_method')
        if (persisted === 'kaspi' || persisted === 'freedom') {
            setPaymentMethod(persisted)
        }
    }, [])

    // Persist payment method
    const handleSetPaymentMethod = (method: 'kaspi' | 'freedom' | 'cash') => {
        setPaymentMethod(method)
        localStorage.setItem('last_payment_method', method)
    }
    const searchParams = useSearchParams()
    const initialType = (searchParams.get('type') as 'delivery' | 'pickup' | 'booking') || 'delivery'
    const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'booking'>(initialType)
    const lang = locale // Alias for convenience or consistent naming

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [locating, setLocating] = useState(false)
    const [mapOpen, setMapOpen] = useState(false)
    const [distance, setDistance] = useState<number | null>(null)
    const [calculatedFee, setCalculatedFee] = useState<number>(0)

    // Booking state
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
    const [bookingTime, setBookingTime] = useState('19:00')
    const [bookingGuests, setBookingGuests] = useState(2)
    const [bookingDuration, setBookingDuration] = useState(1.5)
    const [bookingSubStep, setBookingSubStep] = useState<1 | 2 | 3>(1)
    const [categories, setCategories] = useState<any[]>([])
    const [menuItems, setMenuItems] = useState<any[]>([])
    const [allTables, setAllTables] = useState<any[]>([])
    const [availableTables, setAvailableTables] = useState<any[]>([])
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
    const [allReservations, setAllReservations] = useState<any[]>([])
    const [isKaspiModalOpen, setIsKaspiModalOpen] = useState(false)

    const restaurantId = cartItems.length > 0 ? cartItems[0].cafe_id : searchParams.get('restaurant')
    const subtotal = cartItems.reduce((sum, item) => sum + item.menu_item.price * item.quantity, 0)

    // Calculate delivery fee and booking fee
    useEffect(() => {
        if (orderType === 'delivery' && coords && restaurantSettings) {
            const resLat = restaurantSettings.latitude
            const resLng = restaurantSettings.longitude

            if (resLat && resLng) {
                const dist = calculateDistance(resLat, resLng, coords.lat, coords.lng)
                setDistance(dist)

                const baseFee = restaurantSettings.base_delivery_fee || 0
                const perKmFee = restaurantSettings.delivery_fee_per_km || 0
                const fee = Math.round(baseFee + (dist * perKmFee))
                setCalculatedFee(fee)
            } else {
                setCalculatedFee(restaurantSettings.delivery_fee || 0)
            }
        } else if (orderType === 'delivery' && restaurantSettings) {
            setCalculatedFee(restaurantSettings.delivery_fee || 0)
        } else if (orderType === 'booking' && restaurantSettings) {
            setCalculatedFee(restaurantSettings.booking_fee || 0)
        } else {
            setCalculatedFee(0)
        }
    }, [orderType, coords, restaurantSettings])

    useEffect(() => {
        if (!restaurantSettings) return

        // If it's a booking and we just loaded, ensure we are on form step
        if (orderType === 'booking' && step === 'auth' && authUser) {
            setStep('form')
        }

        const canKaspi = restaurantSettings.accept_kaspi ?? true
        const canFreedom = restaurantSettings.accept_freedom ?? false
        const canCash = restaurantSettings.accept_cash ?? true
        
        console.log('[Checkout] Payment flags calculated (with defaults):', { canKaspi, canFreedom, canCash })

        setPaymentMethod(prev => {
            if (prev === 'kaspi' && canKaspi) return 'kaspi'
            if (prev === 'freedom' && canFreedom) return 'freedom'
            if (prev === 'cash' && canCash) return 'cash'

            // Auto-select first available
            if (canKaspi) return 'kaspi'
            if (canFreedom) return 'freedom'
            if (canCash) return 'cash'
            return null
        })
    }, [orderType, restaurantSettings, authUser])

    const total = subtotal + calculatedFee

    // Fetch restaurant settings and tables
    useEffect(() => {
        if (!restaurantId) return
        const supabase = createClient()

        // Settings
        const fetchSettings = () => {
            supabase
                .from('restaurants')
                .select(`
                    id, 
                    name_kk, 
                    name_ru, 
                    name_en, 
                    description_kk, 
                    description_ru, 
                    description_en, 
                    image_url, 
                    banner_url, 
                    address, 
                    phone, 
                    rating, 
                    delivery_time_min, 
                    delivery_time_max, 
                    delivery_fee, 
                    minimum_order, 
                    is_open, 
                    status, 
                    opening_hours, 
                    cuisine_types, 
                    kaspi_link, 
                    freedom_merchant_id, 
                    accept_cash, 
                    accept_kaspi, 
                    accept_freedom, 
                    is_delivery_enabled, 
                    is_pickup_enabled, 
                    is_booking_enabled, 
                    base_delivery_fee, 
                    delivery_fee_per_km, 
                    booking_fee,
                    latitude, 
                    longitude
                `)
                .eq('id', restaurantId)
                .single()
                .then(async ({ data, error }) => {
                    console.log('[Checkout] Fetched settings for ID:', restaurantId, data)
                    if (!data) {
                        console.warn('[Checkout] No data found for restaurantId:', restaurantId)
                    }
                    if (error) {
                        console.error('[Checkout] Error fetching restaurant settings:', error)
                        return
                    }

                    if (data) {
                        // Hydrate with VPS data via secure Server Action for sensitive fields only
                        const vpsConfig = await getSecureMerchantConfig(restaurantId);
                        if (vpsConfig) {
                          data.kaspi_link = vpsConfig.kaspi_link || data.kaspi_link;
                          // Do not overwrite realtime boolean toggles with VPS data which might be cached or lagging
                          // Trust Supabase values for: accept_freedom, accept_kaspi, accept_cash
                        }
                        
                        // Trust Supabase status as the single source of truth for realtime
                        // const vpsStatus = await getRestaurantStatus(restaurantId);
                        // if (vpsStatus) {
                        //   data.status = vpsStatus.status;
                        // }

                        setRestaurantSettings(data)

                        // Set default payment method if none selected correctly
                        setPaymentMethod(prev => {
                            if (prev) return prev
                            const persisted = localStorage.getItem('last_payment_method')
                            const canKaspi = data.accept_kaspi ?? true
                            const canFreedom = data.accept_freedom ?? false
                            const canCash = data.accept_cash ?? true

                            if (persisted === 'kaspi' && canKaspi) return 'kaspi'
                            if (persisted === 'freedom' && canFreedom) return 'freedom'
                            if (persisted === 'cash' && canCash) return 'cash'

                            if (canKaspi) return 'kaspi'
                            if (canFreedom) return 'freedom'
                            if (canCash) return 'cash'
                            return null
                        })

                        if (data.is_delivery_enabled) setOrderType(prev => prev || 'delivery')
                        else if (data.is_pickup_enabled) setOrderType(prev => prev || 'pickup')
                    }
                })
        }

        fetchSettings()

        // Working Hours
        supabase
            .from('working_hours')
            .select('*')
            .eq('cafe_id', restaurantId)
            .then(({ data }) => {
                if (data) setWorkingHours(data)
            })

        // Real-time updates for restaurant settings
        const channel = supabase
            .channel(`restaurant-settings-${restaurantId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'restaurants',
                filter: `id=eq.${restaurantId}`
            }, fetchSettings)
            .subscribe()

        // Fetch all tables
        supabase
            .from('restaurant_tables')
            .select('*')
            .eq('cafe_id', restaurantId)
            .eq('is_active', true) 
            .then(({ data }) => {
                if (data) setAllTables(data)
            })

        // Fetch categories and items for booking menu
        supabase
            .from('categories')
            .select('*')
            .eq('cafe_id', restaurantId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .then(({ data }) => {
                if (data) setCategories(data)
            })

        supabase
            .from('menu_items')
            .select('*')
            .eq('cafe_id', restaurantId)
            .eq('is_available', true)
            .order('sort_order', { ascending: true })
            .then(({ data }) => {
                if (data) setMenuItems(data)
            })

        // Fetch all current/future reservations to check availability client-side
        supabase
            .from('reservations')
            .select('id, table_id, date, time, duration_hours, status')
            .eq('cafe_id', restaurantId)
            .in('status', ['pending', 'confirmed', 'awaiting_payment', 'completed', 'rejected', 'cancelled'])
            .then(({ data }) => {
                if (data) setAllReservations(data)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurantId])

    // Filter available tables based on selection
    useEffect(() => {
        if (orderType !== 'booking' || !bookingDate || !bookingTime) {
            setAvailableTables([])
            return
        }

        const requestedStart = parseInt(bookingTime.split(':')[0]) * 60 + parseInt(bookingTime.split(':')[1])
        const requestedEnd = requestedStart + (bookingDuration * 60)

        const filtered = allTables.filter(table => {
            // 1. Capacity check
            if (table.capacity < bookingGuests) return false

            // 2. Overlap check
            const hasOverlap = allReservations.some(res => {
                // Ignore cancelled or completed reservations
                if (['cancelled', 'completed', 'rejected'].includes(res.status)) return false
                if (res.table_id !== table.id || res.date !== bookingDate) return false

                const resStart = parseInt(res.time.split(':')[0]) * 60 + parseInt(res.time.split(':')[1])
                const resEnd = resStart + (res.duration_hours * 60)

                // Buffer of 15 minutes between bookings could be added here if needed
                return requestedStart < resEnd && requestedEnd > resStart
            })

            // Return true if no overlap, regardless of is_active (since we already filtered by is_active in fetch if we wanted)
            return !hasOverlap
        })

        setAvailableTables(filtered)
        if (selectedTableId && !filtered.find(t => t.id === selectedTableId)) {
            setSelectedTableId(null)
        }
    }, [orderType, bookingDate, bookingTime, bookingGuests, bookingDuration, allTables, allReservations])

    useEffect(() => {
        if (orderType === 'delivery' && !coords && !locating) {
            handleGetLocation()
        }
    }, [orderType, coords, locating])

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error(t.cart.geolocation_unsupported)
            return
        }
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setLocating(false)
                toast.success(t.cart.coords_detected)
            },
            () => {
                setLocating(false)
                toast.error(t.cart.location_error)
            }
        )
    }

    const handleContinueToSummary = () => {
        if (!name.trim() || phone.length < 18) {
            toast.error(t.cart.enter_name_phone)
            return
        }

        if (orderType === 'delivery') {
            if (!address || !coords) {
                toast.error(locale === 'kk' ? 'Мекен-жайды картадан таңдаңыз' : 'Выберите адрес на карте')
                return
            }
            if (restaurantSettings && !restaurantSettings.latitude) {
                toast.error(locale === 'kk' ? 'Кафе орналасқан жері белгісіз. Жеткізу мүмкін емес.' : 'Местоположение кафе не определено. Доставка невозможна.')
                return
            }
        }

        if (!paymentMethod) {
            toast.error(t.cart.select_payment_method)
            return
        }

        setStep('summary')
        window.scrollTo(0, 0)
    }

    const handleCheckout = async () => {
        setCheckoutLoading(true)
        const supabase = createClient()

        try {
            // Check if restaurant is open if auto_reject_when_closed is true
            if (restaurantSettings?.auto_reject_when_closed) {
                const { isOpen, message } = isRestaurantOpen(restaurantSettings.status, workingHours)
                if (!isOpen) {
                    toast.error(locale === 'kk' ? `Кешіріңіз, ресторан қазір жабық. ${message}` : `Извините, ресторан сейчас закрыт. ${message}`, {
                        icon: <Ban className="w-4 h-4 text-destructive" />
                    })
                    setCheckoutLoading(false)
                    return
                }
            }

            if (orderType === 'booking' && !selectedTableId) {
                toast.error(locale === 'kk' ? 'Үстел таңдаңыз' : 'Выберите столик')
                setCheckoutLoading(false)
                return
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error(t.cart.please_signin)
                router.push('/login?next=/checkout')
                return
            }

            if (orderType === 'booking') {
                // 1. Double check availability (client-side list is already filtered, but table_id might have been taken)
                const isStillAvailable = availableTables.some(t => t.id === selectedTableId)
                if (!isStillAvailable) {
                    toast.error(locale === 'kk' ? 'Кешіріңіз, бұл үстел бос емес' : 'Извините, этот стол уже занят')
                    setCheckoutLoading(false)
                    return
                }

                // 2. Save PII to VPS
                const vpsId = await savePII('profiles', {
                    full_name: name,
                    phone: phone,
                    address: '', // Inside booking block, address is not relevant
                    type: 'reservation'
                });
                
                // Store VPS ID locally for guest tracking
                localStorage.setItem('vps_id', vpsId);
                localStorage.setItem('customer_phone', vpsId); // Compatibility with existing phone-based tracking

                // 3. Insert Reservation
                const { data: reservation, error: resError } = await supabase
                    .from('reservations')
                    .insert({
                        cafe_id: restaurantId,
                        customer_name: vpsId, // Storing VPS ID
                        customer_phone: vpsId, // Storing VPS ID
                        date: bookingDate,
                        time: bookingTime,
                        guests_count: bookingGuests,
                        table_id: selectedTableId,
                        payment_method: paymentMethod || 'cash',
                        notes: notes,
                        duration_hours: bookingDuration,
                        customer_id: user.id,
                        total_amount: total,
                        booking_fee: calculatedFee,
                        status: paymentMethod === 'freedom' ? 'awaiting_payment' : 'pending',
                        payment_status: 'pending'
                    })
                    .select()
                    .single()

                if (resError) throw resError

                const reservationId = reservation.id

                // 3. Insert Reservation Items if any
                if (cartItems.length > 0) {
                    const reservationItems = cartItems.map(item => ({
                        reservation_id: reservation.id,
                        menu_item_id: item.menu_item_id,
                        name_kk: item.menu_item.name_kk,
                        name_ru: item.menu_item.name_ru,
                        price: item.menu_item.price,
                        quantity: item.quantity
                    }))

                    const { error: itemsError } = await supabase
                        .from('reservation_items')
                        .insert(reservationItems)

                    if (itemsError) console.error('[Checkout] Error inserting reservation items:', itemsError)
                }

                // 4. Notify Admin
                await notifyAdmin(reservation, 'booking', restaurantId || undefined)

                if (paymentMethod === 'freedom') {
                    const payRes = await fetch('/api/payment/init', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            reservationId: reservation.id,
                            amount: total,
                            description: `${locale === 'kk' ? 'Брондау үшін төлем' : 'Оплата за бронирование'} #${reservation.id.slice(0, 8)}`,
                            customerEmail: user.email,
                            customerPhone: phone
                        })
                    })

                    const payData = await payRes.json()
                    if (payData.redirectUrl) {
                        clearLocalCart()
                        window.location.href = payData.redirectUrl
                        return
                    } else {
                        console.error('[Checkout] Freedom Pay Init Error:', payData.error)
                        // Even if payment init fails, reservation is created. Redirect to summary/orders?
                        toast.error(t.cart.payment_failed)
                    }
                } else if (paymentMethod === 'kaspi' && restaurantSettings?.kaspi_link) {
                    setIsKaspiModalOpen(true)
                    clearLocalCart()
                    // Don't redirect yet, let them see the Kaspi link
                    return
                }

                clearLocalCart()
                toast.success(locale === 'kk' ? 'Брондау сәтті аяқталды' : 'Бронирование успешно завершено')
                router.push(`/reservations/${reservationId}`)
                return
            }


            // 0. Save PII to VPS for Order
            const vpsId = await savePII('profiles', {
                full_name: name,
                phone: phone,
                address: orderType === 'delivery' ? address : '',
                type: 'order'
            });

            // Store VPS ID locally for guest tracking
            localStorage.setItem('vps_id', vpsId);
            localStorage.setItem('customer_phone', vpsId); // Compatibility with existing phone-based tracking

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    cafe_id: restaurantId,
                    status: paymentMethod === 'freedom' ? 'awaiting_payment' : 'new',
                    total_amount: orderType === 'delivery' ? total : subtotal,
                    delivery_fee: orderType === 'delivery' ? calculatedFee : 0,
                    delivery_address: vpsId, // Storing VPS ID
                    address: vpsId, // Storing VPS ID
                    latitude: coords?.lat,
                    longitude: coords?.lng,
                    payment_method: paymentMethod,
                    payment_status: 'pending',
                    customer_name: vpsId, // Storing VPS ID
                    customer_phone: vpsId, // Storing VPS ID
                    phone: vpsId, // Storing VPS ID
                    notes: notes || '',
                    type: orderType,
                    items_count: cartItems.length
                })
                .select()
                .single()

            if (orderError) throw orderError

            const orderItems = cartItems.map((item) => ({
                order_id: order.id,
                menu_item_id: item.menu_item_id,
                name_kk: item.menu_item.name_kk || '',
                name_ru: item.menu_item.name_ru || '',
                quantity: item.quantity,
                price: item.menu_item.price || 0,
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) throw itemsError

            // Notify Admin via Push
            await notifyAdmin(order, 'order', restaurantId || undefined)

            if (paymentMethod === 'freedom') {
                const payRes = await fetch('/api/payment/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: order.id,
                        amount: orderType === 'delivery' ? total : subtotal,
                        description: `${t.cart.order_number_label} #${order.order_number || order.id.slice(0, 8)}`,
                        customerEmail: user.email,
                        customerPhone: phone
                    })
                })

                const payData = await payRes.json()
                if (payData.redirectUrl) {
                    clearLocalCart()
                    window.location.href = payData.redirectUrl
                    return
                } else {
                    throw new Error(payData.error || t.cart.payment_failed)
                }
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem('customer_phone', phone)
            }

            clearLocalCart()
            toast.success(t.cart.order_confirmed)
            router.push(`/orders/${order.id}`)
        } catch (error: any) {
            console.error('[Checkout] Error:', error)
            const message = error.message || error.details || t.cart.order_error
            toast.error(message, { duration: 5000 })
        } finally {
            setCheckoutLoading(false)
        }
    }

    if (cartItems.length === 0 && !checkoutLoading && orderType !== 'booking') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <div className="text-muted-foreground/20 mb-6">
                    <ShoppingCart className="w-20 h-20" />
                </div>
                <h2 className="text-xl font-bold mb-2">{t.cart.empty}</h2>
                <Button onClick={() => router.push('/')}>{t.cart.go_home}</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            <AnimatePresence>
                {checkoutLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="w-20 h-20 relative mb-6">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">
                            {locale === 'kk' ? 'Төлем бетіне өту...' : 'Переходим к оплате...'}
                        </h2>
                        <p className="text-sm text-muted-foreground italic">
                            {locale === 'kk' ? 'Бұл бірнеше секунд алуы мүмкін' : 'Это может занять несколько секунд'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <Header
                title={step === 'summary' ? t.cart.summary_title : t.cart.title}
                backButton={true}
                onBack={() => step === 'summary' ? setStep('form') : router.push('/cart')}
            />

            <main className="max-w-screen-md mx-auto px-4 py-6 space-y-6 pb-32">
                {step === 'auth' ? (
                    <CheckoutAuth onLogin={() => setStep('form')} />
                ) : step === 'form' ? (
                    <>
                        {/* Service Type Selection */}
                        <section className="space-y-3">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">{t.cart.service_type}</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'delivery', label: t.cart.delivery, icon: <Truck className="w-6 h-6" />, enabled: restaurantSettings?.is_delivery_enabled !== false },
                                    { id: 'pickup', label: t.cart.pickup, icon: <ShoppingBag className="w-6 h-6" />, enabled: restaurantSettings?.is_pickup_enabled !== false },
                                    { id: 'booking', label: t.cart.booking || (locale === 'kk' ? 'Брондау' : 'Бронь'), icon: <Calendar className="w-6 h-6" />, enabled: restaurantSettings?.is_booking_enabled !== false },
                                ].filter(s => s.enabled).map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setOrderType(s.id as any)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center",
                                            orderType === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-transparent text-muted-foreground"
                                        )}
                                    >
                                        {s.icon}
                                        <span className="text-[10px] font-bold">{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {orderType === 'booking' && bookingSubStep === 1 && (
                            <section className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                                <Card className="border-none shadow-sm rounded-3xl">
                                    <CardContent className="p-5 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">
                                                    {locale === 'kk' ? 'Күні' : 'Дата'}
                                                </label>
                                                <Input
                                                    type="date"
                                                    min={new Date().toISOString().split('T')[0]}
                                                    value={bookingDate}
                                                    onChange={(e) => setBookingDate(e.target.value)}
                                                    className="rounded-xl h-12 bg-muted/50 border-none px-4"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">
                                                    {locale === 'kk' ? 'Уақыты' : 'Время'}
                                                </label>
                                                <Input
                                                    type="time"
                                                    value={bookingTime}
                                                    onChange={(e) => setBookingTime(e.target.value)}
                                                    className="rounded-xl h-12 bg-muted/50 border-none px-4"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">
                                                    {locale === 'kk' ? 'Адам саны' : 'Кол-во людей'}
                                                </label>
                                                <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 h-12">
                                                    <button
                                                        onClick={() => setBookingGuests(Math.max(1, bookingGuests - 1))}
                                                        className="w-8 h-8 flex items-center justify-center font-bold text-xl"
                                                    >-</button>
                                                    <span className="flex-1 text-center font-bold">{bookingGuests}</span>
                                                    <button
                                                        onClick={() => setBookingGuests(bookingGuests + 1)}
                                                        className="w-8 h-8 flex items-center justify-center font-bold text-xl"
                                                    >+</button>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">
                                                    {locale === 'kk' ? 'Ұзақтығы (сағат)' : 'Длительность (час)'}
                                                </label>
                                                <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 h-12">
                                                    <button
                                                        onClick={() => setBookingDuration(Math.max(1, bookingDuration - 0.5))}
                                                        className="w-8 h-8 flex items-center justify-center font-bold text-xl"
                                                    >-</button>
                                                    <span className="flex-1 text-center font-bold">{bookingDuration}</span>
                                                    <button
                                                        onClick={() => setBookingDuration(bookingDuration + 0.5)}
                                                        className="w-8 h-8 flex items-center justify-center font-bold text-xl"
                                                    >+</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">
                                                {locale === 'kk' ? 'Үстел таңдаңыз' : 'Выберите столик'}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
                                                {availableTables.length > 0 ? (
                                                    availableTables.map((table: any) => (
                                                        <button
                                                            key={table.id}
                                                            onClick={() => setSelectedTableId(table.id)}
                                                            className={cn(
                                                                "p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                                                                selectedTableId === table.id
                                                                    ? "border-primary bg-primary/10 text-primary"
                                                                    : "border-muted bg-card text-muted-foreground"
                                                            )}
                                                        >
                                                            <span className="text-sm font-black">№{table.table_number}</span>
                                                            <span className="text-[10px] font-bold opacity-60">
                                                                {table.capacity} {lang === 'kk' ? 'орын' : 'мест'}
                                                            </span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="col-span-2 py-8 text-center bg-muted/30 rounded-2xl">
                                                        <p className="text-xs font-bold text-muted-foreground italic">
                                                            {locale === 'kk' ? 'Бос үстелдер табылмады' : 'Свободных столов не найдено'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full mt-2 h-14 rounded-2xl font-black text-lg gap-2"
                                            disabled={!selectedTableId || !bookingTime || !bookingDate}
                                            onClick={() => setBookingSubStep(2)}
                                        >
                                            {locale === 'kk' ? 'Әрі қарай' : 'Продолжить'}
                                            <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {orderType === 'booking' && bookingSubStep === 2 && (
                            <section className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                        {locale === 'kk' ? 'Тағамдарды таңдаңыз' : 'Выберите блюда'}
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => setBookingSubStep(1)} className="text-xs gap-1">
                                        <ChevronLeft className="w-4 h-4" /> {locale === 'kk' ? 'Артқа' : 'Назад'}
                                    </Button>
                                </div>
                                <Tabs defaultValue={categories[0]?.id || 'all'} className="w-full">
                                    <TabsList className="w-full justify-start gap-2 h-auto p-1 bg-muted/50 overflow-x-auto mb-4">
                                        {categories.map((cat) => (
                                            <TabsTrigger key={cat.id} value={cat.id} className="rounded-xl whitespace-nowrap px-4 py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                                                {locale === 'ru' ? cat.name_ru : cat.name_kk}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {categories.map((cat) => (
                                        <TabsContent key={cat.id} value={cat.id} className="grid grid-cols-1 gap-3 focus-visible:outline-none">
                                            {menuItems.filter(item => item.category_id === cat.id).map(item => (
                                                <MenuItemCard key={item.id} item={item} layout="horizontal" />
                                            ))}
                                        </TabsContent>
                                    ))}
                                </Tabs>

                                <div className="pt-4 sticky bottom-2 z-10">
                                    <Button
                                        className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-2xl"
                                        onClick={() => {
                                            if (orderType === 'booking') {
                                                setBookingSubStep(3)
                                            }
                                        }}
                                    >
                                        {cartItems.length > 0 
                                            ? (locale === 'kk' ? 'Таңдалған тағамдармен жалғастыру' : 'Продолжить с выбранными блюдами')
                                            : (locale === 'kk' ? 'Тағамсыз жалғастыру' : 'Продолжить без предзаказа')}
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </section>
                        )}

                        {/* Contact Details & Payment (Step 3 or Normal Flow) */}
                        {(orderType !== 'booking' || (orderType === 'booking' && bookingSubStep === 3)) && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                                {orderType === 'booking' && (
                                    <div className="space-y-4">
                                        <Button variant="ghost" size="sm" onClick={() => setBookingSubStep(2)} className="text-xs gap-1 px-1">
                                            <ChevronLeft className="w-4 h-4" /> {locale === 'kk' ? 'Мәзірге оралу' : 'Назад к меню'}
                                        </Button>

                                        {/* Financial Breakdown (Shown before contact info as requested) */}
                                        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-primary/5">
                                            <CardContent className="p-5 space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground font-medium">{t.cart.subtotal}</span>
                                                    <span className="font-bold">{subtotal.toLocaleString()} ₸</span>
                                                </div>
                                                <Separator className="bg-primary/10 my-1" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-base font-black text-foreground">{t.cart.total}</span>
                                                    <span className="text-xl font-black text-primary">{subtotal.toLocaleString()} ₸</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                                {/* Contact Details */}
                                <section className="space-y-3">
                                    {!authUser && (
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">{t.cart.details}</h3>
                                    )}
                                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                                        <CardContent className="p-5 space-y-4">
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t.common.fullName}</label>
                                                    <Input
                                                        placeholder={t.cart.name_placeholder}
                                                        className="rounded-xl h-12 bg-muted/50 border-none px-4"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t.common.phone}</label>
                                                    <Input
                                                        placeholder="+7 (700) 000-00-00"
                                                        className="rounded-xl h-12 bg-muted/50 border-none px-4"
                                                        value={phone}
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
                                                            setPhone(formatted);
                                                        }}
                                                        required
                                                    />
                                                </div>

                                                {orderType === 'delivery' && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t.cart.address}</label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder={t.cart.address_placeholder}
                                                                className="rounded-xl h-12 bg-muted/50 border-none flex-1 px-4"
                                                                value={address}
                                                                onChange={(e) => setAddress(e.target.value)}
                                                            />
                                                            <Button
                                                                variant="secondary"
                                                                size="icon"
                                                                className={cn("h-12 w-12 rounded-xl shrink-0 transition-all", coords ? "bg-primary/10 text-primary border border-primary/20" : "")}
                                                                onClick={() => setMapOpen(true)}
                                                            >
                                                                <MapIcon className="w-5 h-5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-1.5 pt-2">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">
                                                        {t.cart.notes}
                                                    </label>
                                                    <textarea
                                                        placeholder={t.cart.notes_placeholder}
                                                        className="w-full min-h-[100px] bg-muted/50 border-none rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </section>

                                {/* Payment Methods */}
                                <section className="space-y-3">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">{t.cart.payment_method}</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {restaurantSettings?.accept_kaspi && (
                                            <button
                                                onClick={() => handleSetPaymentMethod('kaspi')}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left bg-card",
                                                    paymentMethod === 'kaspi' ? "border-primary ring-1 ring-primary" : "border-transparent"
                                                )}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0">
                                                    <Wallet className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold">Kaspi.kz</p>
                                                </div>
                                                {paymentMethod === 'kaspi' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                            </button>
                                        )}
                                        {restaurantSettings?.accept_freedom && (
                                            <button
                                                onClick={() => handleSetPaymentMethod('freedom')}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left bg-card",
                                                    paymentMethod === 'freedom' ? "border-primary ring-1 ring-primary" : "border-transparent"
                                                )}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl shrink-0">💳</div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold">{locale === 'kk' ? 'Картамен төлеу' : 'Оплата картой'}</p>
                                                    <p className="text-[10px] text-muted-foreground">Visa, MasterCard, Maestro</p>
                                                </div>
                                                {paymentMethod === 'freedom' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                            </button>
                                        )}
                                        {restaurantSettings?.accept_cash && (
                                            <button
                                                onClick={() => handleSetPaymentMethod('cash')}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left bg-card",
                                                    paymentMethod === 'cash' ? "border-primary ring-1 ring-primary" : "border-transparent"
                                                )}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-xl shrink-0">💵</div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold">{locale === 'kk' ? 'Қолма-қол' : 'Наличными'}</p>
                                                </div>
                                                {paymentMethod === 'cash' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                            </button>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}
                    </>
                ) : (
                    /* Step 2: Summary */
                    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                        <section className="text-center py-4">
                            <h2 className="text-2xl font-black text-foreground">{t.cart.review_details}</h2>
                            <p className="text-sm text-muted-foreground">{t.cart.summary_title}</p>
                        </section>

                        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-background">
                            <CardContent className="p-8 space-y-8">
                                {/* Order Items Summary */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h4 className="font-bold text-lg">{t.cart.foodOrder}</h4>
                                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                            {cartItems.length} {t.cart.items_label}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center bg-muted/30 p-3 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center font-bold overflow-hidden shadow-sm">
                                                        {item.menu_item.image_url ? (
                                                            <img src={item.menu_item.image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Utensils className="w-5 h-5 text-muted-foreground/30" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold line-clamp-1">{locale === 'ru' ? item.menu_item.name_ru : item.menu_item.name_kk}</p>
                                                        <p className="text-[10px] text-muted-foreground">{item.quantity} × {item.menu_item.price}₸</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-foreground">{(item.menu_item.price * item.quantity).toLocaleString()}₸</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator className="bg-muted/50" />

                                {/* Delivery & Details Summary */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-lg">{t.cart.details}</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {orderType === 'booking' && (
                                            <div className="flex items-start gap-4 p-4 rounded-3xl bg-primary/5 border border-primary/10">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Calendar className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{locale === 'kk' ? 'Брондау' : 'Бронь'}</p>
                                                    <p className="text-sm font-bold leading-tight">{bookingDate} • {bookingTime}</p>
                                                    <p className="text-[10px] font-medium text-primary mt-1">{bookingGuests} {t.cart.guests} • {bookingDuration}ч</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-4 p-4 rounded-3xl bg-muted/20">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <MapPin className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.cart.address}</p>
                                                <p className="text-sm font-bold leading-tight">{orderType === 'delivery' ? address : (orderType === 'booking' ? (locale === 'kk' ? 'Стол №' : 'Стол №') + allTables.find(t => t.id === selectedTableId)?.table_number : t.cart.pickup)}</p>
                                                {distance && orderType === 'delivery' && (
                                                    <p className="text-[10px] font-medium text-primary mt-1">~{distance.toFixed(1)} км</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-4 rounded-3xl bg-muted/20">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <CreditCard className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.cart.payment_method}</p>
                                                <p className="text-sm font-bold">
                                                    {paymentMethod === 'kaspi' ? 'Kaspi.kz' : (paymentMethod === 'freedom' ? (locale === 'kk' ? 'Картамен төлеу' : 'Оплата картой') : (paymentMethod === 'cash' ? (locale === 'kk' ? 'Қолма-қол' : 'Наличными') : ''))}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Breakdown */}
                                <div className="bg-primary/5 rounded-[2rem] p-6 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">{t.cart.subtotal}</span>
                                        <span className="font-bold">{subtotal.toLocaleString()} ₸</span>
                                    </div>
                                    {orderType === 'delivery' && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t.cart.delivery}</span>
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold">
                                                    {!coords ? (
                                                        <span className="text-rose-500 animate-pulse text-[10px] uppercase font-black">
                                                            {locale === 'kk' ? 'Мекен-жай таңдалмаған' : 'Адрес не выбран'}
                                                        </span>
                                                    ) : (restaurantSettings && !restaurantSettings.latitude) ? (
                                                        <span className="text-rose-500 animate-pulse text-[10px] uppercase font-black">
                                                            {locale === 'kk' ? 'Есептеледі...' : 'Рассчитывается...'}
                                                        </span>
                                                    ) : calculatedFee === 0 ? (
                                                        <span className="text-green-500 font-black uppercase tracking-tighter text-xs">{t.cart.free_label}</span>
                                                    ) : (
                                                        `${calculatedFee.toLocaleString()} ₸`
                                                    )}
                                                </span>
                                                {distance !== null && distance > 0 && coords && (
                                                    <span className="text-[10px] text-muted-foreground font-medium italic">
                                                        ~{distance.toFixed(1)} {locale === 'kk' ? 'км' : 'км'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {orderType === 'booking' && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{locale === 'kk' ? 'Орын брондау' : 'Бронирование'}</span>
                                            <span className="font-bold">
                                                {calculatedFee === 0 ? (
                                                    <span className="text-green-500 font-black uppercase tracking-tighter text-xs">{t.cart.free_label}</span>
                                                ) : (
                                                    `${calculatedFee.toLocaleString()} ₸`
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <Separator className="bg-primary/10 my-1" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-black text-foreground">{t.cart.total}</span>
                                        <span className="text-2xl font-black text-primary">{(orderType === 'delivery' || orderType === 'booking' ? total : subtotal).toLocaleString()} ₸</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <button
                            onClick={() => setStep('form')}
                            className="w-full py-4 text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t.cart.back_to_edit}
                        </button>
                    </div>
                )}

                {step !== 'auth' && (orderType !== 'booking' || bookingSubStep === 3) && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-muted z-50">
                        <Button
                            className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={step === 'form' ? handleContinueToSummary : handleCheckout}
                            disabled={checkoutLoading}
                        >
                            {checkoutLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{t.cart.sending}</span>
                                </div>
                            ) : (
                                step === 'form' ? t.cart.continue_label : t.cart.confirm_and_pay
                            )}
                        </Button>
                    </div>
                )}

                <MapPicker
                    open={mapOpen}
                    onOpenChange={setMapOpen}
                    initialCoords={coords}
                    onSelect={(lat: number, lng: number, addr?: string) => {
                        setCoords({ lat, lng })
                        if (addr) setAddress(addr)
                    }}
                />

                {/* Kaspi Payment Modal */}
                <AnimatePresence>
                    {isKaspiModalOpen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                                onClick={() => {
                                    setIsKaspiModalOpen(false)
                                    // Use searchParams to get reservationId if stored, or just go to orders
                                    // Actually, we don't have reservationId easily here unless we store it in state
                                    router.push('/orders')
                                }}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-card border shadow-2xl rounded-[2.5rem] w-full max-w-sm overflow-hidden"
                            >
                                <div className="p-8 text-center space-y-6">
                                    <div className="w-20 h-20 bg-orange-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-orange-500/20">
                                        <Wallet className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black">{locale === 'kk' ? 'Kaspi арқылы төлеу' : 'Оплата через Kaspi'}</h3>
                                        <p className="text-muted-foreground text-sm font-medium">
                                            {locale === 'kk' 
                                                ? 'Брондауды растау үшін төлем жасаңыз. Төлемнен кейін чек жіберуді ұмытпаңыз.' 
                                                : 'Для подтверждения бронирования произведите оплату. Не забудьте отправить чек после оплаты.'}
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <Button 
                                            className="w-full h-14 rounded-2xl bg-[#f14635] hover:bg-[#d63a2b] text-white font-black text-lg gap-3"
                                            onClick={() => {
                                                if (restaurantSettings?.kaspi_link) {
                                                    window.open(restaurantSettings.kaspi_link, '_blank')
                                                }
                                            }}
                                        >
                                            <Navigation className="w-5 h-5" />
                                            Kaspi.kz өту
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            className="w-full h-12 rounded-2xl font-bold text-muted-foreground"
                                            onClick={() => {
                                                setIsKaspiModalOpen(false)
                                                router.push('/orders')
                                            }}
                                        >
                                            {locale === 'kk' ? 'Кейінірек төлеу' : 'Оплатить позже'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div >
    )
}
