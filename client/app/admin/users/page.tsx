'use client'

import { useEffect, useState } from 'react'
import { Search, UserCog, Shield, Trash2, Mail, Download, Upload, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [importing, setImporting] = useState(false)
    const [isImportOpen, setIsImportOpen] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/users')
            const data = await res.json()
            if (data.authorized) {
                setUsers(data.users || [])
            }
        } catch (err) {
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, role: newRole })
            })
            const data = await res.json()
            if (data.authorized) {
                toast.success(`User role updated to ${newRole}`)
                fetchUsers()
            }
        } catch (err) {
            toast.error('Failed to update role')
        }
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImporting(true)
        try {
            const reader = new FileReader()
            reader.onload = async (event) => {
                try {
                    const content = event.target?.result as string
                    const clients = JSON.parse(content)

                    const res = await fetch('/api/admin/users/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clients })
                    })

                    const data = await res.json()
                    if (data.success) {
                        toast.success(`Successfully imported ${data.count} clients`)
                        setIsImportOpen(false)
                        fetchUsers()
                    } else {
                        toast.error(data.error || 'Failed to import clients')
                    }
                } catch (err) {
                    toast.error('Invalid JSON file format')
                } finally {
                    setImporting(false)
                }
            }
            reader.readAsText(file)
        } catch (err) {
            toast.error('Failed to read file')
            setImporting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search clients by name, email or phone..." className="pl-9" />
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Import Clients
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Import Clients from Version 1</DialogTitle>
                                <DialogDescription>
                                    Upload a JSON file containing client data. The file should be an array of objects with email, name, and phone fields.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Select JSON File</label>
                                    <Input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        disabled={importing}
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                                    <p className="font-semibold mb-1">Example format:</p>
                                    <pre className="overflow-x-auto">
                                        {`[
  {
    "email": "client@example.com",
    "full_name": "John Doe",
    "phone": "+77012345678"
  }
]`}
                                    </pre>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsImportOpen(false)}>Cancel</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Client
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg bg-background overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b font-medium text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3">Client</th>
                            <th className="px-6 py-3">Contact</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Joined Date</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                    Loading users...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                    No users found in the system.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{user.full_name || 'Guest'}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {user.phone || 'No phone'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? "bg-primary/10 text-primary border-none" : ""}>
                                            {user.role === 'admin' ? 'Administrator' : 'Customer'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex items-center gap-2"
                                                onClick={() => handleUpdateRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                            >
                                                <Shield className="h-4 w-4" />
                                                Set as {user.role === 'admin' ? 'User' : 'Admin'}
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
