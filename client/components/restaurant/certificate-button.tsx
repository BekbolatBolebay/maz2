'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/i18n-context'

export function RestaurantCertificateButton({ restaurantId }: { restaurantId: string }) {
    const { lang } = useI18n()
    const router = useRouter()

    return (
        <Button
            variant="outline"
            className="rounded-2xl h-12 font-bold border-2 border-amber-200 text-amber-700 hover:bg-amber-50 gap-2 bg-amber-50/30"
            onClick={() => router.push(`/certificates?restaurant=${restaurantId}`)}
        >
            <Gift className="w-4 h-4" />
            {lang === 'kk' ? 'Сыйлық сертификаты' : 'Подарочный сертификат'}
        </Button>
    )
}
