'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CheckoutAuth } from '@/components/checkout/checkout-auth'

interface AuthModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-sm sm:max-w-sm">
                <DialogTitle className="sr-only">Авторизация</DialogTitle>
                <DialogDescription className="sr-only">Жүйеге кіру немесе тіркелу</DialogDescription>
                <div className="bg-background rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
                    <CheckoutAuth onLogin={onSuccess} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
