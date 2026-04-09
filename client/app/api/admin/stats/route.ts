import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET dashboard statistics
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const supabase = await createClient()

    // Get total orders count
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    // Get active orders count
    const { count: activeOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'preparing', 'on_the_way'])

    // Get total revenue
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'delivered')

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

    // Get total clients
    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    // Get total staff
    const { count: totalStaff } = await supabase
      .from('staff_profiles')
      .select('*', { count: 'exact', head: true })

    // Get total restaurants
    const { count: totalRestaurants } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })

    // Get today's orders
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: todayOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        *,
        clients(full_name),
        restaurants(name_en, name_ru)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get top restaurants by orders
    const { data: topRestaurants } = await supabase
      .from('orders')
      .select('cafe_id, restaurants(name_en, name_ru)')
      .eq('status', 'delivered')

    const restaurantCounts = topRestaurants?.reduce((acc: any, order) => {
      const id = order.cafe_id
      acc[id] = (acc[id] || 0) + 1
      return acc
    }, {})

    const stats = {
      totalOrders: totalOrders || 0,
      activeOrders: activeOrders || 0,
      totalRevenue: totalRevenue,
      totalClients: totalClients || 0,
      totalStaff: totalStaff || 0,
      totalRestaurants: totalRestaurants || 0,
      todayOrders: todayOrders || 0,
      recentOrders: recentOrders || [],
      restaurantCounts: restaurantCounts || {},
    }

    return createAdminResponse({ stats })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}
