'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Database } from '@/lib/supabase/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Promotion = Database['public']['Tables']['promotions']['Row']

export function PromotionBanner({ promotions }: { promotions: Promotion[] }) {
  const { locale } = useI18n()
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (promotions.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [promotions.length])

  if (!promotions || promotions.length === 0) return null

  const currentPromo = promotions[currentIndex]

  return (
    <div className="relative overflow-hidden">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2">
        {promotions.map((promo, index) => (
          <Card
            key={promo.id}
            className="relative shrink-0 w-[82vw] md:w-[380px] snap-center overflow-hidden h-34 bg-gradient-to-br from-[#ff5b5b] via-[#ff4141] to-[#e11d48] border-0 rounded-[28px] shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
          >
            {promo.image_url && (
              <div className="absolute inset-0">
                <Image
                  src={promo.image_url}
                  alt={locale === 'ru' && promo.title_ru ? promo.title_ru : promo.title}
                  fill
                  className="object-cover opacity-15"
                  priority={index === 0}
                />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

            <div className="relative z-10 flex items-center justify-between h-full p-5">
              <div className="flex-1">
                <div className="flex flex-col gap-0.5 mb-1.5">
                  <span className="text-white/90 text-[10px] font-black uppercase tracking-wider leading-none">
                    {promo.discount_percent && `-${promo.discount_percent}% жеңілдік`}
                  </span>
                  <p className="text-white/50 text-[9px] font-medium leading-none">
                    {locale === 'kk' ? 'Аптаның соңына дейін' : 'До конца недели'}
                  </p>
                </div>
                <h3 className="text-white text-lg font-extrabold leading-tight mb-1 drop-shadow-sm">
                  {locale === 'ru' && promo.title_ru ? promo.title_ru : promo.title}
                </h3>
              </div>

              <div className="relative w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2 shadow-inner shrink-0 scale-100">
                <div className="text-3xl drop-shadow-xl">🍔</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {promotions.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {promotions.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all ${index === currentIndex ? 'w-4 bg-primary' : 'w-1 bg-muted'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
