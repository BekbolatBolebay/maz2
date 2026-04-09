import { ReactNode } from 'react'

export default function ManageLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen bg-muted/30 pb-20">
            <main className="flex-1 overflow-auto">
                <div className="max-w-screen-xl mx-auto h-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
