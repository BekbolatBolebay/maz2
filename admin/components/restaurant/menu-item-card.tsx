'use client'

import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MenuItem } from '@/lib/db'

interface MenuItemCardProps {
    item: MenuItem
}

export function MenuItemCard({ item }: MenuItemCardProps) {
    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
            <div className="relative aspect-square bg-muted">
                {item.image_url ? (
                    <Image
                        src={item.image_url}
                        alt={item.name_ru}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 italic">
                        No image
                    </div>
                )}
            </div>

            <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                <div>
                    <h3 className="font-bold text-sm line-clamp-2">{item.name_ru}</h3>
                    {item.description_ru && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {item.description_ru}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                        <span className="font-bold text-primary">{item.price} ₸</span>
                        {item.original_price && (
                            <span className="text-[10px] text-muted-foreground line-through">
                                {item.original_price} ₸
                            </span>
                        )}
                    </div>

                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
