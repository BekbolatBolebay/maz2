'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Plus, Minus, X, ShoppingCart, MapPin, Utensils, Star, Clock, Info, ChevronRight, Share2, Plus as PlusIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "bg-card border border-muted/50 overflow-hidden cursor-pointer transition-all shadow-sm hover:shadow-xl hover:shadow-black/5 group",
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
      </motion.div>

      {/* ── Modal (bottom sheet) ── */}
      <AnimatePresence>
        {open && mounted && createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            {/* Sheet */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-screen-md bg-card rounded-t-[3rem] shadow-2xl max-h-[92vh] overflow-y-auto pb-20 no-scrollbar"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 bg-muted rounded-full opacity-20" />
              </div>

              {/* Close button */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 rounded-full bg-secondary/80 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image */}
              {item.image_url && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative h-64 mx-4 mt-2 rounded-[2rem] overflow-hidden bg-muted shadow-lg"
                >
                  <Image src={item.image_url} alt={name} fill className="object-cover" unoptimized />
                </motion.div>
              )}

              <div className="px-6 py-6">
                {/* Cafe name */}
                {cafeName && (
                  <p className="text-xs text-primary font-bold mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {cafeName}
                  </p>
                )}

                {/* Name */}
                <h2 className="text-2xl font-black text-foreground mb-2 leading-tight">{name}</h2>

                {/* Description */}
                {desc && (
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed font-medium opacity-80">{desc}</p>
                )}

                {/* Price */}
                <div className="flex items-end justify-between mb-8 p-4 bg-muted/30 rounded-3xl border border-muted/50">
                  <div>
                    <p className="text-3xl font-black text-primary flex items-baseline gap-1">
                      {item.original_price && (
                        <span className="text-base text-muted-foreground line-through font-bold opacity-50 mr-1">
                          {(item.original_price * qty).toFixed(0)}₸
                        </span>
                      )}
                      {(item.price * qty).toFixed(0)}<span className="text-sm font-black uppercase ml-0.5">₸</span>
                    </p>
                    {item.type === 'rental' && (
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                        {locale === 'ru' ? 'За аренду' : 'Жалға алу үшін'}
                      </p>
                    )}
                  </div>
                  {item.type === 'rental' && item.rental_deposit && (
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">+{item.rental_deposit.toFixed(0)}₸</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{locale === 'ru' ? 'Залог' : 'Кепілақы'}</p>
                    </div>
                  )}
                </div>

                {/* Quantity + Add to cart */}
                <div className="flex items-center gap-4">
                  {/* Qty stepper */}
                  <div className="flex items-center gap-4 bg-secondary/50 rounded-3xl px-4 py-2 border border-secondary">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-2xl bg-card flex items-center justify-center active:scale-90 transition-all shadow-sm border border-border/50"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-xl font-black w-8 text-center">{qty}</span>
                    <button
                      onClick={() => setQty(q => q + 1)}
                      className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-all shadow-2xl shadow-primary/30"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Add to cart */}
                  <Button
                    className="flex-1 h-14 gap-3 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={!item.is_available || !isOpen}
                    onClick={() => addToCart(qty)}
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {isOpen ? (locale === 'ru' ? 'В корзину' : 'Себетке қосу') : (locale === 'ru' ? 'Закрыто' : 'Жабық')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* ── Mismatch Dialog ── */}
      {mismatchOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
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
        </div>,
        document.body
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
