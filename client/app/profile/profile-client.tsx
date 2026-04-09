'use client'

import { User } from '@supabase/supabase-js'
import {
    LogOut,
    User as UserIcon,
    Settings,
    ChevronRight,
    Store,
    CreditCard,
    Bell,
    HelpCircle,
    MapPin,
    History,
    Globe,
    Moon,
    ShieldCheck as VerifiedIcon,
    LogIn
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useAuth } from '@/lib/auth/auth-context'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { toast } from 'sonner'
import { useState } from 'react'

interface Props {
    user: User
    profile: any
    restaurant?: any
}

export default function ProfileClient({ user, profile, restaurant }: Props) {
    const router = useRouter()
    const { t, locale, setLocale } = useI18n()
    const { subscribeToPush, updateProfile } = useAuth()
    const supabase = createClient()

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editName, setEditName] = useState('')
    const [editPhone, setEditPhone] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const menuItems = [
        {
            label: t.profile.editProfile,
            icon: UserIcon,
            onClick: () => {
                setEditName(profile?.full_name || '')
                setEditPhone(profile?.phone || '')
                setIsEditModalOpen(true)
            }
        },
        { label: t.profile.addresses, icon: MapPin, href: '#' },
        { label: t.profile.paymentMethods, icon: CreditCard, href: '#' },
        { label: t.profile.notifications, icon: Bell, href: '#' },
        { label: t.profile.helpSupport, icon: HelpCircle, href: '#' },
        { label: t.profile.about, icon: Settings, href: '#' },
    ]

    const isGuest = user.is_anonymous

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)
        try {
            await updateProfile({ fullName: editName, phone: editPhone })
            setIsEditModalOpen(false)
            toast.success(locale === 'ru' ? 'Профиль обновлен' : 'Профиль жаңартылды')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsUpdating(false)
        }
    }

    // Filter menu items for guests
    const filteredMenuItems = isGuest
        ? menuItems.filter(item => ['Help & Support', 'About', t.profile.helpSupport, t.profile.about].includes(item.label))
        : menuItems

    return (
        <div className="flex flex-col min-h-screen pb-20 bg-background">
            {/* Premium Header with Gradient */}
            <div className="relative overflow-hidden bg-primary px-6 pt-12 pb-16">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-2xl" />
                
                <div className="relative flex flex-col items-center">
                    <div className="relative mb-4 group">
                        <Avatar className="w-24 h-24 border-4 border-white/20 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-white/10 text-white text-3xl font-black backdrop-blur-md">
                                {isGuest ? '?' : (profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase())}
                            </AvatarFallback>
                        </Avatar>
                        {!isGuest && (
                            <div className="absolute bottom-1 right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-primary">
                                <VerifiedIcon className="w-4 h-4 text-primary" />
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            {isGuest ? (locale === 'kk' ? 'Қонақ' : 'Гость') : (profile?.full_name || 'User')}
                        </h1>
                        <p className="text-sm text-white/70 font-medium">
                            {isGuest
                                ? (locale === 'kk' ? 'Тіркелмеген қолданушы' : 'Неавторизованный пользователь')
                                : user.email
                            }
                        </p>
                    </div>

                    {!isGuest && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="mt-6 rounded-full font-black px-6 h-10 bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/10 transition-all active:scale-95"
                            onClick={() => {
                                setEditName(profile?.full_name || '')
                                setEditPhone(profile?.phone || '')
                                setIsEditModalOpen(true)
                            }}
                        >
                            {t.profile.editProfile}
                        </Button>
                    )}
                </div>
            </div>

            <div className="px-5 -mt-8 pb-6 relative z-10 space-y-6">
                {/* Guest Registration Prompt */}
                {isGuest && (
                    <div className="px-1">
                        <Card className="bg-gradient-to-br from-primary to-primary/80 border-none shadow-2xl shadow-primary/20 rounded-[2.5rem] overflow-hidden">
                            <CardContent className="p-8 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black text-white mb-2 leading-tight">
                                        {locale === 'kk' ? 'Мүмкіндіктерді ашыңыз' : 'Откройте возможности'}
                                    </h3>
                                    <p className="text-sm text-white/80 mb-8 font-medium leading-relaxed max-w-[240px]">
                                        {locale === 'kk'
                                            ? 'Тапсырыс тарихын сақтау және жеке ұсыныстар алу үшін тіркеліңіз.'
                                            : 'Зарегистрируйтесь, чтобы сохранять историю и получать персональные предложения.'}
                                    </p>
                                    <Button
                                        className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-14 font-black transition-all active:scale-[0.98] shadow-lg"
                                        onClick={() => router.push('/login')}
                                    >
                                        <LogIn className="w-5 h-5 mr-2" />
                                        {locale === 'kk' ? 'Кіру немесе Тіркелу' : 'Войти или Создать'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Restaurant Management - Only if restaurant exists */}
                {restaurant && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">Management</p>
                        <Link href="/manage">
                            <Card className="bg-primary/5 hover:bg-primary/10 transition-colors border-primary/20">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                        <Store className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-primary">{locale === 'ru' ? restaurant.name_ru : restaurant.name_kk}</h3>
                                        <p className="text-xs text-primary/60">Manage your restaurant, menu and orders</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-primary/30" />
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                )}

                {/* Profile Actions */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] px-2">{t.profile.settings || 'Settings'}</p>
                    <div className="bg-card rounded-[2rem] border border-muted/50 overflow-hidden shadow-sm">
                        {filteredMenuItems.map((item, idx) => {
                            const Component = (item as any).href ? Link : 'button'
                            return (
                                <Component
                                    key={idx}
                                    href={(item as any).href}
                                    onClick={(item as any).onClick}
                                    className={`w-full flex items-center gap-4 p-5 hover:bg-primary/[0.02] transition-colors text-left group ${idx !== filteredMenuItems.length - 1 ? 'border-b border-muted/30' : ''}`}
                                >
                                    <div className="w-11 h-11 rounded-2xl bg-muted/30 flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-6">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="flex-1 text-sm font-black tracking-tight">{item.label}</span>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/20 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </Component>
                            )
                        })}
                    </div>
                </div>

                {/* Language Selection */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] px-2">{t.common.language}</p>
                    <div className="flex gap-2 p-1.5 bg-muted/30 rounded-[1.5rem] border border-muted/50">
                        {[
                            { code: 'kk', label: 'Қаз' },
                            { code: 'ru', label: 'Рус' },
                            { code: 'en', label: 'Eng' }
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                className={cn(
                                    "flex-1 py-3 rounded-2xl text-xs font-black transition-all",
                                    locale === lang.code 
                                        ? "bg-white text-primary shadow-md scale-[1.02]" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => setLocale(lang.code as any)}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Edit Profile Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t.profile.editProfile}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Аты-жөні</Label>
                                <Input
                                    id="name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Атыңызды енгізіңіз"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Телефон</Label>
                                <Input
                                    id="phone"
                                    value={editPhone}
                                    onChange={(e) => {
                                        let val = e.target.value
                                        if (!val.startsWith('+7')) {
                                            val = '+7 ' + val.replace(/\D/g, '').slice(0, 10)
                                        }
                                        setEditPhone(val)
                                    }}
                                    placeholder="+7 (700) 000-00-00"
                                    required
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                    Бас тарту
                                </Button>
                                <Button type="submit" disabled={isUpdating}>
                                    {isUpdating ? 'Сақталуда...' : 'Сақтау'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Хабарламалар</p>
                            <p className="text-xs text-muted-foreground">Жаңалықтар мен тапсырыс күйі</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={subscribeToPush}
                        className="rounded-full px-4 h-8 text-[10px] uppercase font-black tracking-widest"
                    >
                        Қосу
                    </Button>
                </div>

                {/* Sign Out */}
                <Button
                    variant="ghost"
                    className="w-full py-6 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-bold"
                    onClick={handleSignOut}
                >
                    <LogOut className="w-5 h-5" />
                    {t.profile.logout}
                </Button>
            </div>
        </div>
    )
}
