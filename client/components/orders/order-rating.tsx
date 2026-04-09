'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { updateRestaurantRating } from '@/lib/actions'

import { useI18n } from '@/lib/i18n/i18n-context'

interface OrderRatingProps {
    orderId: string
    restaurantId: string
    customerName: string
    initialRating?: number
    initialComment?: string
}

export function OrderRating({
    orderId,
    restaurantId,
    customerName,
    initialRating = 0,
    initialComment = ''
}: OrderRatingProps) {
    const { t } = useI18n()
    const [rating, setRating] = useState(initialRating)
    const [comment, setComment] = useState(initialComment)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(initialRating > 0)
    const supabase = createClient()

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error(t.orders.selectStarToast)
            return
        }

        setIsSubmitting(true)
        try {
            console.log('[OrderRating] Submitting review:', { 
                orderId, 
                restaurantId, 
                customerName, 
                rating, 
                commentLength: comment.length 
            })

            const { error, data } = await supabase
                .from('reviews')
                .insert({
                    cafe_id: restaurantId,
                    customer_name: customerName,
                    rating,
                    comment,
                    order_id: orderId,
                })
                .select()

            if (error) {
                console.error('[OrderRating] Supabase error:', error)
                throw error
            }

            console.log('[OrderRating] Review submitted successfully:', data)
            
            // Update restaurant rating after successful review submission
            try {
                const newRating = await updateRestaurantRating(restaurantId)
                console.log('[OrderRating] Restaurant rating updated to:', newRating)
            } catch (ratingError) {
                console.error('[OrderRating] Failed to update restaurant rating:', ratingError)
                // Don't fail the review submission if rating update fails
            }
            
            setSubmitted(true)
            toast.success(t.orders.reviewThanksToast)
        } catch (error: any) {
            console.error('[OrderRating] Submission failed:', error)
            toast.error(t.cart.order_error + (error.message || 'Unknown error'))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <Card className="bg-emerald-500/10 border-emerald-500/20">
                <CardContent className="p-4 text-center">
                    <div className="flex justify-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                                key={s}
                                className={cn(
                                    "w-5 h-5",
                                    s <= rating ? "fill-primary text-primary" : "text-zinc-600"
                                )}
                            />
                        ))}
                    </div>
                    <p className="text-sm font-medium text-white">{t.orders.ratingSubmitted}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-white/5 border-white/10 shadow-xl">
            <CardContent className="p-6 space-y-6">
                <div className="text-center">
                    <h3 className="font-black text-lg text-white tracking-tight">{t.orders.rateOrder}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{t.orders.rateDesc}</p>
                </div>
 
                <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <button
                            key={s}
                            onClick={() => setRating(s)}
                            className="focus:outline-none transition-all active:scale-125"
                        >
                            <Star
                                className={cn(
                                    "w-10 h-10 transition-all duration-300",
                                    s <= rating ? "fill-primary text-primary scale-110" : "text-zinc-700 hover:text-zinc-500"
                                )}
                            />
                        </button>
                    ))}
                </div>
 
                <Textarea
                    placeholder={t.orders.reviewPlaceholder}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px] text-sm bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:ring-primary/50 rounded-2xl p-4"
                />
 
                <Button
                    className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20"
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                >
                    {isSubmitting ? t.cart.sending : t.orders.submitBtn}
                </Button>
            </CardContent>
        </Card>
    )
}
