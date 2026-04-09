import { getCafeSettings, getOrdersStats, getOrders } from '@/lib/db'
import DashboardClient from './dashboard-client'

export default async function HomePage() {
  const [settings, stats, recentOrders] = await Promise.all([
    getCafeSettings(),
    getOrdersStats(),
    getOrders(),
  ])

  const recent = recentOrders.slice(0, 5)

  return (
    <DashboardClient
      settings={settings}
      stats={stats}
      recentOrders={recent}
    />
  )
}
