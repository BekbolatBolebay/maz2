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
    Sparkles,
    Download,
    Smartphone,
    MoreVertical,
    PlusSquare,
    Share
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useAuth } from '@/lib/auth/auth-context'
import { useApp } from '@/lib/app-context'
import { cn, formatCustomerValue } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
    const { isInstallable, isIos, isStandalone, installApp } = useApp()
    const supabase = createClient()

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editName, setEditName] = useState('')
    const [editPhone, setEditPhone] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)
    const [showInstallGuide, setShowInstallGuide] = useState(false)

    const handleInstall = () => {
        if (isIos) {
            setShowInstallGuide(true)
        } else {
            if (isInstallable) {
                installApp()
            } else {
                setShowInstallGuide(true)
            }
        }
    }

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
                        setEditName(formatCustomerValue(profile?.full_name, 'full_name') || '')
                        setEditPhone(formatCustomerValue(profile?.phone || profile?.full_name, 'phone') || '')
                        setIsEditModalOpen(true)
                    }
                },
                { label: t.profile?.addresses || 'Мекен-жайлар', icon: MapPin, href: '/profile/addresses' },
                { label: t.profile?.paymentMethods || 'Төлем әдістері', icon: CreditCard, href: '/profile/payments' },
                { label: t.profile?.notifications || 'Хабарламалар', icon: Bell, href: '/profile/notifications', badge: 'New' },
            ]
        },
        {
            title: t.profile?.helpSupport || 'Көмек және Қолдау',
            items: [
                { label: t.profile?.helpSupport || 'Көмек орталығы', icon: HelpCircle, href: '/profile/help', badge: undefined },
                { label: t.profile?.about || 'Қолданба туралы', icon: Settings, href: '/profile/about', badge: undefined },
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
                <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-blue-600/20 to-slate-950 opacity-90" />
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/30 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-500/20 rounded-full blur-[80px]" />
                </div>
                
                <div className="relative flex flex-col items-center">
                    <div className="relative group mb-8">
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-blue-400 to-primary rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-spin-slow" />
                        <Avatar className="w-32 h-32 border-4 border-white/90 dark:border-slate-800 shadow-2xl relative transition-all duration-700 group-hover:scale-105 group-hover:rotate-1">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-slate-800 text-white text-4xl font-black">
                                {isGuest ? '?' : (profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase())}
                            </AvatarFallback>
                        </Avatar>
                        {!isGuest && (
                            <div className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-900 rounded-full shadow-2xl border-2 border-primary animate-bounce-subtle">
                                <VerifiedIcon className="w-5 h-5 text-primary fill-primary/10" />
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center space-y-3 mb-8">
                        <div className="flex flex-col items-center gap-1">
                             <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                                {isGuest ? (t.profile?.guest || 'Гость') : (formatCustomerValue(profile?.full_name, 'full_name') || (t.common?.user || 'Пользователь'))}
                            </h1>
                            <div className="flex items-center gap-2">
                                <RoleBadge role={profile?.role || 'user'} />
                                <span className="h-1 w-1 rounded-full bg-white/30" />
                                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Premium Member</span>
                            </div>
                        </div>
                        <p className="text-xs text-white/60 font-medium tracking-wide">
                            {isGuest
                                ? (t.profile?.unauthorized || 'Неавторизованный пользователь')
                                : user.email
                            }
                        </p>
                    </div>

                    <div className="px-6 w-full -mb-4">
                         {/* Premium App Experience Card */}
                        <Card className="bg-slate-950 border-none overflow-hidden text-white shadow-2xl shadow-black/40 group relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-blue-600/10 opacity-50 group-hover:opacity-70 transition-opacity" />
                            <CardContent className="p-6 relative z-10">
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black tracking-tighter uppercase italic flex items-center gap-2">
                                                Mazir App
                                                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-80">
                                                {locale === 'kk' ? 'Тапсырыс беру енді жылдам' : 'Заказывать стало еще быстрее'}
                                            </p>
                                        </div>
                                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10">
                                            <Smartphone className="w-5 h-5 text-primary" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {!isStandalone && (
                                            <Button 
                                                onClick={handleInstall}
                                                className="flex-1 h-11 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-black uppercase tracking-widest text-[9px] shadow-xl active:scale-95 transition-all"
                                            >
                                                <Download className="w-3 h-3 mr-2 text-primary" />
                                                {locale === 'kk' ? 'Жүктеп алу' : 'Скачать'}
                                            </Button>
                                        )}
                                        
                                        {!isGuest && (
                                            <Button 
                                                onClick={() => {
                                                    setEditName(formatCustomerValue(profile?.full_name, 'full_name') || '')
                                                    setEditPhone(formatCustomerValue(profile?.phone || profile?.full_name, 'phone') || '')
                                                    setIsEditModalOpen(true)
                                                }}
                                                variant="outline"
                                                className={cn(
                                                    "h-11 rounded-xl bg-white/10 border-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-[9px] backdrop-blur-md active:scale-95 transition-all",
                                                    isStandalone ? "w-full" : "flex-1"
                                                )}
                                            >
                                                <ArrowRight className="w-3 h-3 mr-2" />
                                                {t.profile?.editProfile || 'Өңдеу'}
                                            </Button>
                                        )}
                                    </div>

                                    {!isStandalone && (
                                        <div className="flex items-center gap-3 pt-2 border-t border-white/5 mt-2">
                                            <div className="flex -space-x-1.5">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-5 h-5 rounded-full border border-slate-950 bg-slate-800 flex items-center justify-center text-[7px] font-black">
                                                        {i}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Android & iOS қолдайды</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <div className="px-6 space-y-8 relative z-20 mt-4">
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

                {/* Premium Analytics/Stats Card */}
                <div className="grid grid-cols-1 gap-6 relative">
                    <Card className="bg-slate-950 border-none overflow-hidden text-white shadow-2xl shadow-black/40 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-blue-600/10 opacity-50 group-hover:opacity-70 transition-opacity" />
                        <CardContent className="p-8 relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tighter uppercase italic">{locale === 'kk' ? 'Мәзір Статус' : 'Статус'}</h3>
                                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest opacity-80">Premium Experience</p>
                                </div>
                                <div className="bg-white/10 p-4 rounded-[1.5rem] backdrop-blur-xl border border-white/10 shadow-inner">
                                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 backdrop-blur-sm rounded-[2rem] p-6 border border-white/5 transition-transform hover:scale-[1.02]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <History className="w-3 h-3 text-primary" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{locale === 'kk' ? 'Тапсырыстар' : 'Заказы'}</p>
                                    </div>
                                    <p className="text-3xl font-black tracking-tighter">12</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-[2rem] p-6 border border-white/5 transition-transform hover:scale-[1.02]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <VerifiedIcon className="w-3 h-3 text-emerald-500" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{locale === 'kk' ? 'Үнем' : 'Эконом'}</p>
                                    </div>
                                    <p className="text-3xl font-black tracking-tighter text-emerald-400">1.2к <span className="text-xs font-bold text-slate-500 uppercase">₸</span></p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-black">
                                            {i}
                                        </div>
                                    ))}
                                    <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black font-sans">
                                        +5
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{locale === 'kk' ? 'Белсенді қолданушы' : 'Активный клиент'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

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

            {/* Install Guide Modal */}
            <Dialog open={showInstallGuide} onOpenChange={setShowInstallGuide}>
                <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900">
                    <DialogHeader className="space-y-4 pt-4">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 rounded-[2rem] bg-orange-500/10 flex items-center justify-center shadow-inner">
                                <Smartphone className="w-10 h-10 text-orange-500" />
                            </div>
                        </div>
                        <DialogTitle className="text-center text-2xl font-black tracking-tight">
                            {locale === 'kk' ? 'Орнату нұсқаулығы' : 'Инструкция по установке'}
                        </DialogTitle>
                        <DialogDescription className="text-center font-medium">
                            {locale === 'kk' 
                                ? 'Қосымшаны негізгі экранға қосу үшін мына қадамдарды орындаңыз:' 
                                : 'Для добавления приложения на экран выполните следующие действия:'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 flex flex-col gap-6">
                        {isIos ? (
                            <div className="space-y-6 px-2">
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                                        <Share className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <p className="text-sm font-bold leading-tight">
                                        {locale === 'kk' ? '1. Safari-де "Бөлісу" батырмасын басыңыз' : '1. Нажмите "Поделиться" в Safari'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                                        <PlusSquare className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <p className="text-sm font-bold leading-tight">
                                        {locale === 'kk' ? '2. "Бас экранға қосу" таңдаңыз' : '2. Выберите "На экран Домой"'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 px-2">
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                                        <MoreVertical className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <p className="text-sm font-bold leading-tight">
                                        {locale === 'kk' ? '1. Браузер мәзірін басыңыз' : '1. Нажмите на меню браузера'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                                        <Download className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <p className="text-sm font-bold leading-tight">
                                        {locale === 'kk' ? '2. "Қолданбаны орнату" таңдаңыз' : '2. Выберите "Установить приложение"'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center pb-6">
                        <Button
                            onClick={() => setShowInstallGuide(false)}
                            className="px-10 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-orange-500/20"
                        >
                            ОК
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
