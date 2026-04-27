import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { createAdminClient } from './supabase/admin'
import type { Lang } from '@/lib/i18n'

export type UserProfile = {
  id: string
  email: string
  full_name: string
  phone: string
  avatar_url?: string
}

export type CafeSettings = Restaurant // for backward compatibility if needed

export type Restaurant = {
  id: string
  owner_id: string
  name_kk: string
  name_ru: string
  name_en: string
  description_kk: string
  description_ru: string
  description_en: string
  image_url: string
  banner_url: string
  address: string
  phone: string
  rating: number
  delivery_time_min: number
  delivery_time_max: number
  delivery_fee: number
  minimum_order: number
  is_open: boolean
  status: 'open' | 'closed' | 'paused'
  opening_hours: any
  cuisine_types: string[]
  total_seats?: number
  kaspi_link?: string
  freedom_merchant_id?: string
  accept_cash: boolean
  accept_kaspi: boolean
  accept_freedom: boolean
  booking_accept_cash: boolean
  booking_accept_kaspi: boolean
  booking_accept_freedom: boolean
  is_delivery_enabled: boolean
  is_pickup_enabled: boolean
  is_booking_enabled: boolean
  is_new: boolean
  latitude?: number | null
  longitude?: number | null
  telegram_bot_token?: string
  telegram_chat_id?: string
  base_delivery_fee?: number
  delivery_fee_per_km?: number
  delivery_surge_multiplier?: number
  delivery_extra_charge?: number
  courier_fee?: number
  booking_fee?: number
  freedom_payment_secret_key?: string
  freedom_receipt_secret_key?: string
  payment_type?: 'MANUAL' | 'AUTOMATED'
  expiry_date?: string
  plan?: string
  platform_status?: 'active' | 'warning' | 'expired' | 'blocked'
  auto_reject_when_closed?: boolean
  created_at: string
  updated_at: string
  freedom_test_mode?: boolean
  cashback_percentage?: number
  happy_hour_start?: string | null
  happy_hour_end?: string | null
  happy_hour_discount_percent?: number
  happy_hour_days?: number[]
}

export type RestaurantTable = {
  id: string
  cafe_id: string
  table_number: string
  capacity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type WorkingHour = {
  id: string
  cafe_id: string
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_day_off: boolean
  created_at: string
  updated_at?: string
}

export type Category = {
  id: string
  cafe_id: string
  name_kk: string
  name_ru: string
  name_en: string
  icon_url: string
  sort_order: number
  is_active: boolean
  is_combo?: boolean
  created_at: string
}

export type MenuItem = {
  id: string
  cafe_id: string
  category_id: string | null
  name_kk: string
  name_ru: string
  name_en: string
  description_kk: string
  description_ru: string
  description_en: string
  image_url: string
  price: number
  original_price: number | null
  is_available: boolean
  is_popular: boolean
  is_stop_list: boolean
  preparation_time: number
  sort_order: number
  combo_items?: any[]
  type?: 'food' | 'rental' | 'service'
  rental_deposit?: number
  created_at: string
  updated_at: string
  categories?: Category
}

export type Order = {
  id: string
  order_number: number
  user_id: string | null
  cafe_id: string
  customer_name: string
  customer_phone: string
  customer_avatar: string
  type: 'delivery' | 'pickup'
  status: 'pending' | 'awaiting_payment' | 'accepted' | 'preparing' | 'ready' | 'on_the_way' | 'completed' | 'cancelled' | 'new' | 'delivered'
  total_amount: number
  items_count: number
  delivery_fee: number
  address: string
  delivery_address: string | null
  notes: string
  delivery_notes: string | null
  payment_method: string
  payment_status: 'pending' | 'paid'
  payment_url?: string
  courier_id?: string
  one_time_courier_name?: string
  one_time_courier_phone?: string
  courier_tracking_token?: string
  group_order_id?: string
  certificate_code?: string
  certificate_amount_spent?: number
  phone: string | null
  latitude?: number
  longitude?: number
  estimated_delivery_time: string | null
  estimated_ready_at: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  restaurants?: Restaurant
  clients?: { full_name: string }
  reviews?: { rating: number, comment: string }[]
  booking_fee?: number
}

export type OrderItem = {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
  menu_items?: MenuItem
}

export type ReservationItem = {
  id: string
  reservation_id: string
  menu_item_id: string
  name_kk: string
  name_ru: string
  price: number
  quantity: number
}

export type Reservation = {
  id: string
  cafe_id: string
  customer_name: string
  customer_phone: string
  date: string
  time: string
  guests_count: number
  notes: string | null
  status: 'pending' | 'awaiting_payment' | 'confirmed' | 'cancelled' | 'completed'
  total_amount: number
  booking_fee?: number
  created_at: string
  table_id?: string
  payment_method?: 'cash' | 'kaspi' | 'freedom'
  payment_status?: 'pending' | 'paid'
  payment_url?: string
  customer_id?: string
  reservation_items?: ReservationItem[]
  restaurants?: Restaurant
}

export type Promotion = {
  id: string
  cafe_id: string
  title_kk: string
  title_ru: string
  title_en: string
  description_kk: string
  description_ru: string
  description_en: string
  image_url: string
  discount_percentage: number | null
  discount_amount: number | null
  promo_code: string
  code: string | null
  min_order_amount: number
  max_uses: number | null
  uses_count: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Banner = {
  id: string
  cafe_id: string
  title_kk: string
  title_ru: string
  image_url: string
  link_url: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export type Review = {
  id: string
  cafe_id: string
  customer_name: string
  customer_avatar: string
  rating: number
  comment: string
  reply: string
  replied_at: string | null
  order_id: string | null
  created_at: string
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

export const getCurrentRestaurantId = cache(async (): Promise<string | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all restaurants for this owner to find the "active" one
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name_ru, name_kk, address, telegram_bot_token, whatsapp_number, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true }) // Oldest first (original record)

  if (error) {
    console.error('[getCurrentRestaurantId] Error fetching restaurants:', error)
  }

  if (restaurants && restaurants.length > 0) {
    // 1. Try to find the "best" record (has data or settings)
    const activeOne = restaurants.find(r => 
      (r.address && r.address.length > 2) || 
      (r.name_ru && !['Жаңа мейрамхана', 'Новое заведение', 'New Restaurant'].includes(r.name_ru)) ||
      (r.name_kk && !['Жаңа мейрамхана', 'Новое заведение', 'New Restaurant'].includes(r.name_kk)) ||
      (r.telegram_bot_token)
    )
    
    if (activeOne) {
      console.log(`[getCurrentRestaurantId] Found active record: ${activeOne.id} (${activeOne.name_ru || 'No Name'})`)
      return activeOne.id
    }
    
    // 2. Fallback to the oldest one (the first one ever created for this user)
    console.log(`[getCurrentRestaurantId] Falling back to oldest record: ${restaurants[0].id}`)
    return restaurants[0].id
  }

  // ONLY create a new record if NO restaurant exists for this owner
  console.log(`[getCurrentRestaurantId] No restaurant found, creating new one for user: ${user.id}`)
  const { data: newRestaurant, error: createError } = await supabase
    .from('restaurants')
    .insert({ 
      owner_id: user.id,
      name_kk: 'Жаңа мейрамхана',
      name_ru: 'Новое заведение',
      name_en: 'New Restaurant',
      status: 'open',
      is_open: true,
      city: 'Алматы'
    })
    .select('id')
    .single()

  if (createError) {
    console.error('[getCurrentRestaurantId] Error creating restaurant:', createError)
  }

  return newRestaurant?.id || null
})

export async function getTables(restaurantId?: string): Promise<RestaurantTable[]> {
  const id = restaurantId || await getCurrentRestaurantId()
  if (!id) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('restaurant_tables')
    .select('*')
    .eq('cafe_id', id)
    .eq('is_active', true)
    .order('table_number', { ascending: true })

  return data || []
}

export async function getCafeSettings(restaurantId?: string): Promise<Restaurant | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Ensure a restaurant record exists
  const id = restaurantId || await getCurrentRestaurantId()
  if (!id) return null

  const { data } = await supabase
    .from('restaurants')
    .select(`
      id, 
      name_kk, 
      name_ru, 
      name_en, 
      description_kk, 
      description_ru, 
      description_en, 
      image_url, 
      banner_url, 
      address, 
      phone, 
      rating, 
      delivery_time_min, 
      delivery_time_max, 
      delivery_fee, 
      minimum_order, 
      is_open, 
      status, 
      opening_hours, 
      cuisine_types, 
      accept_cash, 
      accept_kaspi, 
      accept_freedom, 
      is_delivery_enabled, 
      is_pickup_enabled, 
      is_booking_enabled, 
      base_delivery_fee, 
      delivery_fee_per_km, 
      courier_fee,
      booking_fee,
      delivery_surge_multiplier,
      delivery_extra_charge,
      whatsapp_number,
      latitude, 
      longitude,
      owner_id,
      booking_accept_cash,
      booking_accept_kaspi,
      booking_accept_freedom
    `)
    .eq('id', id)
    .single()
  return data as Restaurant | null
}

export async function getWorkingHours(restaurantId?: string): Promise<WorkingHour[]> {
  const id = restaurantId || await getCurrentRestaurantId()
  if (!id) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('working_hours')
    .select('*')
    .eq('cafe_id', id)
    .order('day_of_week')
  return data || []
}

export async function getMenuCategories(restaurantId?: string): Promise<Category[]> {
  const id = restaurantId || await getCurrentRestaurantId()
  if (!id) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('cafe_id', id)
    .order('sort_order')
  return data || []
}

export async function getMenuItems(restaurantId?: string): Promise<MenuItem[]> {
  const id = restaurantId || await getCurrentRestaurantId()
  if (!id) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('menu_items')
    .select('*, categories(id, name_kk, name_ru)')
    .eq('cafe_id', id)
    .order('sort_order')
  return data || []
}

export async function getOrders(status?: string, limit?: number): Promise<Order[]> {
  const restaurantId = await getCurrentRestaurantId()
  if (!restaurantId) return []

  const supabase = createAdminClient()
  let q = supabase
    .from('orders')
    .select('*, restaurants!cafe_id(*), order_items(*, menu_items(*)), clients!user_id(full_name), reviews(*)')
    .eq('cafe_id', restaurantId)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') q = q.eq('status', status)
  if (limit) q = q.limit(limit)
  const { data } = await q
  return data || []
}

export async function getOrdersStats() {
  const restaurantId = await getCurrentRestaurantId()
  if (!restaurantId) return { todayRevenue: 0, todayOrders: 0, newOrders: 0 }

  const supabase = createAdminClient()
  
  // Calculate "Today" in Almaty
  const now = new Date()
  const almatyDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Almaty',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now)
  const today = new Date(`${almatyDate}T00:00:00+05:00`)
  const { data } = await supabase
    .from('orders')
    .select('total_amount, status, created_at')
    .eq('cafe_id', restaurantId)
    .gte('created_at', today.toISOString())

  const orders = data || []
  const todayRevenue = orders
    .filter((o) => o.status === 'delivered' || o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total_amount), 0)
  return {
    todayRevenue,
    todayOrders: orders.length,
    newOrders: orders.filter((o) => o.status === 'new' || o.status === 'pending').length,
  }
}

export async function getPromoCodes(): Promise<Promotion[]> {
  const restaurantId = await getCurrentRestaurantId()
  if (!restaurantId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('promotions')
    .select('*')
    .eq('cafe_id', restaurantId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getBanners(): Promise<Banner[]> {
  const restaurantId = await getCurrentRestaurantId()
  if (!restaurantId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('cafe_id', restaurantId)
    .order('sort_order')
  return data || []
}

export async function getReviews(): Promise<Review[]> {
  const restaurantId = await getCurrentRestaurantId()
  if (!restaurantId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('cafe_id', restaurantId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getAnalytics(period: 'daily' | 'weekly' | 'monthly') {
  const restaurantId = await getCurrentRestaurantId()
  if (!restaurantId) return []

  const supabase = await createClient()
  
  // Base date in Almaty
  const now = new Date()
  const almatyDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Almaty',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now)
  const today = new Date(`${almatyDate}T00:00:00+05:00`)
  
  let from: Date

  if (period === 'daily') {
    from = new Date(today)
    from.setDate(from.getDate() - 7)
  } else if (period === 'weekly') {
    from = new Date(today)
    from.setDate(from.getDate() - 28)
  } else {
    from = new Date(today)
    from.setMonth(from.getMonth() - 6)
  }

  const { data } = await supabase
    .from('orders')
    .select('total_amount, status, created_at, items_count')
    .eq('cafe_id', restaurantId)
    .gte('created_at', from.toISOString())
    .order('created_at')

  return data || []
}

export async function getReservations(): Promise<Reservation[]> {
  const restaurantId = await getCurrentRestaurantId()
  if (!restaurantId) return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('reservations')
    .select('*, restaurants!cafe_id(*), reservation_items(*)')
    .eq('cafe_id', restaurantId)
    .order('date', { ascending: false })
    .order('time', { ascending: false })

  return (data || []) as Reservation[]
}
