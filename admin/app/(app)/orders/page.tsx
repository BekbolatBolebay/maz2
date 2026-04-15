import { getOrders, getReservations, getCafeSettings } from '@/lib/db'
import OrdersClient from './orders-client'

// Бетті кэшке жазбаймыз: әрбір кірген сайын жаңа деректер алынады
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdersPage() {
  const [orders, reservations, settings] = await Promise.all([
    getOrders('all', 100),
    getReservations(),
    getCafeSettings()
  ])

  return <OrdersClient
    initialOrders={orders}
    initialReservations={reservations}
    restaurant={settings}
  />
}
