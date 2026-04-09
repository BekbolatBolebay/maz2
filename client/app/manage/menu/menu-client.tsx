'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Search, AlertCircle, Pencil, Trash2, X, Check, Tag, Loader2, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/i18n-context'
import { addMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/cafe-actions'
import type { MenuItem, Category } from '@/lib/cafe-db'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import ImageUpload from '@/components/ui/image-upload'

interface Props {
    initialItems: MenuItem[]
    initialCategories: Category[]
}

type EditingItem = Partial<MenuItem> & { isNew?: boolean }

const EMPTY_ITEM: EditingItem = {
    name_kk: '', name_ru: '', name_en: '', description_ru: '', description_kk: '', description_en: '',
    price: 0, is_available: true, is_stop_list: false,
    category_id: null, image_url: '', isNew: true,
}

export default function MenuClient({ initialItems, initialCategories }: Props) {
    const { t, locale } = useI18n()
    const [items, setItems] = useState<MenuItem[]>(initialItems)
    const [categories, setCategories] = useState<Category[]>(initialCategories)
    const [activeCat, setActiveCat] = useState<string>('all')
    const [search, setSearch] = useState('')
    const [editing, setEditing] = useState<EditingItem | null>(null)
    const [showStopList, setShowStopList] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const filtered = items.filter((item) => {
        const matchCat = activeCat === 'all' || item.category_id === activeCat
        const matchStop = !showStopList || item.is_stop_list
        const name = locale === 'ru' ? item.name_ru : item.name_kk // Following project convention
        const matchSearch = name?.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch && matchStop
    })

    async function toggleAvailability(item: MenuItem) {
        const newVal = !item.is_stop_list
        const { error } = await updateMenuItem(item.id, {
            is_stop_list: newVal,
            is_available: !newVal
        })
        if (!error) {
            setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_stop_list: newVal, is_available: !newVal } : i))
        } else toast.error(t('common.error'))
    }

    async function saveItem() {
        if (!editing || isUploading) return
        const payload = {
            name_kk: editing.name_kk || '',
            name_ru: editing.name_ru || '',
            name_en: editing.name_en || editing.name_ru || '',
            description_kk: editing.description_kk || '',
            description_ru: editing.description_ru || '',
            description_en: editing.description_en || editing.description_ru || '',
            price: Number(editing.price) || 0,
            is_available: editing.is_available ?? true,
            is_stop_list: editing.is_stop_list ?? false,
            category_id: editing.category_id || null,
            image_url: editing.image_url || '',
        }

        if (editing.isNew) {
            const { data, error } = await addMenuItem(payload)
            if (error) { toast.error(t('common.error')); return }
            setItems((prev) => [...prev, data as MenuItem])
        } else {
            const { error } = await updateMenuItem(editing.id!, payload)
            if (error) { toast.error(t('common.error')); return }
            setItems((prev) => prev.map((i) => i.id === editing.id ? { ...i, ...payload } : i))
        }
        setEditing(null)
        toast.success(t('common.save'))
    }

    async function deleteItem(id: string) {
        const { error } = await deleteMenuItem(id)
        if (!error) setItems((prev) => prev.filter((i) => i.id !== id))
        else toast.error(t('common.error'))
    }

    const getCatName = (id: string | null) => {
        if (!id) return ''
        const c = categories.find((c) => c.id === id)
        return c ? (locale === 'ru' ? c.name_ru : c.name_kk) : ''
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="bg-card px-4 pt-4 pb-3 border-b border-border">
                <div className="flex items-center gap-3 mb-4">
                    <Link href="/manage" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <ArrowLeft className="w-3.5 h-3.5 text-foreground" />
                    </Link>
                    <h1 className="text-xl font-bold text-foreground flex-1">{t('admin.menuManagement')}</h1>
                    <button
                        onClick={() => setEditing({ ...EMPTY_ITEM, category_id: activeCat !== 'all' ? activeCat : null })}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                    >
                        <Plus className="w-3.5 h-3.5 text-foreground" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('common.search')}
                        className="w-full bg-secondary rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/50"
                    />
                </div>

                {/* Filter row */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowStopList(!showStopList)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0',
                            showStopList ? 'bg-red-500 text-white' : 'bg-secondary text-muted-foreground'
                        )}
                    >
                        <AlertCircle className="w-3 h-3" /> {t('admin.stopList')}
                    </button>
                    <div className="flex gap-1 overflow-x-auto scrollbar-none">
                        <button
                            onClick={() => setActiveCat('all')}
                            className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                                activeCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}
                        >
                            {t('admin.all')}
                        </button>
                        {categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setActiveCat(c.id)}
                                className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                                    activeCat === c.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}
                            >
                                {locale === 'ru' ? c.name_ru : c.name_kk}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Item list */}
            <div className="flex-1 px-4 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-10">{t('admin.noData')}</p>
                ) : (
                    filtered.map((item) => {
                        const name = locale === 'ru' ? item.name_ru : item.name_kk
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    'bg-card rounded-2xl border p-3 flex items-center gap-3 transition-all',
                                    item.is_stop_list ? 'border-red-200 dark:border-red-900 opacity-70' : 'border-border'
                                )}
                            >
                                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Tag className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                                        {item.is_stop_list && (
                                            <span className="shrink-0 text-[10px] bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">
                                                {t('admin.outOfStock')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{getCatName(item.category_id)}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-sm font-bold text-primary">{Number(item.price).toLocaleString()} ₸</span>
                                        {item.original_price && (
                                            <span className="text-xs text-muted-foreground line-through">{Number(item.original_price).toLocaleString()} ₸</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 items-end">
                                    <button
                                        onClick={() => toggleAvailability(item)}
                                        className={cn(
                                            'w-8 h-4 rounded-full transition-all relative',
                                            !item.is_stop_list ? 'bg-primary' : 'bg-muted'
                                        )}
                                    >
                                        <span className={cn(
                                            'absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm',
                                            !item.is_stop_list ? 'right-0.5' : 'left-0.5'
                                        )} />
                                    </button>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setEditing({ ...item, isNew: false })}
                                            className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                                        >
                                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                        </button>
                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Edit/Add modal */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" onClick={() => setEditing(null)}>
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
                    <div
                        className="relative w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl border border-border animate-in fade-in slide-in-from-bottom-8 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">
                                {editing.isNew ? t('admin.addItem') : t('common.edit')}
                            </h2>
                            <button onClick={() => setEditing(null)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                            <div className="flex justify-center mb-6">
                                <ImageUpload
                                    label={t('admin.image')}
                                    value={editing.image_url || ''}
                                    onChange={(url) => setEditing({ ...editing, image_url: url })}
                                    onUploadStart={() => setIsUploading(true)}
                                    onUploadEnd={() => setIsUploading(false)}
                                    aspectRatio="square"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t('admin.name')} (KK)</label>
                                    <input
                                        value={editing.name_ru || ''}
                                        onChange={(e) => setEditing({ ...editing, name_ru: e.target.value })}
                                        className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t('admin.name')} (RU)</label>
                                    <input
                                        value={editing.name_en || ''}
                                        onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                                        className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t('admin.price')} ₸</label>
                                    <input
                                        type="number"
                                        value={editing.price || ''}
                                        onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                                        className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t('admin.originalPrice')} ₸</label>
                                    <input
                                        type="number"
                                        value={editing.original_price || ''}
                                        onChange={(e) => setEditing({ ...editing, original_price: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t('admin.category')}</label>
                                <div className="relative">
                                    <select
                                        value={editing.category_id || ''}
                                        onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                                        className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner appearance-none cursor-pointer pr-10"
                                    >
                                        <option value="">—</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{locale === 'ru' ? c.name_ru : c.name_kk}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                        <LayoutGrid className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t('admin.description')} (KK)</label>
                                <textarea
                                    rows={3}
                                    value={editing.description_ru || ''}
                                    onChange={(e) => setEditing({ ...editing, description_ru: e.target.value })}
                                    className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between bg-secondary/30 rounded-2xl px-4 py-3 border border-border/50">
                                <span className="text-sm font-semibold text-foreground">{t('admin.stopList')}</span>
                                <button
                                    onClick={() => setEditing({ ...editing, is_stop_list: !editing.is_stop_list, is_available: !!editing.is_stop_list })}
                                    className={cn('w-12 h-6 rounded-full transition-all relative', editing.is_stop_list ? 'bg-red-500' : 'bg-muted')}
                                >
                                    <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md', editing.is_stop_list ? 'right-1' : 'left-1')} />
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={saveItem}
                                disabled={isUploading}
                                className={cn(
                                    "w-full bg-primary text-primary-foreground rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg hover:bg-primary/90",
                                    isUploading && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {isUploading ? t('admin.uploading') : t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
