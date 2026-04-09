import { getCafeSettings } from '@/lib/cafe-db'
import { ArrowLeft, LayoutGrid, UtensilsCrossed, Settings, LogOut, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ManagePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const cafe = await getCafeSettings()
    if (!cafe) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold mb-4">Restaurant not found</h1>
                <p className="text-muted-foreground mb-6">You don't have a restaurant associated with your account.</p>
                <Link href="/" className="text-primary hover:underline flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
            </div>
        )
    }

    const menuItems = [
        { title: 'Menu Management', icon: UtensilsCrossed, href: '/manage/menu', desc: 'Add, edit and manage dishes' },
        // { title: 'Orders', icon: ShoppingBag, href: '/manage/orders', desc: 'View and manage active orders' },
        // { title: 'Cafe Settings', icon: Settings, href: '/manage/settings', desc: 'Update business info' },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-muted/30">
            {/* Header */}
            <div className="bg-card px-6 py-8 border-b border-border shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
                        {cafe.image_url ? (
                            <img src={cafe.image_url} alt={cafe.name_ru} className="w-full h-full object-cover" />
                        ) : (
                            <UtensilsCrossed className="w-8 h-8 text-primary" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{cafe.name_ru || cafe.name_kk}</h1>
                        <p className="text-sm text-muted-foreground">{cafe.address}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/50 rounded-2xl p-4 border border-border/50">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Status</p>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cafe.is_open ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="font-bold text-sm">{cafe.is_open ? 'Open' : 'Closed'}</span>
                        </div>
                    </div>
                    <div className="bg-secondary/50 rounded-2xl p-4 border border-border/50">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Rating</p>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm">{cafe.rating.toFixed(1)}</span>
                            <span className="text-[10px] text-muted-foreground">/ 5.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Grid */}
            <div className="p-6 space-y-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Management</p>
                <div className="grid grid-cols-1 gap-3">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group bg-card hover:bg-primary/[0.02] active:scale-[0.99] transition-all rounded-3xl p-5 border border-border flex items-center gap-4"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <item.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                                <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">{item.desc}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto p-6 space-y-3">
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 w-full py-4 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Customer App
                </Link>
            </div>
        </div>
    )
}
