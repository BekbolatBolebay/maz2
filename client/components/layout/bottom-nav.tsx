'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, Heart, ShoppingCart, Clock, User } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useCartCount } from '@/hooks/use-cart-count'
import { useFavoritesCount } from '@/hooks/use-favorites-count'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function BottomNav() {
  const pathname = usePathname()
  const { t, locale } = useI18n()
  const cartCount = useCartCount()
  const favoritesCount = useFavoritesCount()

  // Hide BottomNav on certain pages
  const hideOn = ['/checkout', '/login', '/register', '/booking', '/restaurant/']
  if (hideOn.some(path => pathname?.startsWith(path))) {
    return null
  }

  const navItems = [
    { href: '/', label: locale === 'kk' ? 'Басты бет' : 'Главная', icon: Home },
    { href: '/restaurants', label: locale === 'kk' ? 'Мәзірлер' : 'Меню', icon: UtensilsCrossed },
    { href: '/favorites', label: locale === 'kk' ? 'Таңдаулар' : 'Избранное', icon: Heart, badge: favoritesCount },
    { href: '/cart', label: locale === 'kk' ? 'Себет' : 'Корзина', icon: ShoppingCart, badge: cartCount },
    { href: '/orders', label: locale === 'kk' ? 'Тапсырыс' : 'Заказы', icon: Clock },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)] md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
 
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-[10px] font-black uppercase tracking-tighter transition-all relative active:scale-95 duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-all duration-300", isActive && "scale-110 drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] flex items-center justify-center p-0 text-[10px] font-black leading-none border-2 border-background shadow-lg"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn("leading-none transition-all", isActive && "font-black tracking-widest text-[8px]")}>{item.label}</span>
              {isActive && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
