'use client'

import { Share2, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/i18n-context'

interface ShareButtonProps {
    id: string
    name: string
    className?: string
}

export function ShareButton({ id, name, className }: ShareButtonProps) {
    const { locale } = useI18n()
    const [copied, setCopied] = useState(false)

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const url = `${window.location.origin}/restaurant/${id}`
        const text = locale === 'ru'
            ? `Посмотри это кафе: ${name}`
            : `Мына кафені қара: ${name}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: name,
                    text: text,
                    url: url,
                })
            } catch (err) {
                console.error('Error sharing:', err)
            }
        } else {
            try {
                await navigator.clipboard.writeText(url)
                setCopied(true)
                toast.success(locale === 'ru' ? 'Ссылка скопирована!' : 'Сілтеме көшірілді!')
                setTimeout(() => setCopied(false), 2000)
            } catch (err) {
                toast.error(locale === 'ru' ? 'Ошибка копирования' : 'Көшіру қатесі')
            }
        }
    }

    return (
        <Button
            variant="secondary"
            size="icon"
            className={className || "w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border-white/20 text-white hover:bg-black/40"}
            onClick={handleShare}
        >
            {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
        </Button>
    )
}
