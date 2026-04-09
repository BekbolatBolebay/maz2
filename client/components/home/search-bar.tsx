'use client'

import { Search, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

export function SearchBar() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const initialSearch = searchParams.get('q') || ''
  const [value, setValue] = useState(initialSearch)

  // Debounced search update
  useEffect(() => {
    // Don't trigger search navigation on initial mount if value is empty
    if (!value && !searchParams.get('q')) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }

      // Only navigate if the query actually changed or if we need to move to the restaurants page
      const currentQuery = searchParams.get('q') || ''
      if (value === currentQuery && pathname.includes('/restaurants')) return

      const targetPath = pathname.includes('/restaurants') ? pathname : '/restaurants'
      router.push(`${targetPath}?${params.toString()}`)
    }, 500)

    return () => clearTimeout(timer)
  }, [value, router, searchParams, pathname])

  const handleClear = () => {
    setValue('')
  }

  return (
    <div className="relative group max-w-2xl mx-auto w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-300" />
      </div>
      <Input
        type="text"
        placeholder={locale === 'kk' ? 'Кафелер мен тамақты іздеу' : 'Поиск кафе и еды'}
        className="h-12 pl-12 pr-12 rounded-[20px] border-none bg-secondary/30 backdrop-blur-md focus-visible:ring-primary/10 transition-all duration-300 font-medium text-sm shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] placeholder:text-muted-foreground/40 hover:bg-secondary/40"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted/80 rounded-full transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
