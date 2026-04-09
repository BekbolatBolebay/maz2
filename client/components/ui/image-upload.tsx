'use client'

import { useState, useRef } from 'react'
import { Upload as UploadIcon, Loader2, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
    value: string
    onChange: (url: string) => void
    onUploadStart?: () => void
    onUploadEnd?: () => void
    label?: string
    aspectRatio?: 'square' | 'video' | 'banner'
    children?: React.ReactNode
}

export default function ImageUpload({ value, onChange, onUploadStart, onUploadEnd, label, aspectRatio = 'square', children }: Props) {
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Файл тым үлкен (max 5MB)')
            return
        }

        // Көрсетілім үшін жергілікті URL жасау
        const localUrl = URL.createObjectURL(file)
        onChange(localUrl)

        setLoading(true)
        onUploadStart?.()

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Upload failed')

            onChange(data.url)
            toast.success('Сәтті жүктелді')
        } catch (error: any) {
            console.error('Upload Error:', error)
            toast.error('Жүктеу кезінде қате кетті')
            // Қате болса жергілікті URL-ді алып тастау
            onChange(value)
        } finally {
            setLoading(false)
            onUploadEnd?.()
            URL.revokeObjectURL(localUrl)
        }
    }

    return (
        <div className="space-y-2">
            {label && <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block px-1">{label}</label>}

            {children ? (
                <div onClick={() => !loading && fileInputRef.current?.click()}>
                    {children}
                </div>
            ) : (
                <div
                    className={cn(
                        "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-all bg-secondary/30",
                        aspectRatio === 'square' && "aspect-square w-24",
                        aspectRatio === 'video' && "aspect-video w-full",
                        aspectRatio === 'banner' && "aspect-[21/9] w-full"
                    )}
                    onClick={() => !loading && fileInputRef.current?.click()}
                >
                    {value ? (
                        <>
                            <img src={value} alt="upload" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <UploadIcon className="w-6 h-6 text-white" />
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onChange('') }}
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadIcon className="w-6 h-6" />}
                            <span className="text-[10px] font-bold">{loading ? 'Жүктелуде...' : 'Жүктеу'}</span>
                        </div>
                    )}
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
            />
        </div>
    )
}
