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

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 1200
                    const MAX_HEIGHT = 1200
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                })
                                resolve(compressedFile)
                            } else {
                                resolve(file)
                            }
                        },
                        'image/jpeg',
                        0.8 // Quality
                    )
                }
            }
        })
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        onUploadStart?.()

        // Көрсетілім үшін жергілікті URL жасау
        const localUrl = URL.createObjectURL(file)
        onChange(localUrl)

        try {
            // Сығу
            if (file.type.startsWith('image/')) {
                file = await compressImage(file)
            }

            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Upload failed')

            // Нақты R2 URL-ні орнатып, blob URL-ді жойамыз
            URL.revokeObjectURL(localUrl)
            onChange(data.url)
            toast.success('Сәтті жүктелді')
        } catch (error: any) {
            console.error('Upload Error:', error)
            toast.error('Жүктеу кезінде қате кетті: ' + error.message)
            // Blob URL-ді жойып, бос күйге қайтарамыз
            URL.revokeObjectURL(localUrl)
            onChange('')
        } finally {
            setLoading(false)
            onUploadEnd?.()
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
