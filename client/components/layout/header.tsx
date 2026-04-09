'use client'
import { motion, AnimatePresence } from 'framer-motion'

import { Globe, Moon, Sun, ChevronLeft, User, LogIn } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartCount } from '@/hooks/use-cart-count'
import { useFavoritesCount } from '@/hooks/use-favorites-count'
import { UtensilsCrossed, Heart, ShoppingCart, Clock, Home } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function Header({
  title,
  backButton = false,
  onBack
}: {
  title?: string,
  backButton?: boolean,
  onBack?: () => void
}) {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useI18n()
  const { user, profile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const cartCount = useCartCount()
  const favoritesCount = useFavoritesCount()

  const navItems = [
    { href: '/', label: t.common.home, icon: Home },
    { href: '/restaurants', label: t.common.menu, icon: UtensilsCrossed },
    { href: '/favorites', label: t.common.favorites, icon: Heart, badge: favoritesCount },
    { href: '/cart', label: t.common.cart, icon: ShoppingCart, badge: cartCount },
    { href: '/orders', label: locale === 'kk' ? 'Тарих' : 'История', icon: Clock },
  ]

  const handleBack = () => {
    if (onBack) onBack()
    else router.back()
  }

  const toggleTheme = (event: React.MouseEvent) => {
    const isDark = theme === 'dark'

    // If View Transitions API is not supported, just switch theme
    if (!document.startViewTransition) {
      setTheme(isDark ? 'light' : 'dark')
      return
    }

    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    )

    const transition = document.startViewTransition(() => {
      setTheme(isDark ? 'light' : 'dark')
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]
      document.documentElement.animate(
        {
          clipPath: isDark ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: isDark
            ? '::view-transition-old(root)'
            : '::view-transition-new(root)',
        }
      )
    })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="flex items-center justify-between h-14 px-4 max-w-screen-xl mx-auto">
        <div className="flex items-center gap-3">
          {backButton && (
            <Button variant="ghost" size="icon" className="h-10 w-10 -ml-2 rounded-xl text-foreground hover:bg-secondary" onClick={handleBack}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-lg font-black tracking-tight truncate max-w-[200px] text-foreground">
            {title || <span className="text-[#e11d48]">Мәзір APP</span>}
          </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all relative",
                  isActive
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-4 h-4", isActive && "scale-110")} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1.5 -right-2.5 min-w-[14px] h-[14px] flex items-center justify-center p-0 text-[8px] border border-background"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="header-nav-active"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    initial={false}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-secondary/50 border border-border hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
              >
                <Globe className="h-5 w-5" />
                <span className="sr-only">{t.common.language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[140px] bg-background border-border text-foreground">
              <DropdownMenuItem onClick={() => setLocale('en')} className="rounded-xl px-3 py-2 cursor-pointer hover:bg-secondary focus:bg-secondary">
                <span className="flex-1 text-sm font-medium">English</span> {locale === 'en' && <span className="text-primary font-bold ml-2">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale('ru')} className="rounded-xl px-3 py-2 cursor-pointer hover:bg-secondary focus:bg-secondary">
                <span className="flex-1 text-sm font-medium">Русский</span> {locale === 'ru' && <span className="text-primary font-bold ml-2">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale('kk')} className="rounded-xl px-3 py-2 cursor-pointer hover:bg-secondary focus:bg-secondary">
                <span className="flex-1 text-sm font-medium">Қазақша</span> {locale === 'kk' && <span className="text-primary font-bold ml-2">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl relative group overflow-hidden border border-border hover:bg-secondary transition-all"
            onClick={toggleTheme}
          >
            <div className="relative h-5 w-5">
              <Sun className="h-5 w-5 absolute inset-0 rotate-0 scale-100 transition-all duration-500 transform-gpu dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="h-5 w-5 absolute inset-0 rotate-90 scale-0 transition-all duration-500 transform-gpu dark:rotate-0 dark:scale-100 text-indigo-400 font-bold" />
            </div>
            <span className="sr-only">{t.common.theme}</span>
          </Button>

          {/* ── Profile / Login ── */}
          <Button
            variant="ghost"
            className={cn(
              "h-10 rounded-xl border transition-all active:scale-95 px-3",
              user
                ? "border-primary/20 bg-primary/10 text-foreground hover:border-primary/40 hover:bg-primary/20"
                : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            onClick={() => router.push(user ? '/profile' : '/login')}
          >
            {user ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 border border-background shadow-sm">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-white text-[10px] font-black">
                    {profile?.full_name?.substring(0, 1).toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-black hidden sm:inline-block pr-1">
                  {profile?.full_name?.split(' ')[0] || 'User'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-primary">
                <LogIn className="h-5 w-5" />
                <span className="text-xs font-black">{locale === 'ru' ? 'Войти' : 'Кіру'}</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
