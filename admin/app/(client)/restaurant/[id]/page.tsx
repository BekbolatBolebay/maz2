import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Star, Clock, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/layout/bottom-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MenuItemCard } from '@/components/restaurant/menu-item-card'
import { FavoriteButton } from '@/components/restaurant/favorite-button'

import { RestaurantHeader } from '@/components/restaurant/restaurant-header'
import { isRestaurantOpen } from '@/lib/restaurant-utils'

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch restaurant details
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single()

    if (!restaurant) {
        notFound()
    }

    // Fetch working hours
    const { data: workingHours } = await supabase
        .from('working_hours')
        .select('*')
        .eq('cafe_id', id)
        .order('day_of_week')

    // Fetch categories
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('cafe_id', id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    // Fetch menu items
    const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('cafe_id', id)
        .eq('is_available', true)
        .order('sort_order', { ascending: true })

    // Determine is_open status dynamically
    const status = isRestaurantOpen(restaurant.status, workingHours)
    const isOpen = status.isOpen
    
    const nowAlmatyParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Almaty',
        weekday: 'short'
    }).formatToParts(new Date());
    const weekdayShort = nowAlmatyParts.find(p => p.type === 'weekday')?.value || '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIdx = days.indexOf(weekdayShort);

    const timeInfo = workingHours?.find(h => h.day_of_week === todayIdx)
    const workingHoursText = timeInfo && !timeInfo.is_day_off && timeInfo.open_time && timeInfo.close_time
        ? `${timeInfo.open_time.slice(0, 5)} - ${timeInfo.close_time.slice(0, 5)}`
        : 'Closed'

    return (
        <div className="flex flex-col min-h-screen pb-16 bg-slate-950">
            <RestaurantHeader
                restaurant={restaurant}
                isOpen={isOpen}
                workingHoursText={workingHoursText}
                lang="ru"
                actions={<FavoriteButton restaurantId={id} />}
            />

            <main className="flex-1 overflow-auto bg-background -mt-6 relative z-20 rounded-t-[32px] pt-6">
                <div className="max-w-screen-xl mx-auto px-4">
                    <div className="mb-6">
                        <div className="flex items-start justify-between mb-2">
                            <h1 className="text-2xl font-bold">{restaurant.name_ru || restaurant.name_en}</h1>
                            <div className="flex items-center gap-1.5 ml-2 bg-accent/10 px-2 py-1 rounded-lg">
                                <Star className="w-4 h-4 fill-accent text-accent" />
                                <span className="text-base font-bold text-accent">{(restaurant.rating || 5.0).toFixed(1)}</span>
                            </div>
                        </div>

                        {(restaurant.description_ru || restaurant.description_en) && (
                            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                                {restaurant.description_ru || restaurant.description_en}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/50 border border-border/50">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="text-xs font-medium">
                                    {restaurant.delivery_time_min || 30}-{restaurant.delivery_time_max || 45} мин
                                </span>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/50 border border-border/50 text-xs font-medium">
                                {restaurant.delivery_fee === 0 ? (
                                    <span className="text-green-600 dark:text-green-400">Тапсырысқа қосалады жеткізу ақысы</span>
                                ) : (
                                    <span>Жеткізу: {restaurant.delivery_fee} ₸</span>
                                )}
                            </div>
                        </div>

                        {restaurant.address && (
                            <div className="flex items-start gap-2 text-sm mb-4 bg-secondary/30 p-3 rounded-2xl border border-border/50">
                                <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                                <span className="text-muted-foreground leading-snug">{restaurant.address}</span>
                            </div>
                        )}

                        {restaurant.phone && (
                            <Button
                                variant="outline"
                                className="w-full justify-center gap-2 rounded-2xl h-12 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                                asChild
                            >
                                <a href={`tel:${restaurant.phone}`}>
                                    <Phone className="w-4 h-4 text-primary" />
                                    <span className="text-primary font-bold">Кафемен байланысу</span>
                                </a>
                            </Button>
                        )}
                    </div>

                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="w-full justify-start gap-2 h-auto p-0 bg-transparent border-b border-border rounded-none mb-6 overflow-x-auto scrollbar-none">
                            <TabsTrigger
                                value="all"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-bold"
                            >
                                Барлығы
                            </TabsTrigger>
                            {categories?.map((cat) => (
                                <TabsTrigger
                                    key={cat.id}
                                    value={cat.id}
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-bold whitespace-nowrap"
                                >
                                    {cat.name_ru}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="all" className="mt-0 pb-10">
                            <div className="grid grid-cols-2 gap-4">
                                {menuItems?.map((item) => (
                                    <MenuItemCard key={item.id} item={item} />
                                ))}
                            </div>
                        </TabsContent>

                        {categories?.map((cat) => (
                            <TabsContent key={cat.id} value={cat.id} className="mt-0 pb-10">
                                <div className="grid grid-cols-2 gap-4">
                                    {menuItems
                                        ?.filter((item) => item.category_id === cat.id)
                                        .map((item) => (
                                            <MenuItemCard key={item.id} item={item} />
                                        ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </main>

            <BottomNav />
        </div>
    )
}
