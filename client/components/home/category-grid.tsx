'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/i18n-context'

import { LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  name_ru: string
  name_kk: string
  icon_url?: string
}

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function CategoryGrid({ initialCategories }: { initialCategories: Category[] }) {
  const { t, locale } = useI18n()
  const [categories, setCategories] = useState(initialCategories)
  const supabase = createClient()

  useEffect(() => {
    // Real-time subscription for category changes
    const channel = supabase
      .channel('home-category-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('home_visible', true)
          .order('home_sort_order', { ascending: true })
        if (data) setCategories(data)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const displayCategories = categories.length > 0 ? categories.slice(0, 7) : []

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-foreground/90 tracking-tight">
          {t.home.categories}
        </h2>
      </div>
      <div className={cn(
        "grid gap-x-3 gap-y-6",
        displayCategories.length < 3 ? "flex flex-wrap justify-start gap-8" : "grid-cols-4"
      )}>
        {displayCategories.map((category, index) => (
          <Link
            key={index}
            href={`/restaurants?category=${encodeURIComponent(category.name_ru)}`}
            className="block group"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-16 rounded-[22px] overflow-hidden bg-secondary/40 ring-1 ring-border/20 group-hover:ring-primary/40 transition-all duration-300 flex items-center justify-center group-active:scale-95 shadow-sm">
                {category.icon_url ? (
                  <Image
                    src={category.icon_url}
                    alt={locale === 'ru' ? category.name_ru : category.name_kk}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                    <LayoutGrid className="w-6 h-6 text-primary/30" />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1 px-0.5">
                {locale === 'ru' ? category.name_ru : category.name_kk}
              </span>
            </div>
          </Link>
        ))}

        {/* "More" Card */}
        <Link href="/categories" className="block group">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16 rounded-[22px] overflow-hidden bg-muted/60 ring-1 ring-border/20 group-hover:ring-primary/40 transition-all duration-300 flex items-center justify-center group-active:scale-95 shadow-sm">
              <LayoutGrid className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors">
              {locale === 'kk' ? 'Барлығы' : 'Все'}
            </span>
          </div>
        </Link>
      </div>
    </section>
  )
}
