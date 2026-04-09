'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, MoreVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function AdminRestaurants() {
    const [restaurants, setRestaurants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRestaurants()
    }, [])

    async function fetchRestaurants() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/restaurants')
            const data = await res.json()
            if (data.authorized) {
                setRestaurants(data.restaurants || [])
            }
        } catch (err) {
            toast.error('Failed to load restaurants')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search restaurants..." className="pl-9" />
                </div>
                <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Restaurant
                </Button>
            </div>

            <div className="border rounded-lg bg-background overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b font-medium text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3">Restaurant Name</th>
                            <th className="px-6 py-3">Address</th>
                            <th className="px-6 py-3">Rating</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    Loading restaurants...
                                </td>
                            </tr>
                        ) : restaurants.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    No restaurants found. Add your first one!
                                </td>
                            </tr>
                        ) : (
                            restaurants.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold">{item.name_ru || item.name_en}</div>
                                        <div className="text-xs text-muted-foreground">{item.name_en}</div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground line-clamp-1 max-w-[200px]">
                                        {item.address}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold">{item.rating.toFixed(1)}</span>
                                            <span className="text-xs text-muted-foreground">/ 5.0</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={item.is_open ? 'default' : 'secondary'} className={item.is_open ? "bg-emerald-500/10 text-emerald-500 border-none hover:bg-emerald-500/20" : ""}>
                                            {item.is_open ? 'Open' : 'Closed'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
