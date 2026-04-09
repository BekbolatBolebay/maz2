'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, LayoutGrid, User } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, key: 'home' as const },
  { href: '/orders', icon: ClipboardList, key: 'orders' as const },
  { href: '/management', icon: LayoutGrid, key: 'management' as const },
  { href: '/profile', icon: User, key: 'profile' as const },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { lang } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border h-[72px] pb-safe flex items-center justify-around px-2 max-w-screen-xl mx-auto shadow-lg md:rounded-t-3xl md:bottom-4 md:mx-4 md:left-1/2 md:-translate-x-1/2 md:border-x md:border-b md:rounded-b-3xl md:h-16 md:pb-0">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2"
          >
            <Icon
              className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              {t(lang, item.key)}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
