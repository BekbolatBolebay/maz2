'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/supabase/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { FavoriteButton } from '@/components/restaurant/favorite-button'

type Restaurant = Database['public']['Tables']['restaurants']['Row']

export function RestaurantSection({ restaurants }: { restaurants: Restaurant[] }) {
  const { t, locale } = useI18n()
  const router = useRouter()

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-foreground/80">
          {locale === 'kk' ? 'Сізге жақын' : 'Рядом с вами'}
        </h2>
      </div>

      <div className="space-y-4">
        {restaurants.map((restaurant) => (
          <Card key={restaurant.id} className="overflow-hidden border border-border/40 shadow-sm rounded-[24px] group active:scale-[0.99] transition-all bg-card/70 backdrop-blur-sm hover:shadow-md hover:border-border/60">
            <CardContent className="p-2.5">
              <div className="flex items-center gap-3">
                {/* Image Section */}
                <div className="relative h-24 w-24 shrink-0 rounded-[20px] overflow-hidden bg-muted shadow-sm">
                  <Link href={`/restaurant/${restaurant.id}`} className="block w-full h-full">
                    {restaurant.image_url ? (
                      <Image
                        src={restaurant.image_url}
                        alt={locale === 'ru' ? restaurant.name_ru : restaurant.name_kk}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                        <Star className="w-8 h-8 text-primary/10" />
                      </div>
                    )}
                  </Link>
                  <div className="absolute top-1.5 right-1.5 z-10 scale-75 origin-top-right">
                    <FavoriteButton restaurantId={restaurant.id} />
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5 py-1">
                  <div>
                    <Link href={`/restaurant/${restaurant.id}`}>
                      <h3 className="font-extrabold text-base text-foreground truncate group-hover:text-primary transition-colors pr-1">
                        {locale === 'ru' ? restaurant.name_ru : restaurant.name_kk}
                      </h3>
                    </Link>
                    <p className="text-[10px] text-muted-foreground italic line-clamp-1 font-medium opacity-80">
                      {locale === 'ru' ? (restaurant as any).cuisine_types?.[0] || 'Кафе' : (restaurant as any).cuisine_types?.[0] || 'Кафе'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 bg-yellow-400/10 px-1.5 py-0.5 rounded-md border border-yellow-400/20">
                      <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-[10px] font-black text-yellow-700">
                        {(restaurant.rating || 0).toFixed(1)}
                      </span>
                      {(restaurant as any).review_count > 0 && (
                        <span className="text-[9px] text-yellow-600 ml-0.5">
                          ({(restaurant as any).review_count})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 font-bold">
                      <Clock className="w-3 h-3" />
                      <span>15-25 мин</span>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-col gap-1.5 shrink-0 min-w-[80px] pr-1">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl h-8 px-3 font-bold transition-all active:scale-95 text-[11px] shadow-sm shadow-primary/20"
                    onClick={() => router.push(`/restaurant/${restaurant.id}`)}
                  >
                    {locale === 'kk' ? 'Заказ' : 'Заказать'}
                  </Button>
                  {(restaurant as any).is_booking_enabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-400/30 text-yellow-600 hover:bg-yellow-50/50 rounded-xl h-8 px-3 font-bold transition-all active:scale-95 text-[11px] bg-transparent"
                      onClick={() => router.push(`/checkout?type=booking&restaurant=${restaurant.id}`)}
                    >
                      {locale === 'kk' ? 'Бронь' : 'Бронь'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
