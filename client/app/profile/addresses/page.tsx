'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, Trash2, ChevronLeft, Home, Briefcase, Map as MapIcon, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getPII, updatePII } from '@/lib/vps'

interface Address {
    id: string
    type: 'home' | 'work' | 'other'
    address: string
    details?: string
}

export default function AddressesPage() {
    const router = useRouter()
    const { user, profile } = useAuth()
    const { t } = useI18n()
    
    const [addresses, setAddresses] = useState<Address[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newAddress, setNewAddress] = useState('')
    const [newDetails, setNewDetails] = useState('')
    const [newType, setNewType] = useState<'home' | 'work' | 'other'>('home')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const loadAddresses = async () => {
            if (!profile?.vps_id) {
                setLoading(false)
                return
            }
            try {
                const data = await getPII('profiles', profile.vps_id as string)
                if (data?.addresses) {
                    setAddresses(data.addresses)
                }
            } catch (err) {
                console.error('Error loading addresses:', err)
            } finally {
                setLoading(false)
            }
        }
        loadAddresses()
    }, [profile])

    const handleAddAddress = async () => {
        if (!newAddress || !profile?.vps_id) return
        setIsSaving(true)
        try {
            const updatedAddresses = [
                ...addresses,
                { id: Math.random().toString(36).substr(2, 9), type: newType, address: newAddress, details: newDetails }
            ]
            
            await updatePII('profiles', profile.vps_id as string, { addresses: updatedAddresses })
            setAddresses(updatedAddresses)
            setIsAddModalOpen(false)
            setNewAddress('')
            setNewDetails('')
            toast.success(t.common?.success || 'Мекенжай сақталды')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteAddress = async (id: string) => {
        if (!profile?.vps_id) return
        try {
            const updatedAddresses = addresses.filter(a => a.id !== id)
            await updatePII('profiles', profile.vps_id as string, { addresses: updatedAddresses })
            setAddresses(updatedAddresses)
            toast.success(t.common?.success || 'Мекенжай өшірілді')
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-black tracking-tight">{t.profile?.addresses || 'Мекенжайлар'}</h1>
            </div>

            <div className="p-6 space-y-6">
                {/* Visual Banner */}
                <div className="bg-primary rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black mb-2">Жеткізу орындары</h2>
                        <p className="text-white/60 text-sm font-medium">Тапсырысты тездету үшін мекенжайларыңызды сақтап қойыңыз</p>
                    </div>
                    <MapIcon className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10 rotate-12" />
                    <Sparkles className="absolute top-4 right-4 w-6 h-6 text-white/30 animate-pulse" />
                </div>

                <div className="space-y-4">
                    {addresses.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">Мекенжайлар әлі қосылмаған</p>
                        </div>
                    ) : (
                        addresses.map((addr) => (
                            <Card key={addr.id} className="border-none shadow-sm rounded-3xl overflow-hidden group">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        {addr.type === 'home' ? <Home className="w-5 h-5" /> : (addr.type === 'work' ? <Briefcase className="w-5 h-5" /> : <MapPin className="w-5 h-5" />)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white capitalize">{addr.type === 'home' ? 'Үй' : (addr.type === 'work' ? 'Жұмыс' : 'Басқа')}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-1">{addr.address}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteAddress(addr.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <Button className="w-full h-16 rounded-[2rem] bg-slate-900 text-white font-black text-lg gap-3 shadow-xl hover:bg-slate-800" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-6 h-6" />
                    Мекенжай қосу
                </Button>
            </div>

            {/* Add Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Жаңа мекенжай</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                            {(['home', 'work', 'other'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setNewType(type)}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${newType === type ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}
                                >
                                    {type === 'home' ? 'Үй' : (type === 'work' ? 'Жұмыс' : 'Басқа')}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Мекенжай</Label>
                            <Input
                                value={newAddress}
                                onChange={(e) => setNewAddress(e.target.value)}
                                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-6"
                                placeholder="Мекенжайды енгізіңіз..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Қосымша (Пәтер, этаж)</Label>
                            <Input
                                value={newDetails}
                                onChange={(e) => setNewDetails(e.target.value)}
                                className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-6"
                                placeholder="Мысалы: 12 пәтер, 3 қабат"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex !flex-col gap-3">
                        <Button className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90" onClick={handleAddAddress} disabled={isSaving}>
                            {isSaving ? 'Сақталуда...' : 'Дайын'}
                        </Button>
                        <Button variant="ghost" className="w-full h-12 rounded-2xl font-black text-slate-400" onClick={() => setIsAddModalOpen(false)}>
                            Жабу
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
