'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Tag, Calendar, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function AdminPromotions() {
    const [promotions, setPromotions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPromotions()
    }, [])

    async function fetchPromotions() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/promotions')
            const data = await res.json()
            if (data.authorized) {
                setPromotions(data.promotions || [])
            }
        } catch (err) {
            toast.error('Failed to load promotions')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Marketing & Promotions</h2>
                <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Campaign
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        Loading campaigns...
                    </div>
                ) : promotions.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
                        No active promotion banners found.
                    </div>
                ) : (
                    promotions.map((promo) => (
                        <Card key={promo.id} className="overflow-hidden group">
                            <div className="relative h-40 bg-muted">
                                {promo.image_url ? (
                                    <img src={promo.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <ImageIcon className="h-10 w-10 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <Badge variant={promo.is_active ? 'default' : 'secondary'} className={promo.is_active ? "bg-emerald-500 border-none" : ""}>
                                        {promo.is_active ? 'Active' : 'Draft'}
                                    </Badge>
                                </div>
                            </div>
                            <CardContent className="p-4 space-y-3">
                                <div>
                                    <h3 className="font-bold text-lg line-clamp-1">{promo.title_ru || promo.title_en}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                        {promo.description_ru || promo.description_en}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>Expires: Never</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Global Settings Section */}
            <div className="mt-12 space-y-4">
                <h2 className="text-xl font-bold">Platform Settings</h2>
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Global Delivery Fee</label>
                                <Input defaultValue="500" type="number" />
                                <p className="text-[10px] text-muted-foreground">Default delivery price for all restaurants.</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Default Commission (%)</label>
                                <Input defaultValue="15" type="number" />
                                <p className="text-[10px] text-muted-foreground">Platform cut from each successful order.</p>
                            </div>
                            <div className="flex items-end">
                                <Button variant="outline" className="w-full">Save Changes</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
