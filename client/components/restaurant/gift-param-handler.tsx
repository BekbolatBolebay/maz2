'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Gift } from 'lucide-react'

export function GiftParamHandler() {
    const searchParams = useSearchParams()
    
    useEffect(() => {
        const giftCode = searchParams.get('gift')
        if (giftCode) {
            // Save to session storage so it persists until checkout
            sessionStorage.setItem('active_gift_code', giftCode)
            toast.success('Сыйлық сертификаты табылды! Ол төлем кезінде автоматты түрде қолданылады.', {
                icon: <Gift className="w-4 h-4 text-primary" />,
                duration: 5000
            })
        }
    }, [searchParams])

    return null
}
