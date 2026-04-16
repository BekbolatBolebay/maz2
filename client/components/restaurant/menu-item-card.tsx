'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Minus, X, ShoppingCart, MapPin, Utensils, Star, Clock, Info, ChevronRight, Share2, Plus as PlusIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { addToLocalCart, LocalCartItem } from '@/lib/storage/local-storage'
import { Database } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { AuthModal } from '@/components/auth/auth-modal'

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  restaurant?: {
    name_ru: string
    name_en: string
    id?: string
  }
  is_combo?: boolean
}

export function MenuItemCard({ 
  item, 
  isOpen = true, 
  isCombo = false,
  layout = 'grid'
}: { 
  item: MenuItem, 
  isOpen?: boolean, 
  isCombo?: boolean,
  layout?: 'grid' | 'horizontal'
}) {
  const { locale, t } = useI18n()
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [mismatchOpen, setMismatchOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [pendingAddToCart, setPendingAddToCart] = useState<{ quantity: number, force: boolean } | null>(null)

  const isHorizontal = layout === 'horizontal'

  // -- Hash-based auto-open --
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === `#item-${item.id}`) {
        setOpen(true)
        setQty(1)
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [item.id])

  const name = locale === 'ru' ? item.name_ru : (item.name_kk || item.name_ru)
  const desc = locale === 'ru' ? item.description_ru : (item.description_kk || item.description_ru)
  const cafeName = locale === 'ru'
    ? (item.restaurant?.name_ru || '')
    : (item.restaurant?.name_en || item.restaurant?.name_ru || '')

  function addToCart(quantity = 1, force = false) {
    console.log('addToCart called', { quantity, force, user: !!user });
    if (!isOpen) {
      toast.error(locale === 'ru' ? 'Кафе сейчас закрыто' : 'Кафе қазір жабық')
      return
    }

    // Check if user is authenticated (either logged in or anonymous)
    if (!user) {
      console.log('User not found, opening AuthModal');
      setPendingAddToCart({ quantity, force })
      setAuthModalOpen(true)
      return
    }

    const cartItem: LocalCartItem = {
      id: `cart_${Date.now()}_${item.id}`,
      menu_item_id: item.id,
      cafe_id: item.cafe_id,
      quantity,
      menu_item: {
        name_kk: item.name_kk || item.name_ru,
        name_ru: item.name_ru,
        name_en: item.name_en,
        price: item.price,
        image_url: item.image_url || '',
        restaurant: {
          name_kk: item.restaurant?.name_ru || '',
          name_ru: item.restaurant?.name_ru || '',
          name_en: item.restaurant?.name_en || '',
        },
      },
    }

    const res = addToLocalCart(cartItem, force)
    if (res.mismatch) {
      setMismatchOpen(true)
      return
    }

    toast.success(`${name} — ${locale === 'ru' ? 'Добавлено в корзину' : 'Себетке қосылды'} ✓`)
    setOpen(false)
    setQty(1)
    setMismatchOpen(false)
  }

  return (
    <>
      {/* ── Card ── */}
      <div
        className={cn(
          "bg-card border border-muted/50 overflow-hidden cursor-pointer active:scale-[0.97] transition-all shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 group",
          isHorizontal ? "flex h-40 rounded-[2rem]" : "flex flex-col rounded-3xl",
          !isOpen && "opacity-80"
        )}
        onClick={() => { setOpen(true); setQty(1) }}
      >
        {/* Image */}
        <div className={cn("relative bg-muted/30 overflow-hidden", isHorizontal ? "w-40 h-40 shrink-0" : "aspect-square")}>
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/10 select-none">
              <Utensils className="w-12 h-12" />
            </div>
          )}
          {/* Quick add button for grid */}
          {!isHorizontal && (
            <button
              onClick={e => { e.stopPropagation(); addToCart(1) }}
              disabled={!item.is_available || !isOpen}
              className="absolute bottom-3 right-3 w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/40 active:scale-90 transition-all disabled:opacity-40"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className={cn("p-4 flex-1 flex flex-col justify-between", isHorizontal ? "pl-4 pr-3 py-4" : "p-3")}>
          <div className="space-y-1">
            <p className={cn("font-bold text-foreground leading-snug", isHorizontal ? "text-sm line-clamp-2" : "text-xs line-clamp-2")}>
               {name}
            </p>
            {isHorizontal && desc && (
              <p className="text-[10px] text-muted-foreground line-clamp-2 font-medium leading-normal opacity-80">{desc}</p>
            )}
            {cafeName && (
              <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 truncate font-medium">
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                {cafeName}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-base font-black text-primary tracking-tight">
              {item.price.toFixed(0)}<span className="text-xs ml-0.5">₸</span>
            </p>
            {isHorizontal && (
               <button
                 onClick={e => { e.stopPropagation(); addToCart(1) }}
                 disabled={!item.is_available || !isOpen}
                 className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-all disabled:opacity-40 hover:bg-primary hover:text-white"
               >
                 <Plus className="w-4 h-4" />
               </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal (bottom sheet) ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 pb-20">
            {/* Close button */}
            <div className="flex justify-end p-4 pb-0">
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            {item.image_url && (
              <div className="relative h-52 mx-4 rounded-2xl overflow-hidden bg-muted">
                <Image src={item.image_url} alt={name} fill className="object-cover" unoptimized />
              </div>
            )}

            <div className="px-5 py-4">
              {/* Cafe name */}
              {cafeName && (
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {cafeName}
                </p>
              )}

              {/* Name */}
              <h2 className="text-xl font-bold text-foreground mb-2">{name}</h2>

              {/* Description */}
              {desc && (
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{desc}</p>
              )}

              {/* Price */}
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-2xl font-bold text-primary relative">
                    {item.type === 'rental' && (
                      <Badge variant="secondary" className="absolute -top-6 left-0 bg-blue-500/80 text-white border-none text-[10px]">
                        {locale === 'ru' ? 'Аренда' : 'Аренда'}
                      </Badge>
                    )}
                    {item.original_price && (
                      <span className="text-base text-muted-foreground line-through mr-2">
                        {(item.original_price * qty).toFixed(0)}₸
                      </span>
                    )}
                    {(item.price * qty).toFixed(0)}₸
                  </p>
                  {item.type === 'rental' && (
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {locale === 'ru' ? 'За аренду' : 'Жалға алу үшін'}
                    </p>
                  )}
                </div>
                {item.type === 'rental' && item.rental_deposit && (
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">+{item.rental_deposit.toFixed(0)}₸</p>
                    <p className="text-[10px] text-muted-foreground">{locale === 'ru' ? 'Залог' : 'Кепілақы'}</p>
                  </div>
                )}
              </div>

              {/* Combo Items */}
              {isCombo && item.combo_items && Array.isArray(item.combo_items) && (item.combo_items.length > 0) && (
                <div className="mb-6 space-y-3">
                  <h3 className="text-sm font-bold text-foreground border-b pb-2">
                    {locale === 'ru' ? 'В набор входит:' : 'Комбо құрамы:'}
                  </h3>
                  <div className="space-y-2">
                    {(item.combo_items as any[]).map((subItem, idx) => {
                      const subItemId = subItem.item_id || subItem.id
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2 rounded-xl bg-secondary/30 border border-border/50 transition-all hover:bg-secondary/50 cursor-pointer active:scale-[0.98]"
                          onClick={() => {
                            if (subItemId) {
                              window.location.hash = `item-${subItemId}`
                            }
                          }}
                        >
                          {subItem.image_url && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                              <Image src={subItem.image_url} alt={subItem.name} fill className="object-cover" unoptimized />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{subItem.name}</p>
                            {subItem.description && (
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{subItem.description}</p>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-3 mb-4">
                {/* Qty stepper */}
                <div className="flex items-center gap-3 bg-secondary rounded-2xl px-3 py-2">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl bg-card flex items-center justify-center active:scale-90 transition-all shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-bold w-6 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to cart */}
                <Button
                  className="flex-1 h-12 gap-2 rounded-2xl font-bold text-base"
                  disabled={!item.is_available || !isOpen}
                  onClick={() => addToCart(qty)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isOpen ? (locale === 'ru' ? 'В корзину' : 'Себетке қосу') : (locale === 'ru' ? 'Закрыто' : 'Жабық')}
                </Button>
              </div>

              {!item.is_available && (
                <p className="text-center text-xs text-destructive font-medium">{locale === 'ru' ? 'Временно нет' : 'Уақытша жоқ'}</p>
              )}
              {!isOpen && item.is_available && (
                <p className="text-center text-xs text-destructive font-medium">{locale === 'ru' ? 'Кафе сейчас закрыто' : 'Кафе қазір жабық'}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Mismatch Dialog ── */}
      {mismatchOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-2">
              {locale === 'ru' ? 'Сменить кафе?' : 'Кафені ауыстыру?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {locale === 'ru'
                ? 'Ваша корзина содержит товары из другого кафе. Чтобы добавить это блюдо, корзина будет очищена.'
                : 'Себетте басқа кафенің тамақтары бар. Бұл тағамды қосу үшін себет тазартылады.'}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setMismatchOpen(false)}
              >
                {locale === 'ru' ? 'Отмена' : 'Болдырмау'}
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={() => addToCart(qty, true)}
              >
                {locale === 'ru' ? 'Очистить и добавить' : 'Тазалау және қосу'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ── Auth Modal ── */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={() => {
          if (pendingAddToCart) {
            addToCart(pendingAddToCart.quantity, pendingAddToCart.force)
            setPendingAddToCart(null)
          }
          setAuthModalOpen(false)
        }}
      />
    </>
  )
}
