'use client'

import Image from 'next/image'
import { Clock, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n/i18n-context'
import { formatCustomerValue } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Order = {
  id: string
  status: string
  total_amount: number
  delivery_fee: number
  customer_phone?: string
  delivery_address?: string
  created_at: string
  restaurants: {
    name: string
    name_ru: string | null
    image_url: string | null
  } | null
  order_items: Array<{
    quantity: number
    price: number
    menu_items: {
      name: string
      name_kk: string | null
      name_ru: string | null
      image_url: string | null
    } | null
  }>
}

export function OrderCard({ order }: { order: Order }) {
  const { locale, t } = useI18n()

  const statusText = (t.orders.status as any)[order.status] || order.status
  const foodTotal = (order.order_items || []).reduce((sum, item) => sum + (item.quantity * item.price), 0)

  return (
    <Card className="overflow-hidden border border-white/10 shadow-xl hover:bg-zinc-900/50 transition-all duration-300 rounded-[2.5rem] bg-zinc-950 group">
      <CardContent className="p-8">
        {/* Header Info */}
        <div className="space-y-1 mb-8">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            {t.cart.order_number_label || 'Order №'}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-black tracking-tight text-white">
              #{order.id.slice(0, 8)}
            </p>
            <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-primary transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {t.cart.address || 'Address'}
            </p>
            <p className="text-xs font-bold text-zinc-100 line-clamp-1">
              {formatCustomerValue(order.delivery_address || (order as any).customer_name, 'address') || t.common.notSpecified}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {t.common.phone || 'Phone'}
            </p>
            <p className="text-xs font-bold text-zinc-300">
              {formatCustomerValue(order.customer_phone || (order as any).customer_name, 'phone') || t.common.notSpecified}
            </p>
          </div>
        </div>

        {/* Middle Items Section */}
        <div className="bg-white/5 rounded-[2rem] p-6 mb-8 border border-white/5">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{t.common.dish}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{t.common.quantity}</span>
          </div>
          <div className="space-y-3">
            {(order.order_items || []).slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <p className="text-sm font-bold text-white truncate max-w-[60%]">
                  {locale === 'ru' 
                    ? (item.menu_items?.name_ru || (item as any).name_ru) 
                    : (item.menu_items?.name_kk || (item as any).name_kk || item.menu_items?.name_ru || (item as any).name_ru)}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-zinc-300">
                    {item.price.toFixed(0)}₸
                  </p>
                  <div className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-[10px] font-black text-primary">
                      ×{item.quantity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(order.order_items?.length || 0) > 3 && (
              <p className="text-[10px] text-center font-bold text-zinc-400 mt-2 italic">
                + {(order.order_items?.length || 0) - 3} {t.common.otherDishes}
              </p>
            )}
          </div>
        </div>

        {/* Footer Prices */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center px-2">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t.cart.delivery}</p>
            <p className="text-sm font-bold text-zinc-100">{order.delivery_fee.toFixed(0)}₸</p>
          </div>
          <div className="pt-4 border-t border-dashed border-white/10 flex justify-between items-end px-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">
              {t.common.totalAmount}
            </p>
            <p className="text-3xl font-black tracking-tighter text-white">
              {order.total_amount.toFixed(0)}<span className="text-lg ml-0.5 text-zinc-600">₸</span>
            </p>
          </div>
        </div>

        {/* Status Button */}
        <div className="bg-zinc-900 border border-white/5 text-white p-5 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">
            {statusText}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
