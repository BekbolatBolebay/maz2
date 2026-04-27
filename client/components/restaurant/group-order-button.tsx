'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/i18n-context'
import { toast } from 'sonner'

export function GroupOrderButton({ restaurantId }: { restaurantId: string }) {
    const { lang } = useI18n()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const startGroupOrder = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('group_orders')
            .insert({
                cafe_id: restaurantId,
                host_id: user?.id || null,
                status: 'active'
            })
            .select()
            .single()

        if (error) {
            toast.error(lang === 'kk' ? 'Қате кетті' : 'Произошла ошибка')
            setLoading(false)
            return
        }

        toast.success(lang === 'kk' ? 'Топтық тапсырыс ашылды!' : 'Групповой заказ открыт!')
        router.push(`/group-order/${data.id}`)
        setLoading(false)
    }

    return (
        <Button
            variant="outline"
            className="rounded-2xl h-12 font-bold border-2 border-primary/20 text-primary hover:bg-primary/5 gap-2"
            onClick={startGroupOrder}
            disabled={loading}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            {lang === 'kk' ? 'Бірге тапсырыс беру' : 'Заказать вместе'}
        </Button>
    )
}
