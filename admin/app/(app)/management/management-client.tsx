'use client'

import Link from 'next/link'
import { UtensilsCrossed, Users, Megaphone, BarChart3, Star, Settings, LayoutGrid, Loader2, CheckCircle, CalendarCheck, Calendar } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import type { Restaurant } from '@/lib/db'
import { cn } from '@/lib/utils'
import { useTransition } from 'react'
import { seedDefaultCategories } from '@/lib/actions'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import { toast } from 'sonner'

const sections = [
  {
    href: '/menu',
    icon: UtensilsCrossed,
    label_kk: 'Мәзір',
    label_ru: 'Меню',
    desc_kk: 'Тағамдар мен санаттар',
    desc_ru: 'Блюда и категории',
    color: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
  },
  {
    href: '/marketing',
    icon: Megaphone,
    label_kk: 'Маркетинг',
    label_ru: 'Маркетинг',
    desc_kk: 'Промокодтар мен баннерлер',
    desc_ru: 'Промокоды и баннеры',
    color: 'bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400',
  },
  {
    href: '/reviews',
    icon: Star,
    label_kk: 'Пікірлер',
    label_ru: 'Отзывы',
    desc_kk: 'Клиент пікірлері',
    desc_ru: 'Отзывы клиентов',
    color: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400',
  },
  {
    href: '/clients',
    icon: Users,
    label_kk: 'Клиенттер',
    label_ru: 'Клиенты',
    desc_kk: 'Клиенттер тізімі',
    desc_ru: 'Список клиентов',
    color: 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
  },
  {
    href: '/analytics',
    icon: BarChart3,
    label_kk: 'Аналитика',
    label_ru: 'Аналитика',
    desc_kk: 'Табыс және статистика',
    desc_ru: 'Выручка и статистика',
    color: 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400',
  },
  {
    href: '/profile',
    icon: Settings,
    label_kk: 'Профиль',
    label_ru: 'Профиль',
    desc_kk: 'Кафе параметрлері',
    desc_ru: 'Настройки кафе',
    color: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
  },
  {
    href: '/tables',
    icon: Calendar,
    label_kk: 'Орындар',
    label_ru: 'Столы',
    desc_kk: 'Брондауларды басқару',
    desc_ru: 'Управление бронями',
    color: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  },
]

export default function ManagementClient({ settings }: { settings: Restaurant | null }) {
  const { lang } = useApp()
  const [isPending, startTransition] = useTransition()

  function handleSeedCategories() {
    startTransition(async () => {
      const result = await seedDefaultCategories()
      if (result.error) {
        toast.error(lang === 'kk' ? 'Қате кетті' : 'Произошла ошибка')
      } else if (result.added === 0) {
        toast.info(lang === 'kk' ? 'Барлық категориялар бар' : 'Все категории уже добавлены')
      } else {
        toast.success(
          lang === 'kk'
            ? `${result.added} категория қосылды ✅`
            : `Добавлено ${result.added} категорий ✅`
        )
      }
    })
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">{t(lang, 'management')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {(lang === 'kk' ? settings?.name_kk : settings?.name_ru) || (lang === 'kk' ? 'Кафе' : 'Кафе')}
        </p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.href}
              href={s.href}
              className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:border-primary/30 active:scale-[0.98] transition-all"
            >
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', s.color)}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{lang === 'kk' ? s.label_kk : s.label_ru}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{lang === 'kk' ? s.desc_kk : s.desc_ru}</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-muted-foreground text-xs font-bold">›</span>
              </div>
            </Link>
          )
        })}

        {/* Стандартты категориялар батырмасы */}
        <div className="bg-card rounded-2xl border border-dashed border-primary/30 p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {lang === 'kk' ? 'Стандартты категориялар' : 'Стандартные категории'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'kk'
                  ? `${DEFAULT_CATEGORIES.length} категория: Фаст-фуд, Ұлттық, Сусындар...`
                  : `${DEFAULT_CATEGORIES.length} категорий: Фаст-фуд, Ұлттық, Напитки...`}
              </p>
            </div>
            <button
              onClick={handleSeedCategories}
              disabled={isPending}
              className="shrink-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5"
            >
              {isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCircle className="w-3.5 h-3.5" />}
              {lang === 'kk' ? 'Қосу' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
