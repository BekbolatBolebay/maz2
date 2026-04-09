'use client'

import { useEffect, useState } from 'react'
import { Star, MessageSquare, Reply, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function AdminReviews() {
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [replyText, setReplyText] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchReviews()
    }, [])

    async function fetchReviews() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/reviews')
            const data = await res.json()
            if (data.authorized) {
                setReviews(data.reviews || [])
            }
        } catch (err) {
            toast.error('Failed to load reviews')
        } finally {
            setLoading(false)
        }
    }

    const handleReply = async (reviewId: string) => {
        if (!replyText[reviewId]) return
        try {
            const res = await fetch('/api/admin/reviews', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: reviewId, reply: replyText[reviewId] })
            })
            const data = await res.json()
            if (data.authorized) {
                toast.success('Reply posted successfully')
                fetchReviews()
                setReplyText(prev => ({ ...prev, [reviewId]: '' }))
            }
        } catch (err) {
            toast.error('Failed to post reply')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Customer Reviews</h2>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        Total Reviews: {reviews.length}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-12 text-center text-muted-foreground">
                            No reviews received yet.
                        </CardContent>
                    </Card>
                ) : (
                    reviews.map((review) => (
                        <Card key={review.id} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Customer Info & Rating */}
                                    <div className="md:w-64 flex-shrink-0 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                {review.customer_avatar ? (
                                                    <img src={review.customer_avatar} alt="" className="h-full w-full rounded-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{review.customer_name}</div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {format(new Date(review.created_at), 'MMM d, yyyy HH:mm')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 pt-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`h-4 w-4 ${star <= review.rating ? 'fill-primary text-primary' : 'text-muted'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Review Content & Reply */}
                                    <div className="flex-1 space-y-4">
                                        <div className="text-sm italic text-muted-foreground leading-relaxed">
                                            "{review.comment}"
                                        </div>

                                        {review.reply ? (
                                            <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary/40 relative">
                                                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                                                    <Reply className="h-3 w-3" />
                                                    Official Reply
                                                </div>
                                                <p className="text-sm">{review.reply}</p>
                                                <div className="text-[10px] text-muted-foreground mt-2">
                                                    Replied on {format(new Date(review.replied_at), 'MMM d')}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <Textarea
                                                    placeholder="Write an official reply..."
                                                    className="text-sm min-h-[80px]"
                                                    value={replyText[review.id] || ''}
                                                    onChange={e => setReplyText({ ...prev => ({ ...prev, [review.id]: e.target.value }) })}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm">Ignore</Button>
                                                    <Button
                                                        size="sm"
                                                        className="flex items-center gap-2"
                                                        onClick={() => handleReply(review.id)}
                                                        disabled={!replyText[review.id]}
                                                    >
                                                        <Reply className="h-3 w-3" />
                                                        Post Reply
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
