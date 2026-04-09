'use client'

import { useEffect, useState } from 'react'
import { Search, Eye, CheckCircle, Clock, Truck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'

const statusMap: any = {
    new: { label: 'New', icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
    accepted: { label: 'Accepted', icon: CheckCircle, color: 'text-blue-500 bg-blue-500/10' },
    preparing: { label: 'Preparing', icon: Utensils, color: 'text-indigo-500 bg-indigo-500/10' },
    on_the_way: { label: 'On the Way', icon: Truck, color: 'text-purple-500 bg-purple-500/10' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
}

function Utensils(props: any) {
    return <path {...props} d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v4M5 2v4M9 2v4M15 2v8a2 2 0 0 0 2 2h3M15 15v5a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-5" />
}

export default function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/orders')
            const data = await res.json()
            if (data.authorized) {
                setOrders(data.orders || [])
            }
        } catch (err) {
            toast.error('Failed to load orders')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: newStatus })
            })
            const data = await res.json()
            if (data.authorized) {
                toast.success(`Order status updated to ${newStatus}`)
                fetchOrders()
            }
        } catch (err) {
            toast.error('Failed to update status')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search orders by name or ID..." className="pl-9" />
                </div>
            </div>

            <div className="border rounded-lg bg-background overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b font-medium text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3">Order #</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Total</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                    Loading orders...
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                    No orders found.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => {
                                const status = statusMap[order.status] || statusMap.new
                                return (
                                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs">
                                            #{order.order_number || order.id.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold">{order.customer_name}</div>
                                            <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold">
                                            {order.total_amount.toLocaleString()}₸
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={`${status.color} border-none font-medium flex items-center gap-1.5 w-fit`}>
                                                <status.icon className="h-3 w-3" />
                                                {status.label}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs">
                                            {format(new Date(order.created_at), 'MMM d, HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {/* Status Update Quick Actions */}
                                                {order.status === 'new' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-emerald-500 hover:bg-emerald-50"
                                                        onClick={() => handleUpdateStatus(order.id, 'accepted')}
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
