'use client'

import { useState } from 'react'
import { ArrowLeft, Search, User, Phone, MapPin, ClipboardList, Trash2, X, Check, Star } from 'lucide-react'
import Link from 'next/link'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ClientsClient({ initialClients }: { initialClients: any[] }) {
    const { lang } = useApp()
    const [clients, setClients] = useState<any[]>(initialClients)
    const [search, setSearch] = useState('')
    const [selectedClient, setSelectedClient] = useState<any | null>(null)

    const supabase = createClient()

    const filtered = clients.filter(c =>
        c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.customer_phone?.includes(search)
    )

    async function deleteClient(id: string | null) {
        if (!id) {
            toast.error(lang === 'kk' ? 'Бұл клиентті өшіру мүмкін емес (тіркелмеген)' : 'Невозможно удалить этого клиента (не зарегистрирован)')
            return
        }

        if (!confirm(lang === 'kk' ? 'Өшіруді растайсыз ба?' : 'Вы уверены, что хотите удалить?')) return

        try {
            const response = await fetch(`/api/clients/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setClients(prev => prev.filter(c => c.id !== id))
                setSelectedClient(null)
                toast.success(lang === 'kk' ? 'Сәтті жойылды' : 'Успешно удалено')
            } else {
                const errorData = await response.json()
                toast.error(errorData.error || t(lang, 'error'))
            }
        } catch (err) {
            toast.error(t(lang, 'error'))
        }
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="bg-card px-4 pt-4 md:pt-12 pb-3 border-b border-border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <Link href="/management" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <ArrowLeft className="w-3.5 h-3.5 text-foreground" />
                    </Link>
                    <h1 className="text-xl font-bold text-foreground flex-1">Клиенттер</h1>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t(lang, 'search')}
                        className="w-full bg-secondary rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground outline-none border border-transparent focus:border-primary/50"
                    />
                </div>
            </div>

            <div className="flex-1 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-10">{t(lang, 'noData')}</p>
                ) : (
                    filtered.map((c) => (
                        <div
                            key={c.customer_phone}
                            onClick={() => setSelectedClient(c)}
                            className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <User className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{c.customer_name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">{c.customer_phone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-primary">{c.total_orders} тапсырыс</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{c.total_spent.toLocaleString()} ₸</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Client Detail Modal */}
            {selectedClient && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedClient(null)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-md bg-card rounded-t-3xl p-6 space-y-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground">Клиент мәліметі</h2>
                            <button onClick={() => setSelectedClient(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">{selectedClient.customer_name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedClient.customer_phone}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-secondary/40 rounded-2xl p-4">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Тапсырыс саны</p>
                                <p className="text-xl font-bold text-foreground">{selectedClient.total_orders}</p>
                            </div>
                            <div className="bg-secondary/40 rounded-2xl p-4">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Жалпы сома</p>
                                <p className="text-xl font-bold text-primary">{selectedClient.total_spent.toLocaleString()} ₸</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 bg-secondary/20 p-3 rounded-xl">
                                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Соңғы мекенжай</p>
                                    <p className="text-sm text-foreground mt-0.5">{selectedClient.last_address || '—'}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => deleteClient(selectedClient.id)}
                            className="w-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                        >
                            <Trash2 className="w-4 h-4" /> Клиентті жою
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
