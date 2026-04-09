'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useRouter } from 'next/navigation'
import { addToLocalCart, LocalCartItem } from '@/lib/storage/local-storage'
import { Database } from '@/lib/supabase/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FavoriteButton } from '@/components/restaurant/favorite-button'

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  restaurants: Database['public']['Tables']['restaurants']['Row'] | null
}

export function FoodSection({ title, items }: { title: string; items: MenuItem[] }) {
  const { t, locale } = useI18n()
  const router = useRouter()

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-extrabold text-foreground/90 tracking-tight">
          {locale === 'kk' ? 'Бүгінгі танымалдар' : 'Популярно сегодня'}
        </h2>
        <Link href="/restaurants" className="text-xs font-bold text-primary hover:opacity-80 transition-opacity">
          {locale === 'kk' ? 'Барлығы' : 'Все'}
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 -mx-1 px-1">
        {items.map((item) => (
          <Link key={item.id} href={`/restaurant/${item.cafe_id}`} className="shrink-0 w-[240px] snap-start">
            <Card className="overflow-hidden border border-border/50 shadow-sm rounded-[28px] group relative h-[320px] active:scale-[0.98] transition-all bg-card/80 backdrop-blur-sm">
              <div className="absolute inset-0">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={locale === 'ru' ? item.name_ru : item.name_kk}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <Star className="w-10 h-10 text-primary/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              <div className="absolute top-3 right-3 z-10 scale-75">
                <FavoriteButton menuItemId={item.id} />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="mb-3">
                  <h3 className="text-base font-extrabold text-white mb-0.5 drop-shadow-md truncate">
                    {locale === 'ru' ? item.name_ru : item.name_kk}
                  </h3>
                  <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-bold">
                    <div className="flex items-center gap-0.5 bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded-md">
                      <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                      <span>4.8</span>
                    </div>
                    <span className="opacity-60">•</span>
                    <span className="truncate max-w-[100px]">{item.restaurants ? (locale === 'ru' ? item.restaurants.name_ru : item.restaurants.name_kk) : ''}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full bg-[#ff5b5b] hover:bg-[#ff4141] text-white rounded-xl h-9 font-black text-xs transition-all active:scale-95 shadow-lg shadow-red-500/20"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push(`/restaurant/${item.cafe_id}`)
                  }}
                >
                  {locale === 'kk' ? 'Тапсырыс' : 'Заказать'}
                </Button>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
