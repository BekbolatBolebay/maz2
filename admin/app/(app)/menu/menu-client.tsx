'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Search, AlertCircle, Pencil, Trash2, X, Check, Tag, Loader2, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { addMenuItem, updateMenuItem, deleteMenuItem, addCategory, updateCategory, deleteCategory, getDebugInfo } from '@/lib/actions'
import type { MenuItem, Category } from '@/lib/db'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import ImageUpload from '@/components/ui/image-upload'

interface Props {
  initialItems: MenuItem[]
  initialCategories: Category[]
  restaurantId: string
}

type EditingItem = Partial<MenuItem> & { isNew?: boolean }

const EMPTY_ITEM: EditingItem = {
  name_kk: '', name_ru: '', description_ru: '', description_kk: '',
  price: 0, original_price: null, is_available: true, is_stop_list: false,
  category_id: null, image_url: '', isNew: true,
}

export default function MenuClient({ initialItems, initialCategories, restaurantId }: Props) {
  const { lang } = useApp()
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [activeCat, setActiveCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<EditingItem | null>(null)
  const [showStopList, setShowStopList] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [managingCats, setManagingCats] = useState(false)
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null)

  useState(() => {
    getDebugInfo().then(info => console.log('DEBUG INFO:', info))
  })

  const filtered = items.filter((item) => {
    const matchCat = activeCat === 'all' || item.category_id === activeCat
    const matchStop = !showStopList || item.is_stop_list
    const name = lang === 'kk' ? item.name_kk : item.name_ru
    const matchSearch = name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch && matchStop
  })

  async function toggleAvailability(item: MenuItem) {
    const newVal = !item.is_stop_list
    const { error } = await updateMenuItem(item.id, {
      ...item,
      is_stop_list: newVal,
      is_available: !newVal
    })
    if (!error) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_stop_list: newVal, is_available: !newVal } : i))
    } else toast.error(t(lang, 'error'))
  }

  async function saveItem() {
    if (!editing || isUploading) return
    const payload = {
      name_kk: editing.name_kk || '',
      name_ru: editing.name_ru || '',
      description_kk: editing.description_kk || '',
      description_ru: editing.description_ru || '',
      name_en: editing.name_en || editing.name_ru || '',
      description_en: editing.description_en || editing.description_ru || '',
      price: Number(editing.price) || 0,
      original_price: editing.original_price ? Number(editing.original_price) : null,
      is_available: editing.is_available ?? true,
      is_stop_list: editing.is_stop_list ?? false,
      category_id: editing.category_id || null,
      image_url: editing.image_url || '',
      combo_items: editing.combo_items || [],
      type: editing.type || 'food',
      rental_deposit: Number(editing.rental_deposit) || 0,
      preparation_time: 0,
      sort_order: 100
    }

    if (editing.isNew) {
      const { data, error } = await addMenuItem(payload, restaurantId)
      if (error) { toast.error(t(lang, 'error')); return }
      setItems((prev) => [...prev, data as MenuItem])
    } else {
      const { error } = await updateMenuItem(editing.id!, payload)
      if (error) { toast.error(t(lang, 'error')); return }
      setItems((prev) => prev.map((i) => i.id === editing.id ? { ...i, ...payload } : i))
    }
    setEditing(null)
    toast.success(t(lang, 'save'))
  }

  async function saveCategory() {
    if (!editingCat || isUploading) return
    const payload = {
      name_kk: editingCat.name_kk || '',
      name_ru: editingCat.name_ru || '',
      name_en: editingCat.name_ru || '', // Fallback
      sort_order: Number(editingCat.sort_order) || 0,
      is_active: true,
      is_combo: !!editingCat.is_combo
    }

    if (!editingCat.id) {
      const { data, error } = await addCategory(payload, restaurantId)
      if (error) { toast.error(t(lang, 'error')); return }
      setCategories((prev) => [...prev, data as Category])
    } else {
      const { error } = await updateCategory(editingCat.id, payload)
      if (error) { toast.error(t(lang, 'error')); return }
      setCategories((prev) => prev.map((c) => c.id === editingCat.id ? { ...c, ...payload } : c))
    }
    setEditingCat(null)
    toast.success(t(lang, 'save'))
  }

  async function removeCategory(id: string) {
    const hasItems = items.some(item => item.category_id === id)
    if (hasItems) {
      toast.error(lang === 'kk' ? 'Бұл категорияда тағамдар бар. Алдымен оларды өшіріңіз немесе басқа категорияға ауыстырыңыз.' : 'В этой категории есть блюда. Сначала удалите их или переместите в другую категорию.')
      return
    }

    if (!confirm(lang === 'kk' ? 'Категорияны өшіруді растайсыз ба?' : 'Вы уверены, что хотите удалить категорию?')) return

    const { error } = await deleteCategory(id)
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
      if (activeCat === id) setActiveCat('all')
      toast.success(t(lang, 'save'))
    } else toast.error(t(lang, 'error'))
  }

  async function deleteItem(id: string) {
    const { error } = await deleteMenuItem(id)
    if (!error) setItems((prev) => prev.filter((i) => i.id !== id))
    else toast.error(t(lang, 'error'))
  }

  const getCatName = (id: string | null) => {
    if (!id) return ''
    const c = categories.find((c) => c.id === id)
    return c ? (lang === 'kk' ? c.name_kk : c.name_ru) : ''
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-card px-4 pt-4 md:pt-12 pb-3 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-3.5 h-3.5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground flex-1">{t(lang, 'menuManagement')}</h1>
          <button
            onClick={() => setEditing({ ...EMPTY_ITEM, category_id: activeCat !== 'all' ? activeCat : null })}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5 text-foreground" />
          </button>
          <button
            onClick={() => setManagingCats(true)}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, 'search')}
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
            <AlertCircle className="w-3 h-3" /> {t(lang, 'stopList')}
          </button>
          <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1 -mx-2 px-2">
            <button
              onClick={() => setActiveCat('all')}
              className={cn('px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm',
                activeCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}
            >
              {t(lang, 'all')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={cn('px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm',
                  activeCat === c.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}
              >
                {lang === 'kk' ? c.name_kk : c.name_ru}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Item list */}
      <div className="flex-1 px-4 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">{t(lang, 'noData')}</p>
        ) : (
          filtered.map((item) => {
            const name = lang === 'kk' ? item.name_kk : item.name_ru
            return (
              <div
                key={item.id}
                className={cn(
                  'bg-card rounded-2xl border p-2 sm:p-3 flex items-center gap-3 transition-all',
                  item.is_stop_list ? 'border-red-200 dark:border-red-900 opacity-70' : 'border-border shadow-sm'
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
                        {t(lang, 'outOfStock')}
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
                {editing.isNew ? t(lang, 'addItem') : t(lang, 'edit')}
              </h2>
              <button onClick={() => setEditing(null)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <div className="flex justify-center mb-6">
                <ImageUpload
                  label={t(lang, 'image')}
                  value={editing.image_url || ''}
                  onChange={(url) => setEditing({ ...editing, image_url: url })}
                  onUploadStart={() => setIsUploading(true)}
                  onUploadEnd={() => setIsUploading(false)}
                  aspectRatio="square"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t(lang, 'name')} (RU)</label>
                  <input
                    value={editing.name_ru || ''}
                    onChange={(e) => setEditing({ ...editing, name_ru: e.target.value })}
                    className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t(lang, 'name')} (KK)</label>
                  <input
                    value={editing.name_kk || ''}
                    onChange={(e) => setEditing({ ...editing, name_kk: e.target.value })}
                    className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t(lang, 'price')} ₸</label>
                  <input
                    type="number"
                    value={editing.price || ''}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                    className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t(lang, 'originalPrice')} ₸</label>
                  <input
                    type="number"
                    value={editing.original_price || ''}
                    onChange={(e) => setEditing({ ...editing, original_price: e.target.value ? Number(e.target.value) : null })}
                    className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t(lang, 'type') || 'Тип'}</label>
                  <div className="relative">
                    <select
                      value={editing.type || 'food'}
                      onChange={(e) => setEditing({ ...editing, type: e.target.value as any })}
                      className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner appearance-none cursor-pointer pr-10"
                    >
                      <option value="food">{lang === 'kk' ? 'Тамақ' : 'Еда'}</option>
                      <option value="combo">{lang === 'kk' ? 'Комбо' : 'Комбо'}</option>
                      <option value="rental">{lang === 'kk' ? 'Аренда' : 'Аренда'}</option>
                      <option value="service">{lang === 'kk' ? 'Сервис' : 'Сервис'}</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <Tag className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                {editing.type === 'rental' && (
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{lang === 'kk' ? 'Кепілақы' : 'Залог'} ₸</label>
                    <input
                      type="number"
                      value={editing.rental_deposit || ''}
                      onChange={(e) => setEditing({ ...editing, rental_deposit: Number(e.target.value) })}
                      className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t(lang, 'category')}</label>
                <div className="relative">
                  <select
                    value={editing.category_id || ''}
                    onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                    className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner appearance-none cursor-pointer pr-10"
                  >
                    <option value="">—</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{lang === 'kk' ? c.name_kk : c.name_ru}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t(lang, 'description')} (RU)</label>
                <textarea
                  rows={3}
                  value={editing.description_ru || ''}
                  onChange={(e) => setEditing({ ...editing, description_ru: e.target.value })}
                  className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">{t(lang, 'description')} (KK)</label>
                <textarea
                  rows={3}
                  value={editing.description_kk || ''}
                  onChange={(e) => setEditing({ ...editing, description_kk: e.target.value })}
                  className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 transition-all shadow-inner resize-none"
                />
              </div>

              <div className="flex items-center justify-between bg-secondary/30 rounded-2xl px-4 py-3 border border-border/50">
                <span className="text-sm font-semibold text-foreground">{t(lang, 'stopList')}</span>
                <button
                  onClick={() => setEditing({ ...editing, is_stop_list: !editing.is_stop_list, is_available: !!editing.is_stop_list })}
                  className={cn('w-12 h-6 rounded-full transition-all relative', editing.is_stop_list ? 'bg-red-500' : 'bg-muted')}
                >
                  <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md', editing.is_stop_list ? 'right-1' : 'left-1')} />
                </button>
              </div>

              {/* Combo Items Management */}
              {editing.category_id && categories.find(c => c.id === editing.category_id)?.is_combo && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-1">
                    {lang === 'kk' ? 'Комбо құрамы' : 'Состав комбо'}
                  </label>
                  <div className="space-y-2">
                    {(editing.combo_items || []).map((si: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-2 p-3 bg-secondary/30 rounded-2xl border border-border/50 relative">
                        <button
                          onClick={() => {
                            const newItems = [...(editing.combo_items || [])];
                            newItems.splice(idx, 1);
                            setEditing({ ...editing, combo_items: newItems });
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <input
                          placeholder={lang === 'kk' ? 'Атауы' : 'Название'}
                          value={si.name || ''}
                          onChange={(e) => {
                            const newItems = [...(editing.combo_items || [])];
                            newItems[idx] = { ...si, name: e.target.value };
                            setEditing({ ...editing, combo_items: newItems });
                          }}
                          className="bg-card rounded-xl px-3 py-1.5 text-xs outline-none border border-border focus:border-primary/50"
                        />
                        <input
                          placeholder={lang === 'kk' ? 'Сипаттама' : 'Описание'}
                          value={si.description || ''}
                          onChange={(e) => {
                            const newItems = [...(editing.combo_items || [])];
                            newItems[idx] = { ...si, description: e.target.value };
                            setEditing({ ...editing, combo_items: newItems });
                          }}
                          className="bg-card rounded-xl px-3 py-1.5 text-[10px] outline-none border border-border focus:border-primary/50"
                        />
                        <input
                          placeholder={lang === 'kk' ? 'Сілтеме (міндетті емес)' : 'Ссылка (необязательно)'}
                          value={si.link || ''}
                          onChange={(e) => {
                            const newItems = [...(editing.combo_items || [])];
                            newItems[idx] = { ...si, link: e.target.value };
                            setEditing({ ...editing, combo_items: newItems });
                          }}
                          className="bg-card rounded-xl px-3 py-1.5 text-[10px] outline-none border border-border focus:border-primary/50"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => setEditing({ ...editing, combo_items: [...(editing.combo_items || []), { name: '', description: '', link: '' }] })}
                      className="w-full py-2 border-2 border-dashed border-border rounded-2xl text-[10px] font-bold text-muted-foreground hover:bg-secondary/30 transition-all"
                    >
                      + {lang === 'kk' ? 'Тағам қосу' : 'Добавить позицию'}
                    </button>
                  </div>
                </div>
              )}
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
                {isUploading ? t(lang, 'uploading') : t(lang, 'save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories modal */}
      {managingCats && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setManagingCats(false)} />
          <div className="relative w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl border border-border animate-in fade-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">{t(lang, 'category')}</h2>
              <button
                onClick={() => setEditingCat({ name_kk: '', name_ru: '', sort_order: categories.length + 1 })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold"
              >
                <Plus className="w-3 h-3" /> {t(lang, 'addItem')}
              </button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-2xl border border-border/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{lang === 'kk' ? cat.name_kk : cat.name_ru}</p>
                      {cat.is_combo && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">COMBO</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Order: {cat.sort_order}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingCat(cat)} className="p-2 bg-secondary rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => removeCategory(cat.id)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">{t(lang, 'noData')}</p>}
            </div>

            <div className="pt-6">
              <button onClick={() => setManagingCats(false)} className="w-full bg-secondary rounded-2xl py-4 text-sm font-bold">{lang === 'kk' ? 'Жабу' : 'Закрыть'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category modal */}
      {editingCat && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingCat(null)} />
          <div className="relative w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl border border-border animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4">{editingCat.id ? t(lang, 'edit') : t(lang, 'addItem')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block px-1">{t(lang, 'name')} (RU)</label>
                <input
                  value={editingCat.name_ru || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, name_ru: e.target.value })}
                  className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block px-1">{t(lang, 'name')} (KK)</label>
                <input
                  value={editingCat.name_kk || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, name_kk: e.target.value })}
                  className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block px-1">Sort Order</label>
                <input
                  type="number"
                  value={editingCat.sort_order || 0}
                  onChange={(e) => setEditingCat({ ...editingCat, sort_order: Number(e.target.value) })}
                  className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary/50"
                />
              </div>
              <div className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-2.5 border border-border/50">
                <span className="text-sm font-semibold text-foreground">{lang === 'kk' ? 'Комбо категориясы' : 'Комбо категория'}</span>
                <button
                  type="button"
                  onClick={() => setEditingCat({ ...editingCat, is_combo: !editingCat.is_combo })}
                  className={cn('w-10 h-5 rounded-full transition-all relative', editingCat.is_combo ? 'bg-primary' : 'bg-muted')}
                >
                  <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-md', editingCat.is_combo ? 'right-0.5' : 'left-0.5')} />
                </button>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditingCat(null)} className="flex-1 bg-secondary rounded-xl py-3 text-sm font-bold">{t(lang, 'cancel')}</button>
                <button onClick={saveCategory} className="flex-[2] bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold">{t(lang, 'save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
