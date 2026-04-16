'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import { LocalCartItem } from '@/lib/storage/local-storage'

import { useI18n } from '@/lib/i18n/i18n-context'

export function CartSummary({
  subtotal,
  deliveryFee,
  total,
  restaurantId,
  items,
}: {
  subtotal: number
  deliveryFee: number
  total: number
  restaurantId?: string
  items: LocalCartItem[]
}) {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <>
      {/* Desktop / Inline view */}
      <Card className="border-none shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden mb-24 md:mb-0">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-xl">{t.cart.order_total_label}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-base">
              <span className="text-muted-foreground">{t.cart.items_label} ({items.length})</span>
              <span className="font-bold text-foreground">{subtotal.toLocaleString()}₸</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-muted-foreground">{t.cart.delivery}</span>
              <span className="font-bold text-foreground">
                {deliveryFee === 0 ? t.cart.free_label : `${deliveryFee.toLocaleString()}₸`}
              </span>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex items-center justify-between text-2xl font-black">
              <span>{t.cart.total_label}</span>
              <span className="text-primary">{total.toLocaleString()}₸</span>
            </div>
          </div>

          <Button
            className="hidden md:flex w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
            size="lg"
            onClick={() => router.push('/checkout')}
            disabled={items.length === 0}
          >
            {t.cart.continue_label}
          </Button>
        </CardContent>
      </Card>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[110] p-4 bg-background/90 backdrop-blur-xl border-t border-border/10 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:hidden">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t.cart.total_label}</span>
            <span className="text-2xl font-black text-primary leading-tight">{total.toLocaleString()}₸</span>
          </div>
          <Button
            className="flex-1 h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/30 active:scale-[0.98] transition-all"
            size="lg"
            onClick={() => router.push('/checkout')}
            disabled={items.length === 0}
          >
            {t.cart.continue_label}
          </Button>
        </div>
      </div>
    </>
  )
}
