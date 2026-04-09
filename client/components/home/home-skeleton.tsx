import { Skeleton } from '@/components/ui/skeleton'

export function HomeSkeleton() {
    return (
        <div className="flex flex-col min-h-screen pb-16">
            {/* Header Skeleton is usually static, but we can space it */}
            <div className="h-16 border-b border-border bg-background" />

            <main className="flex-1 overflow-auto">
                <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-6">
                    {/* Search Bar Skeleton */}
                    <div className="h-12 w-full rounded-2xl bg-muted/50 animate-pulse" />

                    {/* Promotion Banner Skeleton */}
                    <div className="h-40 w-full rounded-3xl bg-muted/30 animate-pulse" />

                    {/* Category Grid Skeleton */}
                    <div className="grid grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="w-14 h-14 rounded-2xl bg-muted animate-pulse" />
                                <div className="h-2 w-10 bg-muted/50 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>

                    {/* Restaurant Section Skeleton */}
                    <div className="space-y-4">
                        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
                        <div className="flex gap-4 overflow-hidden">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="min-w-[280px] h-48 rounded-3xl bg-muted animate-pulse shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* Food Section Skeleton */}
                    <div className="space-y-4">
                        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                        <div className="grid grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-60 rounded-3xl bg-muted animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Nav Skeleton */}
            <div className="h-16 border-t border-border bg-background fixed bottom-0 left-0 right-0" />
        </div>
    )
}
