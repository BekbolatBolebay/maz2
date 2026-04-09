'use client'

import { useEffect, useState } from 'react'
import { Store, MapPin, Phone, Globe, Palette, Clock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export default function AdminSettings() {
    const [settings, setSettings] = useState<any>(null)
    const [workingHours, setWorkingHours] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/settings')
            const data = await res.json()
            if (data.authorized) {
                setSettings(data.settings)
                setWorkingHours(data.workingHours || [])
            }
        } catch (err) {
            toast.error('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            const data = await res.json()
            if (data.authorized) {
                toast.success('Settings updated successfully')
            }
        } catch (err) {
            toast.error('Failed to update settings')
        }
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>

    return (
        <div className="max-w-4xl space-y-8">
            <form onSubmit={handleUpdateSettings} className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Cafe Settings</h2>
                    <Button type="submit" className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Store className="h-5 w-5 text-primary" />
                                General Information
                            </CardTitle>
                            <CardDescription>Basic details about your cafe.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Cafe Name</Label>
                                <Input
                                    value={settings?.name || ''}
                                    onChange={e => setSettings({ ...settings, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={settings?.description || ''}
                                    onChange={e => setSettings({ ...settings, description: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div className="space-y-0.5">
                                    <Label>Online Status</Label>
                                    <p className="text-xs text-muted-foreground">Enable to accept orders online.</p>
                                </div>
                                <Switch
                                    checked={settings?.is_open}
                                    onCheckedChange={checked => setSettings({ ...settings, is_open: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                Contact Details
                            </CardTitle>
                            <CardDescription>How customers can reach you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input
                                    value={settings?.address || ''}
                                    onChange={e => setSettings({ ...settings, address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input
                                    value={settings?.phone || ''}
                                    onChange={e => setSettings({ ...settings, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Globe className="h-3 w-3" /> Language
                                    </Label>
                                    <select
                                        className="w-full p-2 rounded-md border text-sm"
                                        value={settings?.language || 'kk'}
                                        onChange={e => setSettings({ ...settings, language: e.target.value })}
                                    >
                                        <option value="kk">Kazakh (Қазақша)</option>
                                        <option value="ru">Russian (Русский)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Palette className="h-3 w-3" /> Theme
                                    </Label>
                                    <select
                                        className="w-full p-2 rounded-md border text-sm"
                                        value={settings?.theme || 'light'}
                                        onChange={e => setSettings({ ...settings, theme: e.target.value })}
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Working Hours
                        </CardTitle>
                        <CardDescription>Set your weekly operation schedule.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                                const hours = workingHours.find(h => h.day_of_week === idx) || { open_time: '08:00', close_time: '22:00', is_day_off: false }
                                return (
                                    <div key={day} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                                        <span className="w-12 font-medium">{day}</span>
                                        <div className="flex items-center gap-4">
                                            <Input type="time" defaultValue={hours.open_time} className="w-32" />
                                            <span>-</span>
                                            <Input type="time" defaultValue={hours.close_time} className="w-32" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs">Day Off</Label>
                                            <Switch defaultChecked={hours.is_day_off} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
