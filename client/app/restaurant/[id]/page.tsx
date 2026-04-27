import { notFound } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Heart, Star, Clock, MapPin, Phone, Image as ImageIcon, CalendarCheck } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MenuItemCard } from '@/components/restaurant/menu-item-card'
import { FavoriteButton } from '@/components/restaurant/favorite-button'
import { ShareButton } from '@/components/restaurant/share-button'
import { GroupOrderButton } from '@/components/restaurant/group-order-button'
import { Metadata } from 'next'
import RestaurantMap from '@/components/restaurant/restaurant-map'
import { isRestaurantOpen } from '@/lib/restaurant-utils'
import { fetchRestaurantWithRating } from '@/lib/restaurant-utils-rating'

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const restaurant = await fetchRestaurantWithRating(id)

  if (!restaurant) {
    notFound()
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('cafe_id', id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('cafe_id', id)
    .eq('is_available', true)
    .order('sort_order', { ascending: true })

  const { data: workingHours } = await supabase
    .from('working_hours')
    .select('*')
    .eq('cafe_id', id)

  const status = isRestaurantOpen(restaurant.status, workingHours)
  const displayStatus = status.isOpen ? 'Ашық' : 'Жабық'
  
  const nowAlmatyParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Almaty',
    weekday: 'short'
  }).formatToParts(new Date());
  const weekdayShort = nowAlmatyParts.find(p => p.type === 'weekday')?.value || '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIdx = days.indexOf(weekdayShort);

  const timeInfo = workingHours?.find(h => h.day_of_week === todayIdx)
  const workingHoursText = timeInfo && !timeInfo.is_day_off
    ? `${timeInfo.open_time.slice(0, 5)} - ${timeInfo.close_time.slice(0, 5)}`
    : ''

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="relative h-48 bg-muted overflow-hidden">
        {restaurant.banner_url ? (
          <Image
            src={restaurant.banner_url}
            alt={restaurant.name_ru || restaurant.name_en}
            fill
            className="object-cover transition-transform hover:scale-105 duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <div className="relative">
              <ImageIcon className="w-12 h-12 text-primary/20" />
              <div className="absolute inset-0 blur-2xl bg-primary/20 -z-10" />
            </div>
            <span className="mt-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">Məzir APP</span>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
          <Link href="/">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-background/80 backdrop-blur hover:bg-background/90"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <ShareButton id={id} name={restaurant.name_ru || restaurant.name_kk} />
            <FavoriteButton restaurantId={id} />
          </div>
        </div>

        {status.isOpen ? (
          <Badge className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-primary border-0">
            {displayStatus} {workingHoursText && `• ${workingHoursText}`}
          </Badge>
        ) : (
          <Badge className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground border-0">
            {displayStatus} {status.message.includes('Opens at') && `• ${status.message.split('at ')[1]}`}
          </Badge>
        )}
      </div>

      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold">{restaurant.name_ru || restaurant.name_en}</h1>
              <div className="flex items-center gap-1 ml-2">
                <Star className="w-5 h-5 fill-accent text-accent" />
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold">{restaurant.rating.toFixed(1)}</span>
                  {(restaurant as any).review_count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({(restaurant as any).review_count} {(restaurant as any).review_count === 1 ? 'пікір' : 'пікір'})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {(restaurant.description_ru || restaurant.description_en) && (
              <p className="text-muted-foreground mb-3">{restaurant.description_ru || restaurant.description_en}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {restaurant.delivery_time_min}-{restaurant.delivery_time_max} мин
                </span>
              </div>
              {restaurant.delivery_fee === 0 ? (
                <span className="text-accent font-medium">Тегін жеткізу</span>
              ) : (
                <span>Жеткізу: {restaurant.delivery_fee}₸</span>
              )}
            </div>

            {restaurant.address && (
              <div className="flex items-start gap-2 text-sm mb-3">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{restaurant.address}</span>
              </div>
            )}

            {restaurant.phone && (
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                asChild
              >
                <a href={`tel:${restaurant.phone}`}>
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">Кафемен байланысу</span>
                </a>
              </Button>
            )}

            <div className="flex flex-col gap-3 mt-4">
              {restaurant.is_booking_enabled && (
                <Button
                  asChild
                  className="rounded-2xl h-14 font-black shadow-xl shadow-primary/20 text-lg"
                >
                  <Link href={`/checkout?type=booking&restaurant=${restaurant.id}`}>
                    <CalendarCheck className="w-5 h-5 mr-2" />
                    Орын брондау
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="rounded-2xl h-12 font-bold border-2"
              >
                <Link href="/cart">Тапсырыс беру (Жеткізу / Өзі алып кету)</Link>
              </Button>
              <GroupOrderButton restaurantId={restaurant.id} />
            </div>


            {/* Карта (Restaurant Location) */}
            {restaurant.latitude && restaurant.longitude && (
              <RestaurantMap
                latitude={restaurant.latitude}
                longitude={restaurant.longitude}
                restaurantName={restaurant.name_kk || restaurant.name_ru}
                address={restaurant.address}
              />
            )}
          </div>

          {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {restaurant.cuisine_types.map((category: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
          )}

          {/* Sticky Categories Navigation */}
          <Tabs defaultValue="all" className="w-full">
            <div className="sticky top-0 z-40 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 border-b border-border/10 shadow-sm transition-all duration-300">
              <TabsList className="w-full justify-start gap-2 h-auto p-1.5 bg-muted/40 rounded-2xl overflow-x-auto scrollbar-hide no-scrollbar">
                <TabsTrigger 
                  value="all" 
                  className="rounded-xl px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all font-bold"
                >
                  Барлығы
                </TabsTrigger>
                {categories?.map((cat) => (
                  <TabsTrigger 
                    key={cat.id} 
                    value={cat.id} 
                    className="rounded-xl px-5 py-2.5 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all font-bold"
                  >
                    {cat.name_ru}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-1 gap-3">
                {menuItems?.map((item) => {
                  const category = categories?.find(c => c.id === item.category_id)
                  return (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      isOpen={status.isOpen}
                      isCombo={category?.is_combo || false}
                      layout="horizontal"
                    />
                  )
                })}
              </div>
            </TabsContent>

            {categories?.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="mt-4">
                <div className="grid grid-cols-1 gap-3">
                  {menuItems
                    ?.filter((item) => item.category_id === cat.id)
                    .map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        isOpen={status.isOpen}
                        isCombo={cat.is_combo || false}
                        layout="horizontal"
                      />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>

    </div>
  )
}
