'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users, Share2, Plus, Minus, Trash2, ShoppingCart, Loader2, User, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function GroupOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { lang, locale } = useI18n()
    const router = useRouter()
    const [groupOrder, setGroupOrder] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [restaurant, setRestaurant] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState('')
    const [isJoined, setIsJoined] = useState(false)

    useEffect(() => {
        const savedName = localStorage.getItem('group_order_user_name')
        if (savedName) {
            setUserName(savedName)
            setIsJoined(true)
        }

        const supabase = createClient()

        async function fetchData() {
            const { data: go } = await supabase
                .from('group_orders')
                .select('*, restaurants!cafe_id(*)')
                .eq('id', id)
                .single()
            
            if (go) {
                setGroupOrder(go)
                setRestaurant(go.restaurants)
                
                const { data: itms } = await supabase
                    .from('group_order_items')
                    .select('*, menu_items(*)')
                    .eq('group_order_id', id)
                
                setItems(itms || [])
            }
            setLoading(false)
        }

        fetchData()

        const channel = supabase
            .channel(`group-order-${id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'group_order_items', filter: `group_order_id=eq.${id}` },
                () => {
                    // Simple re-fetch for now, could be optimized
                    supabase
                        .from('group_order_items')
                        .select('*, menu_items(*)')
                        .eq('group_order_id', id)
                        .then(({ data }) => setItems(data || []))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    const handleJoin = () => {
        if (!userName.trim()) {
            toast.error(lang === 'kk' ? 'Есіміңізді жазыңыз' : 'Введите ваше имя')
            return
        }
        localStorage.setItem('group_order_user_name', userName)
        setIsJoined(true)
        toast.success(lang === 'kk' ? 'Қосылдыңыз!' : 'Вы присоединились!')
    }

    const updateQuantity = async (itemId: string, newQty: number) => {
        const supabase = createClient()
        if (newQty <= 0) {
            await supabase.from('group_order_items').delete().eq('id', itemId)
        } else {
            await supabase.from('group_order_items').update({ quantity: newQty }).eq('id', itemId)
        }
    }

    const shareLink = () => {
        const url = window.location.href
        if (navigator.share) {
            navigator.share({ title: 'Group Order', url })
        } else {
            navigator.clipboard.writeText(url)
            toast.success(lang === 'kk' ? 'Сілтеме көшірілді!' : 'Ссылка скопирована!')
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    )

    if (!groupOrder) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Тапсырыс табылмады</h2>
            <Button onClick={() => router.push('/')}>Бас бетке өту</Button>
        </div>
    )

    if (!isJoined) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
                <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl">
                    <CardContent className="p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                                <Users className="w-8 h-8" />
                            </div>
                            <h1 className="text-2xl font-black">{lang === 'kk' ? 'Топтық тапсырысқа қосылу' : 'Присоединиться к заказу'}</h1>
                            <p className="text-sm text-muted-foreground">{restaurant?.name_kk || restaurant?.name_ru}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">{lang === 'kk' ? 'Сіздің есіміңіз' : 'Ваше имя'}</label>
                                <input 
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    placeholder="Nurbolat"
                                    className="w-full h-14 rounded-2xl border-2 border-zinc-100 bg-zinc-50 px-6 font-bold focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" onClick={handleJoin}>
                                {lang === 'kk' ? 'Қосылу' : 'Присоединиться'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const total = items.reduce((sum, item) => sum + (item.menu_items?.price * item.quantity), 0)

    return (
        <div className="min-h-screen bg-zinc-50 pb-32">
            {/* Header */}
            <div className="bg-white border-b border-zinc-100 sticky top-0 z-10">
                <div className="max-w-screen-md mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.back()}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="font-black text-sm uppercase tracking-tight">{lang === 'kk' ? 'Топтық тапсырыс' : 'Групповой заказ'}</h1>
                            <p className="text-[10px] text-muted-foreground font-bold">{restaurant?.name_kk || restaurant?.name_ru}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2" onClick={shareLink}>
                        <Share2 className="w-4 h-4" />
                        {lang === 'kk' ? 'Бөлісу' : 'Поделиться'}
                    </Button>
                </div>
            </div>

            <main className="max-w-screen-md mx-auto p-4 space-y-6">
                {/* Users List */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {Array.from(new Set(items.map(i => i.user_name))).map(name => (
                        <Badge key={name} variant="secondary" className="rounded-full px-3 py-1 bg-white border border-zinc-100 shadow-sm gap-1.5 font-bold">
                            <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-2.5 h-2.5 text-primary" />
                            </div>
                            {name}
                        </Badge>
                    ))}
                </div>

                {/* Shared Cart Items */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{lang === 'kk' ? 'Себеттегі тағамдар' : 'Блюда в корзине'}</h3>
                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">{items.length} {lang === 'kk' ? 'тағам' : 'блюд'}</span>
                    </div>

                    {items.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-zinc-100">
                            <ShoppingCart className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                            <p className="text-sm font-bold text-zinc-400">{lang === 'kk' ? 'Себет бос. Мәзірден тағам қосыңыз.' : 'Корзина пуста. Добавьте блюда из меню.'}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map(item => (
                                <div key={item.id} className="bg-white rounded-[2rem] p-4 flex gap-4 shadow-sm border border-zinc-100 relative group overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-50 shrink-0">
                                        {item.menu_items?.image_url && <Image src={item.menu_items.image_url} alt={item.menu_items.name_ru} fill className="object-cover" unoptimized />}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div>
                                            <p className="text-sm font-black line-clamp-1">{locale === 'ru' ? item.menu_items?.name_ru : (item.menu_items?.name_kk || item.menu_items?.name_ru)}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                <User className="w-2.5 h-2.5" /> {item.user_name}
                                            </p>
                                        </div>
                                        <p className="text-sm font-black text-primary">{(item.menu_items?.price * item.quantity).toLocaleString()}₸</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-1.5 bg-zinc-50 rounded-2xl p-1.5 border border-zinc-100">
                                        <button 
                                            className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm active:scale-90 transition-all"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                                        <button 
                                            className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add More Button */}
                <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-2 border-dashed border-zinc-200 text-zinc-500 font-black gap-2 hover:border-primary/30 hover:text-primary transition-all"
                    asChild
                >
                    <Link href={`/restaurant/${restaurant?.id}?group_order=${id}`}>
                        <Plus className="w-5 h-5" />
                        {lang === 'kk' ? 'Тағы қосу' : 'Добавить еще'}
                    </Link>
                </Button>
            </main>

            {/* Bottom Summary Bar */}
            {items.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-zinc-100 z-20">
                    <div className="max-w-screen-md mx-auto flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === 'kk' ? 'Жалпы сомма' : 'Общая сумма'}</p>
                            <p className="text-2xl font-black text-foreground">{total.toLocaleString()}₸</p>
                        </div>
                        <Button 
                            className="h-14 px-8 rounded-2xl font-black text-lg gap-2 shadow-xl shadow-primary/20 flex-1 md:flex-none"
                            onClick={() => router.push(`/checkout?group_order=${id}&restaurant=${restaurant?.id}`)}
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {lang === 'kk' ? 'Тапсырыс беру' : 'Оформить заказ'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
