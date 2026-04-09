import { getOrders, getReservations, getCafeSettings } from '@/lib/db'
import OrdersClient from './orders-client'

export default async function OrdersPage() {
  const [orders, reservations, settings] = await Promise.all([
    getOrders(),
    getReservations(),
    getCafeSettings()
  ])

  return <OrdersClient
    initialOrders={orders}
    initialReservations={reservations}
    restaurant={settings}
  />
}
