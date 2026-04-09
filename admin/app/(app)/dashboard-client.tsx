'use client'

import Link from 'next/link'
import { Star, Settings, UtensilsCrossed, Users, LayoutGrid, Bike, Megaphone, BarChart3, ChevronRight, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import type { CafeSettings, Order } from '@/lib/db'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Props {
  settings: CafeSettings | null
  stats: { todayRevenue: number; todayOrders: number; newOrders: number }
  recentOrders: Order[]
}

const mgmtItems = [
  { href: '/menu', icon: UtensilsCrossed, label_kk: 'Мәзір', label_ru: 'Меню', color: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' },
  { href: '/marketing', icon: Megaphone, label_kk: 'Маркетинг', label_ru: 'Маркетинг', color: 'bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400' },
  { href: '/reviews', icon: Star, label_kk: 'Пікірлер', label_ru: 'Отзывы', color: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400' },
  { href: '/clients', icon: Users, label_kk: 'Клиенттер', label_ru: 'Клиенты', color: 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400' },
  { href: '/analytics', icon: BarChart3, label_kk: 'Есептер', label_ru: 'Отчёты', color: 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400' },
  { href: '/profile', icon: Settings, label_kk: 'Профиль', label_ru: 'Профиль', color: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400' },
]

function getTimeAgo(dateStr: string, lang: 'kk' | 'ru') {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ru })
  } catch {
    return ''
  }
}

function getActivityIcon(order: Order) {
  if (order.status === 'completed') return <CheckCircle className="w-5 h-5 text-green-500" />
  if (order.status === 'new') return <AlertTriangle className="w-5 h-5 text-orange-500" />
  return <Clock className="w-5 h-5 text-blue-500" />
}

function getActivityText(order: Order, lang: 'kk' | 'ru') {
  const num = order.order_number
  if (lang === 'kk') {
    if (order.status === 'completed') return `Тапсырыс #${num} орындалды`
    if (order.status === 'new') return `Жаңа тапсырыс #${num}`
    return `Тапсырыс #${num} — ${order.customer_name}`
  }
  if (order.status === 'completed') return `Заказ #${num} выполнен`
  if (order.status === 'new') return `Новый заказ #${num}`
  return `Заказ #${num} — ${order.customer_name}`
}

export default function DashboardClient({ settings, stats, recentOrders }: Props) {
  const { lang } = useApp()

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-card px-4 pt-4 md:pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {settings?.image_url ? (
              <img src={settings.image_url} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none mb-0.5">
              {lang === 'kk' ? 'Қош келдіңіз,' : 'Добро пожаловать,'}
            </p>
            <p className="text-lg font-bold leading-tight text-foreground">
              {lang === 'kk' ? 'Админ-панелі' : 'Админ-панель'}
            </p>
          </div>
        </div>
        <Link href="/profile" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Link>
      </div>

      <div className="flex-1 px-4 py-3 space-y-5">
        {/* Revenue card */}
        <div className="bg-primary rounded-2xl p-4 flex items-center justify-between text-primary-foreground">
          <div>
            <p className="text-xs opacity-80 font-medium">{t(lang, 'todayRevenue')}</p>
            <p className="text-2xl font-bold mt-0.5">
              {stats.todayRevenue.toLocaleString()} ₸
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80 font-medium">{t(lang, 'todayOrders')}</p>
            <p className="text-2xl font-bold mt-0.5">{stats.todayOrders}</p>
          </div>
        </div>

        {/* Management grid */}
        <div>
          <p className="text-base font-semibold text-foreground mb-3">{t(lang, 'cafeManagement')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {mgmtItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-card rounded-2xl p-4 flex flex-col items-center justify-center gap-3 aspect-square border border-border hover:border-primary/30 active:scale-95 transition-all"
                >
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', item.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {lang === 'kk' ? item.label_kk : item.label_ru}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-base font-semibold text-foreground">{t(lang, 'recentActivity')}</p>
            <Link href="/orders" className="text-xs text-primary font-medium">
              {t(lang, 'seeAll')}
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t(lang, 'noData')}</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  {getActivityIcon(order)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">
                        {getActivityText(order, lang)}
                      </p>
                      {order.payment_method === 'freedom' && (
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                          order.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}>
                          {order.payment_status === 'paid'
                            ? (lang === 'kk' ? 'Төленді' : 'Оплачено')
                            : (lang === 'kk' ? 'Күтілуде' : 'Ожидание')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getTimeAgo(order.created_at, lang)}
                    </p>
                  </div>
                  <Link href="/orders" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
