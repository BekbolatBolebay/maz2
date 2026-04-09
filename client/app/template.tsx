'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [isAnimate, setIsAnimate] = useState(false)

    useEffect(() => {
        setIsAnimate(false)
        const timer = setTimeout(() => setIsAnimate(true), 10)
        return () => clearTimeout(timer)
    }, [pathname])

    return (
        <div className={isAnimate ? 'page-transition' : 'opacity-0'}>
            {children}
        </div>
    )
}
