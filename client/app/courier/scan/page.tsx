'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode'
import { Header } from '@/components/layout/header'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Smartphone, Camera, AlertTriangle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/i18n-context'

export default function CourierScanPage() {
    const { t, locale } = useI18n()
    const router = useRouter()
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            'reader',
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
                aspectRatio: 1.0
            },
      /* verbose= */ false
        )

        scanner.render(onScanSuccess, onScanFailure)
        scannerRef.current = scanner

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => {
                    console.error('Failed to clear scanner', err)
                })
            }
        }
    }, [])

    function onScanSuccess(decodedText: string) {
        // Check if it's a valid link or just an order ID
        // Our QR codes usually point to /courier/track/[token] or similar
        // Or just contains the token/id
        setScanResult(decodedText)

        // Stop scanner after success
        if (scannerRef.current) {
            scannerRef.current.clear()
        }

        // Attempt to parse and navigate
        try {
            if (decodedText.includes('/courier/track/')) {
                router.push(decodedText)
                toast.success(locale === 'ru' ? 'Заказ найден!' : 'Тапсырыс табылды!')
            } else {
                // Assume it's a token/id
                router.push(`/courier/track/${decodedText}`)
            }
        } catch (err) {
            setError(locale === 'ru' ? 'Неверный QR-код' : 'QR-код жарамсыз')
        }
    }

    function onScanFailure(error: any) {
        // Most failures are just "QR code not found in frame", so we don't toast them
        // console.warn(`Code scan error = ${error}`)
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/30">
            <Header title={locale === 'ru' ? 'Сканер QR-кода' : 'QR-код сканері'} />

            <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 px-2 -ml-2 rounded-lg">
                        <ArrowLeft className="w-4 h-4 mr-1" /> {t.common.back}
                    </Button>
                </div>

                <Card className="overflow-hidden border-2 border-primary/10 shadow-xl rounded-[2.5rem]">
                    <CardContent className="p-0">
                        <div id="reader" className="w-full aspect-square bg-black overflow-hidden relative">
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="w-64 h-64 border-2 border-primary/50 rounded-3xl animate-pulse flex items-center justify-center">
                                    <div className="w-48 h-48 border border-white/20 rounded-2xl" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                            <Camera className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base mb-1">
                                {locale === 'ru' ? 'Как использовать' : 'Қалай қолдану керек'}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {locale === 'ru'
                                    ? 'Наведите камеру на QR-код заказа, чтобы мгновенно открыть детали.'
                                    : 'Тапсырыс мәліметтерін ашу үшін камераны QR-кодқа бағыттаңыз.'}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-center gap-3 animate-in shake duration-500">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            <p className="text-xs font-bold text-destructive">{error}</p>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        className="w-full h-14 rounded-2xl border-2 font-bold flex items-center justify-center gap-2 group"
                        onClick={() => router.push('/courier')}
                    >
                        <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>{locale === 'ru' ? 'Ручной ввод токена' : 'Токенді қолмен енгізу'}</span>
                    </Button>
                </div>
            </main>

            <style jsx global>{`
        #reader {
          border: none !important;
        }
        #reader__scan_region {
          background: black !important;
        }
        #reader__dashboard {
          padding: 20px !important;
          background: var(--background) !important;
        }
        #reader__dashboard_section_csr button {
          background-color: var(--primary) !important;
          color: white !important;
          border-radius: 12px !important;
          padding: 8px 16px !important;
          font-weight: bold !important;
          border: none !important;
          margin-top: 10px !important;
          cursor: pointer !important;
        }
        #reader__status_span {
          font-size: 12px !important;
          color: var(--muted-foreground) !important;
        }
        #reader video {
          border-radius: 40px !important;
        }
      `}</style>
        </div>
    )
}
