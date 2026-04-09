'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Utensils,
    Menu as MenuIcon,
    ShoppingBag,
    Users,
    Tag,
    LogOut,
    ChevronRight,
    ListFilter,
    Star,
    Settings,
    Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/auth-context'

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Home Categories', icon: ListFilter, href: '/admin/home-categories', superAdminOnly: true },
    { label: 'Categories', icon: ListFilter, href: '/admin/categories' },
    { label: 'Menu Items', icon: MenuIcon, href: '/admin/menu' },
    { label: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
    { label: 'Promotions', icon: Tag, href: '/admin/promotions' },
    { label: 'Reviews', icon: Star, href: '/admin/reviews' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
    { label: 'Clients', icon: Users, href: '/admin/users' },
    { label: 'Super Admin (New)', icon: Shield, href: 'http://localhost:5173', external: true, superAdminOnly: true },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const { profile } = useAuth()

    return (
        <div className="flex h-screen bg-muted/30">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-background flex flex-col">
                <div className="h-16 flex items-center px-6 border-b">
                    <Link href="/admin" className="flex items-center gap-2 font-bold text-xl text-primary">
                        <Utensils className="h-6 w-6" />
                        <span>Məzir ADMIN</span>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.filter(item => !item.superAdminOnly || profile?.role === 'super_admin').map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link key={item.href || item.label} href={item.href || '#'}>
                                <span className={cn(
                                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </div>
                                    {isActive && <ChevronRight className="h-4 w-4" />}
                                </span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t mt-auto">
                    <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" asChild>
                        <Link href="/">
                            <LogOut className="mr-2 h-4 w-4" />
                            Exit to App
                        </Link>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b bg-background flex items-center justify-between px-8">
                    <h2 className="text-lg font-semibold capitalize">
                        {pathname === '/admin' ? 'Dashboard' : pathname.split('/').pop()?.replace('-', ' ')}
                    </h2>
                    <div className="flex items-center gap-4">
                        {/* Admin profile / notices can go here */}
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            A
                        </div>
                    </div>
                </header>

                <section className="flex-1 overflow-y-auto p-8">
                    {children}
                </section>
            </main>
        </div>
    )
}
