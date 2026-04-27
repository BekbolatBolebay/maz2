export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { SearchBar } from '@/components/home/search-bar'
import { PromotionBanner } from '@/components/home/promotion-banner'
import { CategoryGrid } from '@/components/home/category-grid'
import { RestaurantSection } from '@/components/home/restaurant-section'
import { FoodSection } from '@/components/home/food-section'
import { GiftBanner } from '@/components/home/gift-banner'
import { createClient } from '@/lib/supabase/server'
import { getGlobalCategories } from '@/lib/supabase/categories'
import { fetchRestaurantsWithRatings } from '@/lib/restaurant-utils-rating'

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: promotions },
    restaurants,
    { data: popularItems },
    categories
  ] = await Promise.all([
    supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(3),
    fetchRestaurantsWithRatings({ isOpen: true, limit: 50 }),
    supabase
      .from('menu_items')
      .select('*, restaurants(*)')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(10),
    getGlobalCategories()
  ])

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <Header />

      <main className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto px-5 py-6 space-y-6">
          <SearchBar />

          {promotions && promotions.length > 0 && (
            <PromotionBanner promotions={promotions} />
          )}

          <CategoryGrid initialCategories={categories} />

          <GiftBanner />

          {restaurants && restaurants.length > 0 && (
            <RestaurantSection restaurants={restaurants} />
          )}

          {popularItems && popularItems.length > 0 && (
            <FoodSection title="Popular Items" items={popularItems} />
          )}
        </div>
      </main>
    </div>
  )
}
