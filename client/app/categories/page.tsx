import { Header } from '@/components/layout/header'
import { SearchBar } from '@/components/home/search-bar'
import Link from 'next/link'
import { LayoutGrid, ChevronRight } from 'lucide-react'
import { getGlobalCategories } from '@/lib/supabase/categories'

export default async function CategoriesPage() {
    const categories = await getGlobalCategories()

    return (
        <div className="flex flex-col min-h-screen pb-16">
            <Header title="Барлық категориялар" />

            <main className="flex-1 overflow-auto bg-muted/30">
                <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-6">
                    <SearchBar />

                    <div className="grid grid-cols-1 gap-3">
                        {categories.map((category, index) => (
                            <Link
                                key={index}
                                href={`/restaurants?category=${encodeURIComponent(category.name_ru)}`}
                                className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <LayoutGrid className="w-6 h-6 text-primary/40 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">
                                            {category.name_kk}
                                        </h3>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                            {category.name_ru}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                            </Link>
                        ))}
                    </div>

                    {categories.length === 0 && (
                        <div className="text-center py-20">
                            <div className="text-muted-foreground/20 mb-4">
                                <LayoutGrid className="w-16 h-16 mx-auto" />
                            </div>
                            <h3 className="text-lg font-bold mb-1">Категориялар табылмады</h3>
                            <p className="text-muted-foreground text-sm">Әзірге ешқандай категория жоқ</p>
                        </div>
                    )}
                </div>
            </main>

        </div>
    )
}
