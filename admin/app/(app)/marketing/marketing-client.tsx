'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Ticket, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { Promotion, Banner } from '@/lib/db'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
    initialPromoCodes: Promotion[]
    initialBanners: Banner[]
}

type Tab = 'promo' | 'banners'
type EditingPromo = Partial<Promotion> & { isNew?: boolean; temp_discount_type?: 'percent' | 'fixed'; temp_discount_value?: number }
type EditingBanner = Partial<Banner> & { isNew?: boolean }

const EMPTY_PROMO: EditingPromo = {
    promo_code: '',
    temp_discount_type: 'percent',
    temp_discount_value: 0,
    min_order_amount: 0,
    max_uses: null,
    is_active: true,
    isNew: true,
}

const EMPTY_BANNER: EditingBanner = {
    title_kk: '',
    title_ru: '',
    image_url: '',
    link_url: '',
    sort_order: 0,
    is_active: true,
    isNew: true,
}

export default function MarketingClient({ initialPromoCodes, initialBanners }: Props) {
    const { lang } = useApp()
    const [activeTab, setActiveTab] = useState<Tab>('promo')
    const [promoCodes, setPromoCodes] = useState<Promotion[]>(initialPromoCodes)
    const [banners, setBanners] = useState<Banner[]>(initialBanners)
    const [editingPromo, setEditingPromo] = useState<EditingPromo | null>(null)
    const [editingBanner, setEditingBanner] = useState<EditingBanner | null>(null)

    const supabase = createClient()

    async function savePromo() {
        if (!editingPromo) return
        const dType = editingPromo.temp_discount_type || (editingPromo.discount_percentage ? 'percent' : 'fixed')
        const dValue = editingPromo.temp_discount_value || (dType === 'percent' ? editingPromo.discount_percentage : editingPromo.discount_amount) || 0

        const payload = {
            promo_code: editingPromo.promo_code?.toUpperCase() || '',
            code: editingPromo.promo_code?.toUpperCase() || '', // compatibility
            title_kk: `Жеңілдік ${editingPromo.promo_code}`,
            title_ru: `Скидка ${editingPromo.promo_code}`,
            discount_percentage: dType === 'percent' ? Number(dValue) : null,
            discount_amount: dType === 'fixed' ? Number(dValue) : null,
            min_order_amount: Number(editingPromo.min_order_amount) || 0,
            max_uses: editingPromo.max_uses ? Number(editingPromo.max_uses) : null,
            is_active: editingPromo.is_active ?? true,
            valid_until: editingPromo.valid_until || null,
        }

        if (editingPromo.isNew) {
            const { data, error } = await supabase.from('promotions').insert(payload).select('*').single()
            if (error) { console.error(error); toast.error(t(lang, 'error')); return }
            setPromoCodes((prev) => [data, ...prev])
        } else {
            const { error } = await supabase.from('promotions')
                .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingPromo.id!)
            if (error) { console.error(error); toast.error(t(lang, 'error')); return }
            setPromoCodes((prev) => prev.map((p) => p.id === editingPromo.id ? { ...p, ...payload } : p))
        }
        setEditingPromo(null)
        toast.success(t(lang, 'save'))
    }

    async function deletePromo(id: string) {
        const { error } = await supabase.from('promotions').delete().eq('id', id)
        if (!error) setPromoCodes((prev) => prev.filter((p) => p.id !== id))
        else toast.error(t(lang, 'error'))
    }

    async function saveBanner() {
        if (!editingBanner) return
        const payload = {
            title_kk: editingBanner.title_kk || '',
            title_ru: editingBanner.title_ru || '',
            image_url: editingBanner.image_url || '',
            link_url: editingBanner.link_url || '',
            sort_order: Number(editingBanner.sort_order) || 0,
            is_active: editingBanner.is_active ?? true,
        }

        if (editingBanner.isNew) {
            const { data, error } = await supabase.from('banners').insert(payload).select('*').single()
            if (error) { toast.error(t(lang, 'error')); return }
            setBanners((prev) => [...prev, data].sort((a, b) => a.sort_order - b.sort_order))
        } else {
            const { error } = await supabase.from('banners')
                .update({ ...payload }).eq('id', editingBanner.id!)
            if (error) { toast.error(t(lang, 'error')); return }
            setBanners((prev) => prev.map((b) => b.id === editingBanner.id ? { ...b, ...payload } : b).sort((a, b) => a.sort_order - b.sort_order))
        }
        setEditingBanner(null)
        toast.success(t(lang, 'save'))
    }

    async function deleteBanner(id: string) {
        const { error } = await supabase.from('banners').delete().eq('id', id)
        if (!error) setBanners((prev) => prev.filter((b) => b.id !== id))
        else toast.error(t(lang, 'error'))
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="bg-card px-4 pt-4 md:pt-12 pb-3 border-b border-border">
                <div className="flex items-center gap-3 mb-4">
                    <Link href="/management" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <ArrowLeft className="w-3.5 h-3.5 text-foreground" />
                    </Link>
                    <h1 className="text-xl font-bold text-foreground flex-1">{t(lang, 'marketing')}</h1>
                    <button
                        onClick={() => activeTab === 'promo' ? setEditingPromo(EMPTY_PROMO) : setEditingBanner(EMPTY_BANNER)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                    >
                        <Plus className="w-3.5 h-3.5 text-foreground" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-secondary p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('promo')}
                        className={cn(
                            'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                            activeTab === 'promo' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                        )}
                    >
                        {t(lang, 'promoCodes')}
                    </button>
                    <button
                        onClick={() => setActiveTab('banners')}
                        className={cn(
                            'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                            activeTab === 'banners' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                        )}
                    >
                        {t(lang, 'banners')}
                    </button>
                </div>
            </div>

            <div className="flex-1 px-4 py-4">
                {activeTab === 'promo' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {promoCodes.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm py-10">{t(lang, 'noData')}</p>
                        ) : (
                            promoCodes.map((p) => (
                                <div key={p.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                                        <Ticket className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-foreground">{p.promo_code}</p>
                                            {!p.is_active && (
                                                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                                                    {t(lang, 'inactive')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {p.discount_percentage ? `-${p.discount_percentage}%` : `-${p.discount_amount} ₸`}
                                            {p.min_order_amount > 0 && ` • ${t(lang, 'minOrder')} ${p.min_order_amount} ₸`}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingPromo({ ...p, isNew: false })} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                                            <Pencil className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                        <button onClick={() => deletePromo(p.id)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {banners.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm py-10">{t(lang, 'noData')}</p>
                        ) : (
                            banners.map((b) => (
                                <div key={b.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                                    <div className="aspect-[21/9] bg-secondary relative">
                                        {b.image_url ? (
                                            <img src={b.image_url} alt={b.title_ru} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        {!b.is_active && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <span className="bg-background/90 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    {t(lang, 'inactive')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{lang === 'kk' ? b.title_kk : b.title_ru}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{b.link_url || t(lang, 'noLimit')}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => setEditingBanner({ ...b, isNew: false })} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                                                <Pencil className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            <button onClick={() => deleteBanner(b.id)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Promo Edit Modal */}
            {editingPromo && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setEditingPromo(null)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-md bg-card rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground">
                                {editingPromo.isNew ? t(lang, 'addPromo') : t(lang, 'edit')}
                            </h2>
                            <button onClick={() => setEditingPromo(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">CODE</label>
                                <input
                                    value={editingPromo.promo_code || ''}
                                    onChange={(e) => setEditingPromo({ ...editingPromo, promo_code: e.target.value.toUpperCase() })}
                                    placeholder="PROMO2024"
                                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm font-bold text-foreground outline-none border border-transparent focus:border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{t(lang, 'discountPercent')}</label>
                                    <select
                                        value={editingPromo.temp_discount_type || 'percent'}
                                        onChange={(e) => setEditingPromo({ ...editingPromo, temp_discount_type: e.target.value as any })}
                                        className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-transparent focus:border-primary/50"
                                    >
                                        <option value="percent">%</option>
                                        <option value="fixed">₸</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{t(lang, 'price')}</label>
                                    <input
                                        type="number"
                                        value={editingPromo.temp_discount_value || ''}
                                        onChange={(e) => setEditingPromo({ ...editingPromo, temp_discount_value: Number(e.target.value) })}
                                        className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-transparent focus:border-primary/50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">{t(lang, 'minOrder')} ₸</label>
                                <input
                                    type="number"
                                    value={editingPromo.min_order_amount || ''}
                                    onChange={(e) => setEditingPromo({ ...editingPromo, min_order_amount: Number(e.target.value) })}
                                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-transparent focus:border-primary/50"
                                />
                            </div>
                            <div className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2.5">
                                <span className="text-sm text-foreground">{t(lang, 'active')}</span>
                                <button
                                    onClick={() => setEditingPromo({ ...editingPromo, is_active: !editingPromo.is_active })}
                                    className={cn('w-10 h-5 rounded-full transition-all relative', editingPromo.is_active ? 'bg-primary' : 'bg-muted')}
                                >
                                    <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm', editingPromo.is_active ? 'right-0.5' : 'left-0.5')} />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={savePromo}
                            className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <Check className="w-4 h-4" /> {t(lang, 'save')}
                        </button>
                    </div>
                </div>
            )}

            {/* Banner Edit Modal */}
            {editingBanner && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setEditingBanner(null)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-md bg-card rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground">
                                {editingBanner.isNew ? t(lang, 'addBanner') : t(lang, 'edit')}
                            </h2>
                            <button onClick={() => setEditingBanner(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">{t(lang, 'name')} (RU)</label>
                                <input
                                    value={editingBanner.title_ru || ''}
                                    onChange={(e) => setEditingBanner({ ...editingBanner, title_ru: e.target.value })}
                                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-transparent focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">{t(lang, 'name')} (KK)</label>
                                <input
                                    value={editingBanner.title_kk || ''}
                                    onChange={(e) => setEditingBanner({ ...editingBanner, title_kk: e.target.value })}
                                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-transparent focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">IMAGE URL</label>
                                <input
                                    value={editingBanner.image_url || ''}
                                    onChange={(e) => setEditingBanner({ ...editingBanner, image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-transparent focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">LINK (HREF)</label>
                                <input
                                    value={editingBanner.link_url || ''}
                                    onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })}
                                    placeholder="/menu?cat=..."
                                    className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-transparent focus:border-primary/50"
                                />
                            </div>
                        </div>

                        <button
                            onClick={saveBanner}
                            className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <Check className="w-4 h-4" /> {t(lang, 'save')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
