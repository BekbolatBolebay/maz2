'use client'

import Image from 'next/image'
import { Minus, Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { updateCartItemQuantity, removeFromLocalCart, LocalCartItem } from '@/lib/storage/local-storage'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function CartList({ items }: { items: LocalCartItem[] }) {
  const { locale, t } = useI18n()

  const updateQuantity = (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity < 1) {
        removeFromLocalCart(itemId)
        toast.success(t('removedFromCart'))
      } else {
        updateCartItemQuantity(itemId, newQuantity)
      }
    } catch (error) {
      console.error('[v0] Error updating quantity:', error)
      toast.error(t('error'))
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="font-bold text-lg">{t('foodOrder')}</h2>

      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-3">
            <div className="flex gap-3">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {item.menu_item.image_url ? (
                  <Image
                    src={item.menu_item.image_url}
                    alt={locale === 'ru' ? item.menu_item.name_ru : item.menu_item.name_kk}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">
                  {locale === 'ru' ? item.menu_item.name_ru : item.menu_item.name_kk}
                </h3>

                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                  {locale === 'ru' ? item.menu_item.restaurant.name_ru : item.menu_item.restaurant.name_kk}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold">
                    {(item.menu_item.price * item.quantity).toFixed(0)}₸
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-full"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <span className="w-6 text-center font-medium">
                      {item.quantity}
                    </span>

                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-full"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
