'use client'

import { useApp } from '@/lib/app-context'
import { cn } from '@/lib/utils'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { lang, setLang } = useApp()

    return (
        <div className="relative min-h-screen">
            <div className="absolute top-8 right-8 z-50">
                <div className="flex p-1 bg-background/50 backdrop-blur-md rounded-xl border border-border shadow-sm">
                    <button
                        onClick={() => setLang('kk')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-black rounded-lg transition-all",
                            lang === 'kk' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                    >
                        KK
                    </button>
                    <button
                        onClick={() => setLang('ru')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-black rounded-lg transition-all",
                            lang === 'ru' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                    >
                        RU
                    </button>
                </div>
            </div>
            {children}
        </div>
    )
}
