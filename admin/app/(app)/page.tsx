import { getCafeSettings, getOrdersStats, getOrders } from '@/lib/db'
import DashboardClient from './dashboard-client'

export default async function HomePage() {
  const [settings, stats, recentOrders] = await Promise.all([
    getCafeSettings(),
    getOrdersStats(),
    getOrders('all', 5),
  ])

  const recent = recentOrders

  return (
    <DashboardClient
      settings={settings}
      stats={stats}
      recentOrders={recent}
    />
  )
}
