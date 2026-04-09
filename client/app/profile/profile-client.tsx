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
    ShieldCheck as VerifiedIcon,
    LogIn,
    ArrowRight,
    Sparkles
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
import { useState, useMemo } from 'react'
import { RoleBadge } from '@/components/profile/role-badge'

interface Props {
    user: User
    profile: any
    restaurant?: any
}

export default function ProfileClient({ user, profile, restaurant }: Props) {
    const router = useRouter()
    const { t, locale } = useI18n()
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

    const sections = useMemo(() => [
        {
            title: t.profile?.settings || 'Аккаунт баптаулары',
            items: [
                {
                    label: t.profile?.editProfile || 'Профильді өңдеу',
                    icon: UserIcon,
                    onClick: () => {
                        setEditName(profile?.full_name || '')
                        setEditPhone(profile?.phone || '')
                        setIsEditModalOpen(true)
                    }
                },
                { label: t.profile?.addresses || 'Мекен-жайлар', icon: MapPin, href: '#' },
                { label: t.profile?.paymentMethods || 'Төлем әдістері', icon: CreditCard, href: '#' },
                { label: t.profile?.notifications || 'Хабарламалар', icon: Bell, href: '#', badge: 'New' },
            ]
        },
        {
            title: t.profile?.helpSupport || 'Көмек және Қолдау',
            items: [
                { label: t.profile?.helpSupport || 'Көмек орталығы', icon: HelpCircle, href: '#', badge: undefined },
                { label: t.profile?.about || 'Қолданба туралы', icon: Settings, href: '#', badge: undefined },
            ]
        }
    ], [t, profile, locale])

    const isGuest = user.is_anonymous

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)
        try {
            await updateProfile({ fullName: editName, phone: editPhone })
            setIsEditModalOpen(false)
            toast.success(t.profile?.updateSuccess || 'Профиль жаңартылды', {
                icon: <Sparkles className="w-4 h-4 text-primary" />
            })
        } catch (err: any) {
            toast.error(t.profile?.updateError || err.message)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-slate-50/50 dark:bg-slate-950 font-sans">
            {/* Header with Dynamic Background */}
            <div className="relative pt-16 pb-32 px-6 overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-black/40" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                
                <div className="relative flex flex-col items-center">
                    <div className="relative group mb-6">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                        <Avatar className="w-28 h-28 border-4 border-white shadow-2xl relative transition-transform duration-500 group-hover:scale-105">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-slate-800 text-white text-4xl font-black">
                                {isGuest ? '?' : (profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase())}
                            </AvatarFallback>
                        </Avatar>
                        {!isGuest && (
                            <div className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-slate-900 rounded-full shadow-lg border-2 border-primary">
                                <VerifiedIcon className="w-4 h-4 text-primary fill-primary/10" />
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center space-y-2 mb-6">
                        <div className="flex flex-col items-center gap-2">
                             <h1 className="text-3xl font-black text-white tracking-tight">
                                {isGuest ? (t.profile?.guest || 'Гость') : (profile?.full_name || (t.common?.user || 'Пользователь'))}
                            </h1>
                            <RoleBadge role={profile?.role || 'user'} />
                        </div>
                        <p className="text-sm text-slate-400 font-medium">
                            {isGuest
                                ? (t.profile?.unauthorized || 'Неавторизованный пользователь')
                                : user.email
                            }
                        </p>
                    </div>

                    {!isGuest && (
                        <Button
                            variant="secondary"
                            className="rounded-2xl font-black px-8 h-12 bg-white text-slate-950 hover:bg-slate-100 shadow-xl transition-all active:scale-95 group"
                            onClick={() => {
                                setEditName(profile?.full_name || '')
                                setEditPhone(profile?.phone || '')
                                setIsEditModalOpen(true)
                            }}
                        >
                            {t.profile?.editProfile || 'Профильді өңдеу'}
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="px-6 -mt-12 space-y-8 relative z-20">
                {/* Restaurant Ownership Card */}
                {restaurant && (
                    <Link href="/manage" className="block transform transition-transform active:scale-[0.98]">
                        <Card className="border-none shadow-2xl shadow-primary/10 overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-5 group-hover:opacity-10 transition-opacity" />
                            <CardContent className="p-6 flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center transition-all group-hover:rotate-6">
                                    <Store className="w-8 h-8 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                                            {locale === 'ru' ? restaurant.name_ru : (locale === 'kk' ? restaurant.name_kk : restaurant.name_en || restaurant.name_ru)}
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">{t.admin?.adminBadge || 'Админ'}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-1">{t.admin?.dashboardDesc || 'Басқару панеліне өту'}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )}

                {/* Main Menu Sections */}
                {sections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{section.title}</h2>
                        </div>
                        <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] p-2 border border-slate-200/50 dark:border-slate-800 shadow-sm">
                            {section.items.map((item, iIdx) => {
                                const Component = (item as any).href ? Link : 'button'
                                return (
                                    <Component
                                        key={iIdx}
                                        href={(item as any).href}
                                        onClick={(item as any).onClick}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group",
                                            iIdx !== section.items.length - 1 && "mb-1"
                                        )}
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                                        <div className="flex items-center gap-3">
                                            {item.badge && (
                                                <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">
                                                    {item.badge}
                                                </span>
                                            )}
                                            <ChevronRight className="w-5 h-5 text-slate-300 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </Component>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {/* Analytics/History Preview (Example of more premium feel) */}
                <Card className="bg-slate-950 border-none overflow-hidden text-white">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">{locale === 'kk' ? 'Тапсырыстар' : 'Заказы'}</h3>
                                <p className="text-xs text-slate-400 mt-1">Соңғы айдағы статистикаңыз</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                                <History className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Саны</p>
                                <p className="text-2xl font-black mt-2">12</p>
                            </div>
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Үнем</p>
                                <p className="text-2xl font-black mt-2 text-emerald-400">1.2к ₸</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sign Out Section with danger style */}
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-3 p-6 rounded-[2rem] bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 transition-all font-black text-sm active:scale-[0.98]"
                >
                    <LogOut className="w-5 h-5" />
                    {t.profile?.logout || 'Шығу'}
                </button>
            </div>

            {/* Edit Profile Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">
                            {t.profile?.editProfile || 'Профильді өңдеу'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProfile} className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t.profile?.name || 'Аты-жөні'}</Label>
                            <Input
                                id="name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-900 border-none px-6 focus-visible:ring-primary"
                                placeholder={t.profile?.enterName || "Введите имя"}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t.profile?.phone || 'Телефон'}</Label>
                            <Input
                                id="phone"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-900 border-none px-6 focus-visible:ring-primary"
                                placeholder="+7 (777) 777-77-77"
                                required
                            />
                        </div>
                        <DialogFooter className="pt-4 flex !flex-col gap-3">
                            <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20" disabled={isUpdating}>
                                {isUpdating ? (t.profile?.saving || 'Сақталуда...') : (t.profile?.save || 'Сақтау')}
                            </Button>
                            <Button type="button" variant="ghost" className="w-full h-12 rounded-2xl font-black text-slate-400 hover:text-slate-600" onClick={() => setIsEditModalOpen(false)}>
                                {t.profile?.cancel || 'Бас тарту'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
