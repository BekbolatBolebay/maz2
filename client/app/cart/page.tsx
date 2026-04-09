'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { CartList } from '@/components/cart/cart-list'
import { CartSummary } from '@/components/cart/cart-summary'
import { useLocalCart } from '@/hooks/use-local-cart'
import { getBookingCart, clearBookingCart, updateBookingCartQuantity, BookingCartItem } from '@/lib/storage/booking-cart'
import { Minus, Plus, Trash2, CalendarCheck, Utensils, Store, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

import { useI18n } from '@/lib/i18n/i18n-context'

type Tab = 'food' | 'cafe'

function BookingCartSection() {
  const { t, locale } = useI18n()
  const [items, setItems] = useState<BookingCartItem[]>([])

  useEffect(() => {
    setItems(getBookingCart())
    const handler = () => setItems(getBookingCart())
    window.addEventListener('bookingCartUpdated', handler)
    return () => window.removeEventListener('bookingCartUpdated', handler)
  }, [])

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarCheck className="w-14 h-14 text-muted-foreground/20 mb-3" />
        <h2 className="text-lg font-bold mb-1">{t.cart.booking_cart_empty}</h2>
        <p className="text-sm text-muted-foreground">
          {t.cart.pre_order_desc}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-base">{t.cart.pre_order_label}</h2>
        <button
          onClick={() => clearBookingCart()}
          className="flex items-center gap-1 text-xs text-red-500"
        >
          <Trash2 className="w-3.5 h-3.5" /> {t.cart.clear_cart}
        </button>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-card rounded-2xl border border-border p-3 flex gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
              {item.image_url ? (
                <Image src={item.image_url} alt={locale === 'ru' ? item.name_ru : (locale === 'kk' ? item.name_kk : item.name_en || item.name_ru)} fill className="object-cover" unoptimized />
              ) : (
                <Utensils className="w-6 h-6 text-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold line-clamp-2 mb-1">{locale === 'ru' ? item.name_ru : (locale === 'kk' ? item.name_kk : item.name_en || item.name_ru)}</p>
              <p className="text-sm font-bold text-primary">{(item.price * item.quantity).toLocaleString()}₸</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <button
                onClick={() => updateBookingCartQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold">{item.quantity}</span>
              <button
                onClick={() => updateBookingCartQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
        <div className="flex items-center justify-between font-bold">
          <span>{t.cart.total_label}</span>
          <span className="text-primary text-lg">{total.toLocaleString()}₸</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t.cart.pre_order_summary_desc}
        </p>
      </div>

      {items.length > 0 && (
        <Link
          href={`/booking/${items[0].cafe_id}`}
          className="block w-full bg-primary text-primary-foreground text-center py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
        >
          {t.cart.continue_label}
        </Link>
      )}
    </div>
  )
}

export default function CartPage() {
  const { t, locale } = useI18n()
  const cartItems = useLocalCart()
  const [tab, setTab] = useState<Tab>('food')
  const [bookingCount, setBookingCount] = useState(0)
  const [deliveryFee, setDeliveryFee] = useState(500)

  useEffect(() => {
    const update = () => setBookingCount(getBookingCart().reduce((s, i) => s + i.quantity, 0))
    update()
    window.addEventListener('bookingCartUpdated', update)

    // Fetch delivery fee if cart has items
    if (cartItems.length > 0) {
      import('@/lib/supabase/client').then(({ createClient }) => {
        const supabase = createClient()
        supabase
          .from('restaurants')
          .select('delivery_fee')
          .eq('id', cartItems[0].cafe_id)
          .single()
          .then(({ data }) => {
            if (data) setDeliveryFee(data.delivery_fee)
          })
      })
    }

    return () => window.removeEventListener('bookingCartUpdated', update)
  }, [cartItems.length])

  const subtotal = cartItems.reduce((sum, item) => sum + item.menu_item.price * item.quantity, 0)
  const actualDeliveryFee = cartItems.length > 0 ? deliveryFee : 0
  const total = subtotal + actualDeliveryFee
  const foodCount = cartItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <Header title={t.cart.title} />

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 pb-2 bg-background">
        <button
          onClick={() => setTab('food')}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative flex items-center justify-center gap-2',
            tab === 'food' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'
          )}
        >
          <Utensils className="w-4 h-4" /> {t.cart.food_tab}
          {foodCount > 0 && (
            <span className={cn(
              'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center',
              tab === 'food' ? 'bg-white text-primary' : 'bg-primary text-white'
            )}>
              {foodCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('cafe')}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative flex items-center justify-center gap-2',
            tab === 'cafe' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'
          )}
        >
          <Store className="w-4 h-4" /> {t.cart.cafe_tab}
          {bookingCount > 0 && (
            <span className={cn(
              'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center',
              tab === 'cafe' ? 'bg-white text-primary' : 'bg-primary text-white'
            )}>
              {bookingCount}
            </span>
          )}
        </button>
      </div>

      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-4">

          {/* ── Тамақ tab (жеткізу корзинасы) ── */}
          {tab === 'food' && (
            <>
              {cartItems.length > 0 ? (
                <>
                  <CartList items={cartItems} />
                  <CartSummary
                    subtotal={subtotal}
                    deliveryFee={actualDeliveryFee}
                    total={total}
                    restaurantId={cartItems[0].cafe_id}
                    items={cartItems}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-muted-foreground/20 mb-6">
                    <ShoppingCart className="w-20 h-20" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{t.cart.empty}</h2>
                  <p className="text-muted-foreground text-sm">{t.cart.add_items_desc}</p>
                </div>
              )}
            </>
          )}

          {/* ── Кафе tab (брондау корзинасы) ── */}
          {tab === 'cafe' && <BookingCartSection />}
        </div>
      </main>

    </div>
  )
}
