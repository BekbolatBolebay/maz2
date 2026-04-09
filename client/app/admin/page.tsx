'use client'

import { useEffect, useState } from 'react'
import {
    TrendingUp,
    ShoppingBag,
    Utensils,
    Users,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats')
                const data = await res.json()
                if (data.authorized) {
                    setStats(data.stats)
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const statCards = [
        {
            title: 'Total Revenue',
            value: stats?.revenue ? `${stats.revenue.toLocaleString()}₸` : '0₸',
            icon: TrendingUp,
            trend: '+12%',
            trendUp: true
        },
        {
            title: 'Total Orders',
            value: stats?.ordersCount ?? 0,
            icon: ShoppingBag,
            trend: '+5%',
            trendUp: true
        },
        {
            title: 'Active Restaurants',
            value: stats?.restaurantsCount ?? 0,
            icon: Utensils,
            trend: '0%',
            trendUp: true
        },
        {
            title: 'Total Users',
            value: stats?.usersCount ?? 0,
            icon: Users,
            trend: '+18%',
            trendUp: true
        },
    ]

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? '...' : stat.value}</div>
                            <p className="text-xs flex items-center mt-1">
                                {stat.trendUp ? (
                                    <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                                )}
                                <span className={stat.trendUp ? "text-emerald-500" : "text-red-500"}>
                                    {stat.trend}
                                </span>
                                <span className="text-muted-foreground ml-1">since last month</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* placeholder for recent orders list */}
                            <div className="text-center py-8 text-muted-foreground italic text-sm">
                                No recent orders found today.
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Top Restaurants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* placeholder for top restaurants */}
                            <div className="text-center py-8 text-muted-foreground italic text-sm">
                                Statistical data gathering in progress...
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
