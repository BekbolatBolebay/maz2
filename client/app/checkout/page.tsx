import { Suspense } from 'react'
import { CheckoutClient } from './checkout-client'
import { Loader2 } from 'lucide-react'

export const metadata = {
    title: 'Төлем жасау | Mazir',
    description: 'Тапсырысты рәсімдеу',
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <CheckoutClient />
        </Suspense>
    )
}
