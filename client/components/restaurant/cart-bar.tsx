'use client'

import Link from 'next/link'
import { useCart } from '@/hooks/use-cart'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n/i18n-context'

export function CartBar({ restaurantId }: { restaurantId?: string }) {
  const { totalCount, totalPrice, cart } = useCart()
  const { locale } = useI18n()

  // Only show if items exist and (optionally) if they belong to this restaurant
  const hasItems = totalCount > 0
  const isCorrectRestaurant = !restaurantId || cart.some(item => item.cafe_id === restaurantId)

  if (!hasItems || !isCorrectRestaurant) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-2rem)] max-w-md"
      >
        <Link href="/cart">
          <div className="bg-primary/90 backdrop-blur-xl text-primary-foreground rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between active:scale-[0.98] transition-all border border-white/20 group">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-2xl p-2.5 shadow-inner">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-70 leading-none">
                  {locale === 'kk' ? 'Себетте' : 'В корзине'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black leading-none tracking-tight">{totalPrice.toLocaleString()} ₸</span>
                  <span className="text-xs font-bold opacity-60 bg-white/10 px-2 py-0.5 rounded-full">
                    {totalCount} {locale === 'kk' ? 'тағам' : 'блюдо'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg group-hover:bg-primary group-hover:text-white transition-all">
              <span>{locale === 'kk' ? 'Өту' : 'Перейти'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  )
}
