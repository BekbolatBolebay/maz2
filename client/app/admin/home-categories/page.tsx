'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, LayoutGrid, Eye, EyeOff, Save, GripVertical } from 'lucide-react'

interface Category {
    id: string
    name_kk: string
    name_ru: string
    home_visible: boolean
    home_sort_order: number
}

export default function HomeCategoriesPage() {
    const { profile, loading: authLoading } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (profile?.role === 'super_admin') {
            fetchCategories()

            // Real-time subscription
            const channel = supabase
                .channel('category-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
                    fetchCategories()
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [profile])

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('home_sort_order', { ascending: true })

        if (error) {
            toast.error('Категорияларды алу қатесі')
        } else {
            setCategories(data || [])
        }
        setLoading(false)
    }

    const toggleVisibility = async (id: string, current: boolean) => {
        setSaving(id)
        const { error } = await supabase
            .from('categories')
            .update({ home_visible: !current })
            .eq('id', id)

        if (error) {
            toast.error('Жарнамалау статусын өзгерту қатесі')
        } else {
            toast.success('Статус жаңартылды')
        }
        setSaving(null)
    }

    const updateSortOrder = async (id: string, newOrder: number) => {
        setSaving(id)
        const { error } = await supabase
            .from('categories')
            .update({ home_sort_order: newOrder })
            .eq('id', id)

        if (error) {
            toast.error('Реттілікті өзгерту қатесі')
        }
        setSaving(null)
    }

    if (authLoading || loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (profile?.role !== 'super_admin') {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <div className="text-6xl">🚫</div>
                <h1 className="text-2xl font-bold">Рұқсат жоқ</h1>
                <p className="text-muted-foreground">Бұл бет тек Супер Админдерге арналған.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tight">Басты бет категориялары</h1>
                    <p className="text-muted-foreground">Басты бетте көрсетілетін категорияларды басқару</p>
                </div>
            </div>

            <div className="grid gap-4">
                {categories.map((cat) => (
                    <Card key={cat.id} className="overflow-hidden border-2 hover:border-primary/20 transition-all group">
                        <CardContent className="p-0">
                            <div className="flex items-center gap-4 p-4">
                                <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                                    <LayoutGrid className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">{cat.name_kk}</h3>
                                        <span className="text-xs text-muted-foreground">/ {cat.name_ru}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            {cat.home_visible ? (
                                                <span className="flex items-center gap-1 text-green-600"><Eye className="w-3 h-3" /> Көрінеді</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-destructive"><EyeOff className="w-3 h-3" /> Жасырылған</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 pr-2">
                                    <div className="flex flex-col gap-1 items-end">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Реттілігі</span>
                                        <Input
                                            type="number"
                                            defaultValue={cat.home_sort_order}
                                            onBlur={(e) => updateSortOrder(cat.id, parseInt(e.target.value))}
                                            className="w-20 h-10 text-center font-bold rounded-xl bg-muted/50 border-none hover:bg-muted"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1 items-center">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Көрсету</span>
                                        <Switch
                                            checked={cat.home_visible}
                                            onCheckedChange={() => toggleVisibility(cat.id, cat.home_visible)}
                                            disabled={saving === cat.id}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                    <p className="text-muted-foreground italic">Категориялар табылмады</p>
                </div>
            )}
        </div>
    )
}
