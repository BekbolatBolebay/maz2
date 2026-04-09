'use client'

import { useState, useEffect } from 'react'
import {
    Clock,
    CheckCircle2,
    Package,
    Bike,
    PartyPopper,
    CreditCard,
    Flame,
    Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/i18n-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface OrderTrackerProps {
    orderId: string
    initialStatus: string
    initialUpdatedAt: string
    initialEstimatedReadyAt?: string | null
    orderType?: 'delivery' | 'pickup' | 'booking'
    deliveryFee?: number
    totalAmount?: number
}

interface StatusStep {
    key: string
    icon: typeof Clock
    label: string
    gradient: string
    textColor: string
    bgColor: string
}

export function OrderTracker({ orderId, initialStatus, initialUpdatedAt, initialEstimatedReadyAt, orderType = 'delivery', deliveryFee: initialDeliveryFee, totalAmount: initialTotalAmount }: OrderTrackerProps) {
    const { t, locale } = useI18n()
    const [status, setStatus] = useState(initialStatus)
    const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)
    const [estimatedReadyAt, setEstimatedReadyAt] = useState(initialEstimatedReadyAt)
    const [deliveryFee, setDeliveryFee] = useState(initialDeliveryFee || 0)
    const [totalAmount, setTotalAmount] = useState(initialTotalAmount || 0)
    const [isUpdating, setIsUpdating] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel(`order-tracker-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`
                },
                (payload) => {
                    const newStatus = payload.new.status
                    if (newStatus !== status || payload.new.estimated_ready_at !== estimatedReadyAt || payload.new.delivery_fee !== deliveryFee) {
                        setStatus(newStatus)
                        setUpdatedAt(payload.new.updated_at)
                        setEstimatedReadyAt(payload.new.estimated_ready_at)
                        setDeliveryFee(payload.new.delivery_fee)
                        setTotalAmount(payload.new.total_amount)

                        if (newStatus !== status) {
                            const translatedStatus = (t.orders.status as any)[newStatus] || newStatus
                            toast.info(`${t.orders.statusChangedToast}${translatedStatus}`)
                        }

                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate([200, 100, 200])
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [orderId, status, t])

    const normalizedStatus = (status || '').toLowerCase().trim()

    const pickupSteps: StatusStep[] = [
        { key: 'pending', icon: Clock, label: (t.orders.status as any).pending, gradient: 'from-slate-400 to-slate-600', textColor: 'text-slate-700', bgColor: 'bg-slate-100' },
        { key: 'awaiting_payment', icon: CreditCard, label: (t.orders.status as any).awaiting_payment || 'Төлем жасай', gradient: 'from-amber-400 to-amber-600', textColor: 'text-amber-700', bgColor: 'bg-amber-100' },
        { key: 'accepted', icon: CheckCircle2, label: (t.orders.status as any).accepted, gradient: 'from-blue-400 to-blue-600', textColor: 'text-blue-700', bgColor: 'bg-blue-100' },
        { key: 'preparing', icon: Flame, label: (t.orders.status as any).preparing, gradient: 'from-orange-400 to-orange-600', textColor: 'text-orange-700', bgColor: 'bg-orange-100' },
        { key: 'ready', icon: Package, label: (t.orders.status as any).ready, gradient: 'from-emerald-400 to-emerald-600', textColor: 'text-emerald-700', bgColor: 'bg-emerald-100' },
        { key: 'completed', icon: PartyPopper, label: (t.orders.status as any).completed, gradient: 'from-green-400 to-green-600', textColor: 'text-green-700', bgColor: 'bg-green-100' },
    ]

    const deliverySteps: StatusStep[] = [
        { key: 'pending', icon: Clock, label: (t.orders.status as any).pending, gradient: 'from-slate-400 to-slate-600', textColor: 'text-slate-700', bgColor: 'bg-slate-100' },
        { key: 'awaiting_approval', icon: CheckCircle2, label: (t.orders.status as any).statusAwaitingApproval || 'Келісу', gradient: 'from-rose-400 to-rose-600', textColor: 'text-rose-700', bgColor: 'bg-rose-100' },
        { key: 'awaiting_payment', icon: CreditCard, label: (t.orders.status as any).statusAwaitingPayment || 'Төлем жасай', gradient: 'from-amber-400 to-amber-600', textColor: 'text-amber-700', bgColor: 'bg-amber-100' },
        { key: 'accepted', icon: CheckCircle2, label: (t.orders.status as any).statusAccepted, gradient: 'from-blue-400 to-blue-600', textColor: 'text-blue-700', bgColor: 'bg-blue-100' },
        { key: 'preparing', icon: Flame, label: (t.orders.status as any).preparing, gradient: 'from-orange-400 to-orange-600', textColor: 'text-orange-700', bgColor: 'bg-orange-100' },
        { key: 'ready', icon: Package, label: (t.orders.status as any).ready, gradient: 'from-yellow-400 to-yellow-600', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100' },
        { key: 'on_the_way', icon: Bike, label: (t.orders.status as any).on_the_way, gradient: 'from-purple-400 to-purple-600', textColor: 'text-purple-700', bgColor: 'bg-purple-100' },
        { key: 'completed', icon: PartyPopper, label: (t.orders.status as any).statusCompleted, gradient: 'from-green-400 to-green-600', textColor: 'text-green-700', bgColor: 'bg-green-100' },
    ]

    const allSteps = orderType === 'pickup' ? pickupSteps : deliverySteps
    const currentIndex = allSteps.findIndex(s => s.key === normalizedStatus)
    const displayIndex = currentIndex === -1 ? 0 : currentIndex
    const currentStepData = allSteps[displayIndex] || allSteps[0]

    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    useEffect(() => {
        if (!estimatedReadyAt || !['accepted', 'preparing'].includes(normalizedStatus)) {
            setTimeLeft(null)
            return
        }

        const calculateTimeLeft = () => {
            const diff = new Date(estimatedReadyAt).getTime() - new Date().getTime()
            const minutes = Math.max(0, Math.ceil(diff / 60000))
            setTimeLeft(minutes)
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 60000)
        return () => clearInterval(timer)
    }, [estimatedReadyAt, normalizedStatus])

    const handleApproveQuote = async () => {
        setIsUpdating(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('orders')
            .update({
                status: 'awaiting_payment',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)

        if (error) {
            toast.error(locale === 'ru' ? 'Ошибка при сохранении' : 'Сақтау кезінде қате шықты')
        } else {
            toast.success(locale === 'ru' ? 'Принято!' : 'Қабылданды!')
            setStatus('awaiting_payment')
        }
        setIsUpdating(false)
    }

    return (
        <div className="space-y-6">
            {normalizedStatus === 'awaiting_approval' && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/50 rounded-[2rem] p-6 shadow-sm animate-in fade-in slide-in-from-top duration-500 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/60 dark:text-rose-400/50">
                                {locale === 'ru' ? 'Стоимость доставки' : 'Жеткізу бағасы'}
                            </p>
                            <p className="text-2xl font-black text-rose-700 dark:text-rose-300">
                                {deliveryFee} ₸
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/60 dark:text-rose-400/50">
                                {locale === 'ru' ? 'Общий счет' : 'Жалпы сомма'}
                            </p>
                            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                                {totalAmount} ₸
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleApproveQuote}
                        disabled={isUpdating}
                        className="w-full bg-rose-600 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : (locale === 'ru' ? 'Согласен' : 'Келісемін')}
                    </button>
                    <p className="text-[10px] text-center text-rose-600/70 font-medium">
                        {locale === 'ru' ? '* Нажимая мақұлдау, вы подтверждаете итоговую сумму заказа' : '* "Келісемін" басу арқылы сіз тапсырыстың жалпы соммасын растайсыз'}
                    </p>
                </div>
            )}
            {normalizedStatus === 'pending' && orderType === 'delivery' && deliveryFee === 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900/50 rounded-[2rem] p-6 shadow-sm animate-in fade-in slide-in-from-top duration-500 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                        <Bike className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-bounce" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            {locale === 'ru' ? 'Стоимость доставки рассчитывается' : 'Жеткізу ақысы есептелуде'}
                        </p>
                        <p className="text-[10px] text-blue-600/70 dark:text-blue-400/50 font-medium">
                            {locale === 'ru' ? 'Администратор скоро пришлет цену для подтверждения' : 'Жақын арада админ растау үшін бағаны жібереді'}
                        </p>
                    </div>
                </div>
            )}
            {['accepted', 'preparing'].includes(normalizedStatus) && estimatedReadyAt && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-900/50 rounded-[2rem] p-5 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-xl font-black text-orange-700 dark:text-orange-300">
                                {locale === 'ru' ? 'Примерно' : 'Шамамен'} {timeLeft} {locale === 'ru' ? 'минут' : 'минут'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 dark:text-orange-400/50">
                            {locale === 'ru' ? 'Статус' : 'Статус'}
                        </p>
                        <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {locale === 'ru' ? 'Готовится' : 'Дайындалуда'}
                        </p>
                    </div>
                </div>
            )}

            <div className={cn(
                "rounded-3xl p-6 transition-all duration-700 shadow-lg text-white",
                `bg-gradient-to-br ${currentStepData.gradient}`
            )}>
                <div className="flex flex-col items-center text-center">
                    <div className={cn(
                        "w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-inner",
                        normalizedStatus === 'on_the_way' && 'animate-bounce'
                    )}>
                        <currentStepData.icon className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-1">
                        {currentStepData.label}
                    </h2>
                    <p className="text-white/80 text-xs font-medium">
                        {mounted && `${t.orders.updatedAtLabel}: ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                </div>
            </div>

            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                <h3 className="font-bold text-lg mb-6">
                    {locale === 'ru' ? 'Прогресс заказа' : 'Тапсырыс прогресі'}
                </h3>
                <div className="relative">
                    {/* Vertical line connecting all steps */}
                    <div className="absolute left-5 top-0 bottom-0 w-1 bg-muted" />

                    <div className="space-y-8 relative">
                        {allSteps.map((step, index) => {
                            const isCompleted = index < displayIndex
                            const isCurrent = index === displayIndex
                            const isFuture = index > displayIndex
                            const Icon = step.icon

                            return (
                                <div key={step.key} className="flex items-start gap-4 relative">
                                    {/* Step circle indicator */}
                                    <div className={cn(
                                        'relative z-10 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 shadow-sm',
                                        isCompleted && 'bg-emerald-500 border-2 border-emerald-600',
                                        isCurrent && `bg-gradient-to-br ${step.gradient} border-2 border-white ring-4 ring-primary/20 animate-pulse`,
                                        isFuture && 'bg-muted border-2 border-muted-foreground/10'
                                    )}>
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        ) : (
                                            <Icon className={cn(
                                                'w-5 h-5 transition-colors',
                                                isCurrent && 'text-white',
                                                isFuture && 'text-muted-foreground/40'
                                            )} />
                                        )}
                                    </div>

                                    {/* Step content */}
                                    <div className={cn(
                                        'pt-1 flex-1 transition-all duration-300',
                                        isFuture && 'opacity-40'
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <p className={cn(
                                                'font-bold text-base transition-colors',
                                                isCompleted && 'text-emerald-600',
                                                isCurrent && 'text-foreground',
                                                isFuture && 'text-muted-foreground'
                                            )}>
                                                {step.label}
                                            </p>
                                            {isCompleted && (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                                    ✓ {locale === 'ru' ? 'ЗАВЕРШЕНО' : 'АЯҚТАЛДЫ'}
                                                </span>
                                            )}
                                        </div>
                                        {isCurrent && (
                                            <div className="space-y-1">
                                                <p className="text-xs text-primary font-bold mt-0.5 flex items-center gap-1.5">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    {locale === 'ru' ? 'В процессе...' : 'Орындалуда...'}
                                                </p>
                                                {['accepted', 'preparing'].includes(step.key) && estimatedReadyAt && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg w-fit">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            {locale === 'ru' ? 'Будет готово к' : 'Дайын болады:'} {new Date(estimatedReadyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
