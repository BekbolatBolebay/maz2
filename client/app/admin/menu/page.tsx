'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function AdminMenu() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMenuItems()
    }, [])

    async function fetchMenuItems() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/menu-items')
            const data = await res.json()
            if (data.authorized) {
                setItems(data.menuItems || [])
            }
        } catch (err) {
            toast.error('Failed to load menu items')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search dishes..." className="pl-9" />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
                <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Dish
                </Button>
            </div>

            <div className="border rounded-lg bg-background overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b font-medium text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3">Dish Name</th>
                            <th className="px-6 py-3">Restaurant</th>
                            <th className="px-6 py-3">Price</th>
                            <th className="px-6 py-3">Stock Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    Loading menu items...
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    No menu items found. Get started by adding one!
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                                                {item.image_url && (
                                                    <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{item.name_kk || item.name_ru}</div>
                                                <div className="text-xs text-muted-foreground">{item.name_ru}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {item.restaurants?.name_ru || item.restaurants?.name_en || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        {item.price.toLocaleString()}₸
                                    </td>
                                    <td className="px-6 py-4">
                                        <Button
                                            variant="ghost"
                                            className={item.is_available && !item.is_stop_list ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"}
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch('/api/admin/menu-items', {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ id: item.id, is_stop_list: !item.is_stop_list })
                                                    })
                                                    const data = await res.json()
                                                    if (data.authorized) {
                                                        toast.success(item.is_stop_list ? 'Item removed from stop-list' : 'Item added to stop-list')
                                                        fetchMenuItems()
                                                    }
                                                } catch (err) {
                                                    toast.error('Failed to update status')
                                                }
                                            }}
                                        >
                                            {item.is_stop_list ? 'Sold Out (Stop)' : 'Available'}
                                        </Button>
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
