'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { Reservation } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Calendar, Clock, Users, Phone, ChefHat, CheckCircle, XCircle, Loader2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { addTable, updateTable, deleteTable } from '@/lib/actions'
import type { RestaurantTable } from '@/lib/db'

const STATUS_TABS = ['all', 'pending', 'awaiting_payment', 'confirmed', 'cancelled', 'completed'] as const
const MAIN_TABS = ['reservations', 'tables'] as const

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    awaiting_payment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
}

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
}

const statusLabels: Record<string, { kk: string; ru: string }> = {
    pending: { kk: 'Күтуде', ru: 'Ожидает' },
    awaiting_payment: { kk: 'Төлем күтілуде', ru: 'Ожидает оплаты' },
    confirmed: { kk: 'Расталды', ru: 'Подтверждено' },
    cancelled: { kk: 'Бас тартылды', ru: 'Отменено' },
    completed: { kk: 'Аяқталды', ru: 'Завершено' },
    all: { kk: 'Барлығы', ru: 'Все' },
}

async function updateReservationStatus(id: string, status: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id)
    return { error }
}

async function updateReservationPaymentStatus(id: string, payment_status: string, payment_url?: string) {
    const supabase = createClient()
    const update: any = { payment_status }
    if (payment_url) {
        update.payment_url = payment_url
        update.status = 'awaiting_payment'
    }
    const { error } = await supabase
        .from('reservations')
        .update(update)
        .eq('id', id)
    return { error }
}

export default function TablesClient({ initialTables, restaurantId }: { initialTables: RestaurantTable[], restaurantId: string }) {
    const { lang } = useApp()
    const [tables, setTables] = useState<RestaurantTable[]>(initialTables)
    const [showAddTable, setShowAddTable] = useState(false)
    const [newTable, setNewTable] = useState({ table_number: '', capacity: 4 })

    async function handleAddTable() {
        if (!newTable.table_number) return
        const { error, data } = await addTable(newTable, restaurantId)
        if (error) toast.error('Қате кетті')
        else {
            setTables(prev => [...prev, data])
            setShowAddTable(false)
            setNewTable({ table_number: '', capacity: 4 })
            toast.success('Үстел қосылды')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm(t(lang, 'confirmDelete' as any))) return
        const { error } = await deleteTable(id)
        if (error) toast.error(t(lang, 'error'))
        else {
            setTables(prev => prev.filter(t => t.id !== id))
            toast.success(t(lang, 'deleted' as any))
        }
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border">
                <h1 className="text-2xl font-bold text-foreground">
                    {lang === 'kk' ? 'Үстелдер' : 'Столы'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {lang === 'kk' ? `Жалпы: ${tables.length} үстел` : `Всего: ${tables.length} столов`}
                </p>
            </div>

            <div className="flex-1 px-4 py-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{t(lang, 'tablesManagement' as any)}</h2>
                    <button
                        onClick={() => setShowAddTable(true)}
                        className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl"
                    >
                        + {t(lang, 'addTable' as any)}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {tables.map(table => (
                        <div key={table.id} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-xl font-bold">
                                    {table.table_number}
                                </div>
                                <div>
                                    <p className="font-bold">№{table.table_number} үстел</p>
                                    <p className="text-xs text-muted-foreground">{table.capacity} адамдық</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(table.id)}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>

                {showAddTable && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-card w-full max-sm rounded-[32px] p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                            <h3 className="text-xl font-bold">{t(lang, 'addTable' as any)}</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">{t(lang, 'tableNumber' as any)}</label>
                                    <input
                                        value={newTable.table_number}
                                        onChange={e => setNewTable(prev => ({ ...prev, table_number: e.target.value }))}
                                        placeholder={lang === 'kk' ? "Мысалы: 5 немесе VIP" : "Например: 5 или VIP"}
                                        className="w-full bg-secondary rounded-2xl px-4 py-3 outline-none mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">{t(lang, 'capacity' as any)}</label>
                                    <div className="flex items-center gap-4 mt-1">
                                        <button
                                            onClick={() => setNewTable(prev => ({ ...prev, capacity: Math.max(1, prev.capacity - 1) }))}
                                            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl font-bold"
                                        >−</button>
                                        <span className="text-xl font-bold">{newTable.capacity}</span>
                                        <button
                                            onClick={() => setNewTable(prev => ({ ...prev, capacity: Math.min(20, prev.capacity + 1) }))}
                                            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl font-bold"
                                        >+</button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowAddTable(false)}
                                    className="flex-1 bg-secondary text-foreground font-bold py-3 rounded-2xl"
                                >{t(lang, 'cancel')}</button>
                                <button
                                    onClick={handleAddTable}
                                    className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-2xl"
                                >{t(lang, 'add' as any)}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
