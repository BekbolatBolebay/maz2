export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import Link from 'next/link'
import { SearchBar } from '@/components/home/search-bar'
import { RestaurantSection } from '@/components/home/restaurant-section'
import { createClient } from '@/lib/supabase/server'
import { X, Search, Store, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MenuItemCard } from '@/components/restaurant/menu-item-card'
import { FilterDrawer } from '@/components/restaurants/filter-drawer'
import { Badge } from '@/components/ui/badge'
import { fetchRestaurantsWithRatings } from '@/lib/restaurant-utils-rating'

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    tab?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    restaurantId?: string;
    q?: string;
  }>
}) {
  const { category, tab, city, minPrice, maxPrice, sort, restaurantId, q } = await searchParams
  const supabase = await createClient()

  // ─────────────────────────────────────────────
  // Fetch Filter Data (Cities, Categories, Restaurants)
  // ─────────────────────────────────────────────
  const [
    { data: rawCategories },
    { data: allCities },
    { data: allRestaurants }
  ] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('restaurants').select('city').not('city', 'is', null),
    supabase.from('restaurants').select('id, name_ru, name_kk')
  ])

  // Deduplicate categories by name
  const allCategories = Array.from(new Map(rawCategories?.map(c => [c.name_ru, c]) || []).values())
  const uniqueCities = Array.from(new Set(allCities?.map(r => r.city) || []))

  // ─────────────────────────────────────────────
  // КАТЕГОРИЯ ТАҢДАЛСА → тек тамақтарды шығару
  // ─────────────────────────────────────────────
  if (category || minPrice || maxPrice || restaurantId || (tab === 'food' && sort)) {
    let foodQuery = supabase
      .from('menu_items')
      .select('*, restaurants!inner(id, name_ru, name_en, name_kk, city, rating, is_open)')
      .eq('is_available', true)
      .eq('restaurants.is_open', true)

    if (category) {
      const { data: catRows } = await supabase
        .from('categories')
        .select('id')
        .or(`name_kk.eq.${category},name_ru.eq.${category}`)
      if (catRows && catRows.length > 0) {
        foodQuery = foodQuery.in('category_id', catRows.map(c => c.id))
      }
    }

    if (city) {
      foodQuery = foodQuery.eq('restaurants.city', city)
    }
    if (restaurantId) {
      foodQuery = foodQuery.eq('cafe_id', restaurantId)
    }

    if (minPrice) {
      foodQuery = foodQuery.gte('price', parseFloat(minPrice))
    }

    if (maxPrice) {
      foodQuery = foodQuery.lte('price', parseFloat(maxPrice))
    }

    if (q) {
      foodQuery = foodQuery.or(`name_kk.ilike.%${q}%,name_ru.ilike.%${q}%,description_kk.ilike.%${q}%,description_ru.ilike.%${q}%`)
    }

    // Sorting
    if (sort === 'price_asc') {
      foodQuery = foodQuery.order('price', { ascending: true })
    } else if (sort === 'price_desc') {
      foodQuery = foodQuery.order('price', { ascending: false })
    } else if (sort === 'rating_desc') {
      // Rating sort is tricky with !inner, might need to sort in memory or refine query
      // For now, default to sort_order
      foodQuery = foodQuery.order('sort_order', { ascending: true })
    } else {
      foodQuery = foodQuery.order('sort_order', { ascending: true })
    }

    const { data: menuItems } = await foodQuery.limit(60)

    return (
      <div className="flex flex-col min-h-screen pb-16 bg-muted/20">
        <Header title={category || "Тамақтар"} />
        <main className="flex-1 overflow-auto">
          <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-6">
            <div className="flex gap-2">
              <div className="flex-1"><SearchBar /></div>
              <FilterDrawer
                categories={allCategories || []}
                cities={uniqueCities}
                restaurants={allRestaurants || []}
                currentParams={{ category, city, minPrice, maxPrice, sort, restaurantId }}
              />
            </div>

            {/* Active Filters Bar */}
            {(category || city || minPrice || maxPrice || restaurantId) && (
              <div className="flex flex-wrap gap-2 items-center bg-background p-3 rounded-2xl border border-muted shadow-sm animate-in fade-in slide-in-from-top duration-300">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Сүзгілер:</span>
                {category && <Badge variant="secondary" className="rounded-lg py-1 px-3 bg-primary/10 text-primary border-none">{category}</Badge>}
                {q && <Badge variant="secondary" className="rounded-lg py-1 px-3 bg-amber-100 text-amber-700 border-none">"{q}"</Badge>}
                {city && <Badge variant="secondary" className="rounded-lg py-1 px-3 bg-blue-100 text-blue-700 border-none">{city}</Badge>}
                {(minPrice || maxPrice) && <Badge variant="secondary" className="rounded-lg py-1 px-3 bg-green-100 text-green-700 border-none">{minPrice || '0'} - {maxPrice || '∞'} ₸</Badge>}
                {restaurantId && <Badge variant="secondary" className="rounded-lg py-1 px-3 bg-purple-100 text-purple-700 border-none">Кафе таңдалды</Badge>}
                <Link href="/restaurants" className="ml-auto">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3 w-3 mr-1" /> ТАЗАЛАУ
                  </Button>
                </Link>
              </div>
            )}

            {/* Тамақтар тізімі */}
            {menuItems && menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {menuItems.map((item: any) => (
                  <MenuItemCard
                    key={item.id}
                    layout="horizontal"
                    item={{
                      ...item,
                      restaurant: item.restaurants
                        ? { id: item.restaurants.id, name_ru: item.restaurants.name_ru, name_en: item.restaurants.name_en }
                        : undefined,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-background rounded-[2rem] border-2 border-dashed border-muted">
                <div className="text-muted-foreground/20 mb-4 animate-pulse">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-bold">Тамақ табылмады</h3>
                <p className="text-sm text-muted-foreground max-w-[200px] mx-auto mt-2 italic">
                  Таңдалған параметрлер бойынша нәтиже жоқ. Сүзгілерді өзгертіп көріңіз.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // КАТЕГОРИЯ ЖОҚ (және басқалар) → Барлығы | Кафе | Тамақ tabs
  // ─────────────────────────────────────────────
  const activeTab = tab || 'all'

  let menuItemsQuery = supabase
    .from('menu_items')
    .select('*, restaurants(id, name_ru, name_en, name_kk)')
    .eq('is_available', true)

  if (q) {
    menuItemsQuery = menuItemsQuery.or(`name_kk.ilike.%${q}%,name_ru.ilike.%${q}%,description_kk.ilike.%${q}%,description_ru.ilike.%${q}%`)
  }

  const [restaurants, { data: menuItems }] = await Promise.all([
    fetchRestaurantsWithRatings({
      isOpen: true,
      city: city || undefined,
      search: q || undefined,
      limit: 100
    }),
    menuItemsQuery.order('sort_order', { ascending: true }).limit(60)
  ])

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-muted/20">
      <Header title="Мәзірлер" />

      <main className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-6">
          <div className="flex gap-2">
            <div className="flex-1"><SearchBar /></div>
            <FilterDrawer
              categories={allCategories || []}
              cities={uniqueCities}
              restaurants={allRestaurants || []}
              currentParams={{ category, city, minPrice, maxPrice, sort, restaurantId }}
            />
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 bg-background/50 backdrop-blur-sm rounded-2xl p-1.5 border border-muted shadow-sm overflow-x-auto no-scrollbar">
            <Link
              href="/restaurants?tab=all"
              className={`flex-1 min-w-[80px] py-3 rounded-xl text-sm font-bold text-center transition-all ${activeTab === 'all' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              Барлығы
            </Link>
            <Link
              href="/restaurants?tab=cafes"
              className={`flex-1 min-w-[80px] py-3 rounded-xl text-sm font-bold text-center transition-all ${activeTab === 'cafes' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              Кафе
            </Link>
            <Link
              href="/restaurants?tab=food"
              className={`flex-1 min-w-[80px] py-3 rounded-xl text-sm font-bold text-center transition-all ${activeTab === 'food' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              Тамақ
            </Link>
          </div>

          {/* All tab */}
          {activeTab === 'all' && (
            <div className="space-y-10">
              {restaurants && restaurants.length > 0 && (
                <RestaurantSection restaurants={restaurants} />
              )}
              {menuItems && menuItems.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-2xl font-black italic tracking-tight">Танымал тағамдар</h2>
                    <Link href="/restaurants?tab=food" className="text-xs font-black text-primary hover:underline px-3 py-1 bg-primary/10 rounded-full">КӨБІРЕК</Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {menuItems.slice(0, 12).map((item: any) => (
                      <MenuItemCard
                        key={item.id}
                        layout="horizontal"
                        item={{
                          ...item,
                          restaurant: item.restaurants
                            ? { id: item.restaurants.id, name_ru: item.restaurants.name_ru, name_en: item.restaurants.name_en }
                            : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Кафе tab */}
          {activeTab === 'cafes' && (
            restaurants && restaurants.length > 0 ? (
              <RestaurantSection restaurants={restaurants} />
            ) : (
              <div className="text-center py-16 bg-background rounded-[2rem] border-2 border-dashed border-muted">
                <div className="text-muted-foreground/20 mb-3">
                  <Store className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-muted-foreground font-medium italic">Кафелер табылмады</p>
              </div>
            )
          )}

          {/* Тамақ tab */}
          {activeTab === 'food' && (
            menuItems && menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map((item: any) => (
                  <MenuItemCard
                    key={item.id}
                    layout="horizontal"
                    item={{
                      ...item,
                      restaurant: item.restaurants
                        ? { id: item.restaurants.id, name_ru: item.restaurants.name_ru, name_en: item.restaurants.name_en }
                        : undefined,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-background rounded-[2rem] border-2 border-dashed border-muted">
                <div className="text-muted-foreground/20 mb-3">
                  <Utensils className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-muted-foreground font-medium italic">Тамақтар табылмады</p>
              </div>
            )
          )}
        </div>
      </main>

    </div>
  )
}
