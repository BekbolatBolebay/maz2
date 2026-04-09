'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, LayoutGrid, Check, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminCategories() {
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<any>(null)
    const [formData, setFormData] = useState({
        name_kk: '',
        name_ru: '',
        sort_order: 0,
        is_active: true
    })

    useEffect(() => {
        fetchCategories()
    }, [])

    async function fetchCategories() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/categories')
            const data = await res.json()
            if (data.categories) {
                setCategories(data.categories || [])
            }
        } catch (err) {
            toast.error('Failed to load categories')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (category: any = null) => {
        if (category) {
            setEditingCategory(category)
            setFormData({
                name_kk: category.name_kk,
                name_ru: category.name_ru,
                sort_order: category.sort_order,
                is_active: category.is_active
            })
        } else {
            setEditingCategory(null)
            setFormData({
                name_kk: '',
                name_ru: '',
                sort_order: categories.length + 1,
                is_active: true
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = '/api/admin/categories'
            const method = editingCategory ? 'PUT' : 'POST'
            const body = editingCategory
                ? { id: editingCategory.id, ...formData }
                : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const data = await res.json()
            if (data.category || data.message === 'Category deleted successfully') {
                toast.success(editingCategory ? 'Category updated' : 'Category created')
                setIsDialogOpen(false)
                fetchCategories()
            } else {
                toast.error(data.error || 'Something went wrong')
            }
        } catch (err) {
            toast.error('Operation failed')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return

        try {
            const res = await fetch(`/api/admin/categories?id=${id}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (data.message) {
                toast.success('Category deleted')
                fetchCategories()
            }
        } catch (err) {
            toast.error('Delete failed')
        }
    }

    const filteredCategories = categories.filter(cat =>
        cat.name_kk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.name_ru.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button className="flex items-center gap-2" onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4" />
                    Add Category
                </Button>
            </div>

            <div className="border rounded-lg bg-background overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b font-medium text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3">Order</th>
                            <th className="px-6 py-3">Translations</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                    Loading categories...
                                </td>
                            </tr>
                        ) : filteredCategories.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                    No categories found.
                                </td>
                            </tr>
                        ) : (
                            filteredCategories.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className="font-mono">
                                            #{item.sort_order}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                <LayoutGrid className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">{item.name_kk}</div>
                                                <div className="text-xs text-muted-foreground">{item.name_ru}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={item.is_active ? 'default' : 'secondary'} className={item.is_active ? "bg-emerald-500/10 text-emerald-500 border-none hover:bg-emerald-500/20" : ""}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => handleOpenDialog(item)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(item.id)}
                                            >
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                        <DialogDescription>
                            Configure the global category shown on the home page.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Name (KZ)</label>
                            <Input
                                required
                                value={formData.name_kk}
                                onChange={(e) => setFormData({ ...formData, name_kk: e.target.value })}
                                placeholder="Мәселен: Таңғы ас"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Name (RU)</label>
                            <Input
                                required
                                value={formData.name_ru}
                                onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                                placeholder="Например: Завтраки"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Sort Order</label>
                                <Input
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex items-end pb-1">
                                <Button
                                    type="button"
                                    variant={formData.is_active ? 'default' : 'outline'}
                                    className="w-full flex items-center gap-2"
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                >
                                    {formData.is_active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    {formData.is_active ? 'Active' : 'Hidden'}
                                </Button>
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
