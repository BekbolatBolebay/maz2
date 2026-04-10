'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ChevronLeft, Shovel as Sparkle, Settings, ShieldCheck, Mail, MessageSquare, Megaphone } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export default function NotificationsPage() {
    const router = useRouter()
    const { t } = useI18n()
    
    // In a real app, these would be saved in VPS/Supabase
    const [settings, setSettings] = useState({
        orders: true,
        promo: false,
        news: true,
        security: true
    })

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-black tracking-tight">{t.profile?.notifications || 'Хабарландырулар'}</h1>
            </div>

            <div className="p-6 space-y-8">
                {/* Status Card */}
                <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black mb-1">Push хабарламалар</h2>
                            <p className="text-slate-400 text-xs font-bold">Барлығы қосылып тұр</p>
                        </div>
                        <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                            <Bell className="w-8 h-8 text-primary animate-bounce-slow" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Негізгі баптаулар</h3>
                        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
                            <CardContent className="p-2 space-y-1">
                                <div className="flex items-center justify-between p-5 rounded-[1.5rem] hover:bg-slate-50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">Тапсырыс күйі</h4>
                                            <p className="text-[10px] text-slate-500">Заказыңыз туралы мәліметтер</p>
                                        </div>
                                    </div>
                                    <Switch checked={settings.orders} onCheckedChange={() => toggle('orders')} />
                                </div>

                                <div className="flex items-center justify-between p-5 rounded-[1.5rem] hover:bg-slate-50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Megaphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">Акциялар мен офферлер</h4>
                                            <p className="text-[10px] text-slate-500">Жеңілдіктер мен сыйлықтар</p>
                                        </div>
                                    </div>
                                    <Switch checked={settings.promo} onCheckedChange={() => toggle('promo')} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Қауіпсіздік</h3>
                        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
                            <CardContent className="p-2">
                                <div className="flex items-center justify-between p-5 rounded-[1.5rem] hover:bg-slate-50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">Кіру туралы хабарлама</h4>
                                            <p className="text-[10px] text-slate-500">Жаңа құрылғы қосылғанда</p>
                                        </div>
                                    </div>
                                    <Switch checked={settings.security} onCheckedChange={() => toggle('security')} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 text-indigo-700 flex gap-4">
                    <Mail className="w-6 h-6 shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">
                        Біз тек маңызды ақпаратты ғана жібереміз. Кез келген уақытта жазылудан бас тарта аласыз.
                    </p>
                </div>
            </div>
        </div>
    )
}
