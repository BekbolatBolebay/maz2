/**
 * Utilities for fetching restaurants with aggregated review data
 * Calculates average rating and review count dynamically from reviews table
 */

import { createClient } from '@/lib/supabase/server'

export interface RestaurantWithRating {
  id: string
  name_ru?: string
  name_en?: string
  name_kk?: string
  rating: number
  review_count: number
  description_ru?: string
  description_en?: string
  description_kk?: string
  image_url?: string
  banner_url?: string
  is_open?: boolean
  delivery_time_min?: number
  delivery_time_max?: number
  delivery_fee?: number
  address?: string
  phone?: string
  latitude?: number
  longitude?: number
  cuisine_types?: string[]
  is_booking_enabled?: boolean
  happy_hour_start?: string | null
  happy_hour_end?: string | null
  happy_hour_discount_percent?: number
  happy_hour_days?: number[]
  [key: string]: any
}

/**
 * Fetch restaurants with calculated average ratings and review counts
 * Using SQL aggregation - much faster than calculating in application code
 */
export async function fetchRestaurantsWithRatings(options?: {
  isOpen?: boolean
  limit?: number
  city?: string
  search?: string
}): Promise<RestaurantWithRating[]> {
  const supabase = await createClient()

  // Build query with LEFT JOIN to reviews for aggregation
  let query = supabase
    .from('restaurants')
    .select(
      `
      id,
      name_ru,
      name_en,
      name_kk,
      description_ru,
      description_en,
      description_kk,
      image_url,
      banner_url,
      is_open,
      delivery_time_min,
      delivery_time_max,
      delivery_fee,
      address,
      phone,
      latitude,
      longitude,
      cuisine_types,
      is_booking_enabled,
      status,
      created_at,
      updated_at,
      owner_id,
      city,
      happy_hour_start,
      happy_hour_end,
      happy_hour_discount_percent,
      happy_hour_days,
      rating,
      reviews(rating)
      `
    )

  if (options?.isOpen !== undefined) {
    query = query.eq('is_open', options.isOpen)
  }

  if (options?.city) {
    query = query.eq('city', options.city)
  }

  if (options?.search) {
    query = query.or(
      `name_ru.ilike.%${options.search}%,name_en.ilike.%${options.search}%,name_kk.ilike.%${options.search}%`
    )
  }

  const { data: restaurants, error } = await query
    .order('is_open', { ascending: false })
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(options?.limit || 100)

  if (error) {
    console.error('[fetchRestaurantsWithRatings] Error:', error)
    throw error
  }

  // Transform data to calculate average rating and count
  const restaurantsWithRatings: RestaurantWithRating[] = (restaurants || []).map(
    (restaurant: any) => {
      const reviews = restaurant.reviews || []
      
      let avgRating = 0
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
        avgRating = Math.round((totalRating / reviews.length) * 10) / 10
      }

      return {
        ...restaurant,
        rating: avgRating,
        review_count: reviews.length,
        reviews: undefined // Remove nested reviews to keep data clean
      }
    }
  )

  return restaurantsWithRatings
}

/**
 * Fetch single restaurant with calculated rating
 */
export async function fetchRestaurantWithRating(
  restaurantId: string
): Promise<RestaurantWithRating | null> {
  const supabase = await createClient()

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select(
      `
      *,
      reviews(rating)
      `
    )
    .eq('id', restaurantId)
    .single()

  if (error) {
    console.error('[fetchRestaurantWithRating] Error:', error)
    return null
  }

  if (!restaurant) return null

  // Calculate average rating
  const reviews = restaurant.reviews || []
  let avgRating = 0
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
    avgRating = Math.round((totalRating / reviews.length) * 10) / 10
  }

  return {
    ...restaurant,
    rating: avgRating,
    review_count: reviews.length,
    reviews: undefined
  }
}

/**
 * Fetch restaurants by cuisine type with ratings
 */
export async function fetchRestaurantsByCuisine(
  cuisineType: string,
  limit: number = 20
): Promise<RestaurantWithRating[]> {
  const supabase = await createClient()

  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select(
      `
      id,
      name_ru,
      name_en,
      name_kk,
      image_url,
      banner_url,
      is_open,
      delivery_time_min,
      delivery_time_max,
      delivery_fee,
      cuisine_types,
      happy_hour_start,
      happy_hour_end,
      happy_hour_discount_percent,
      happy_hour_days,
      reviews(rating)
      `
    )
    .eq('is_open', true)
    .contains('cuisine_types', [cuisineType])
    .order('is_open', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[fetchRestaurantsByCuisine] Error:', error)
    throw error
  }

  return (restaurants || []).map((r: any) => {
    const reviews = r.reviews || []
    let avgRating = 0
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum: number, rev: any) => sum + (rev.rating || 0), 0)
      avgRating = Math.round((totalRating / reviews.length) * 10) / 10
    }

    return {
      ...r,
      rating: avgRating,
      review_count: reviews.length,
      reviews: undefined
    }
  })
}
