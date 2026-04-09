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
    <Card className="border-none shadow-lg overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <h3 className="font-bold text-lg">{t.cart.order_total_label}</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t.cart.items_label} ({items.length})</span>
            <span className="font-semibold text-foreground">{subtotal.toLocaleString()}₸</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t.cart.delivery}</span>
            <span className="font-semibold text-foreground">
              {deliveryFee === 0 ? t.cart.free_label : `${deliveryFee.toLocaleString()}₸`}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-xl font-bold">
            <span>{t.cart.total_label}</span>
            <span className="text-primary">{total.toLocaleString()}₸</span>
          </div>
        </div>

        <Button
          className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
          size="lg"
          onClick={() => router.push('/checkout')}
          disabled={items.length === 0}
        >
          {t.cart.continue_label}
        </Button>
      </CardContent>
    </Card>
  )
}
