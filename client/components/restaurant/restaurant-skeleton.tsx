import { Skeleton } from '@/components/ui/skeleton'

export function RestaurantSkeleton() {
    return (
        <div className="flex flex-col min-h-screen pb-16 bg-muted/30">
            {/* Header Skeleton */}
            <div className="h-64 w-full bg-muted animate-pulse relative">
                <div className="absolute top-4 right-4 flex gap-2">
                    <div className="w-10 h-10 rounded-xl bg-muted/50" />
                    <div className="w-10 h-10 rounded-xl bg-muted/50" />
                </div>
            </div>

            <div className="px-4 -mt-12 relative z-10 space-y-6">
                {/* Info Card Skeleton */}
                <div className="bg-card rounded-3xl p-6 shadow-lg border border-border space-y-4">
                    <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="flex gap-4">
                        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </div>
                </div>

                {/* Categories Tab Skeleton */}
                <div className="flex gap-2 overflow-hidden py-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-10 w-24 rounded-xl bg-muted animate-pulse shrink-0" />
                    ))}
                </div>

                {/* Menu Items Grid Skeleton */}
                <div className="grid grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-56 rounded-3xl bg-card border border-border overflow-hidden">
                            <div className="h-32 bg-muted animate-pulse" />
                            <div className="p-3 space-y-2">
                                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                                <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
