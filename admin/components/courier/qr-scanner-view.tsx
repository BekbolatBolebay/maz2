'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, ArrowLeft, Camera, RefreshCw } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { toast } from 'sonner'

export function QrScannerView() {
    const [token, setToken] = useState('')
    const [isScanning, setIsScanning] = useState(false)
    const router = useRouter()
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        )

        scanner.render(onScanSuccess, onScanFailure)
        scannerRef.current = scanner

        function onScanSuccess(decodedText: string) {
            // Handle the scanned code as a token
            // If the code is a full URL, extract the token
            let scannedToken = decodedText
            try {
                if (decodedText.includes('/courier/track/')) {
                    scannedToken = decodedText.split('/courier/track/')[1].split('?')[0]
                }
            } catch (e) {
                console.error("Token extraction error:", e)
            }

            if (scannedToken) {
                scanner.clear()
                toast.success('Код табылды!')
                router.push(`/courier/track/${scannedToken}`)
            }
        }

        function onScanFailure(error: any) {
            // Usually we ignore failures as they happen frequently during scanning
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
            }
        }
    }, [router])

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (token.trim()) {
            if (scannerRef.current) scannerRef.current.clear()
            router.push(`/courier/track/${token.trim()}`)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-sm space-y-8 text-center">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                    <QrCode className="w-10 h-10" />
                </div>

                <div>
                    <h2 className="text-2xl font-black text-gray-900">QR Сканер</h2>
                    <p className="mt-2 text-gray-500 text-sm">Тапсырыс кодын сканерлеңіз немесе қолмен енгізіңіз</p>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                    {/* Scanner container */}
                    <div id="reader" className="w-full overflow-hidden rounded-3xl mb-6 bg-gray-100 border-2 border-dashed border-gray-200">
                        {/* The scanner will be rendered here */}
                    </div>

                    <div className="relative flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-gray-100"></div>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">НЕМЕСЕ</span>
                        <div className="flex-1 h-px bg-gray-100"></div>
                    </div>

                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Тапсырыс кодын енгізіңіз"
                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            Тапсырысты ашу
                        </button>
                    </form>
                </div>

                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-950 font-bold transition-colors mx-auto"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Артқа қайту
                </button>
            </div>

            <style jsx global>{`
                #reader__scan_region {
                    background: white !important;
                }
                #reader__dashboard_section_csr button {
                    background-color: var(--primary) !important;
                    color: white !important;
                    border: none !important;
                    padding: 8px 16px !important;
                    border-radius: 12px !important;
                    font-weight: bold !important;
                    font-size: 12px !important;
                    cursor: pointer !important;
                    margin-top: 10px !important;
                }
                #reader__dashboard_section_csr select {
                    padding: 8px !important;
                    border-radius: 12px !important;
                    border: 1px solid #eee !important;
                    font-size: 12px !important;
                    outline: none !important;
                    margin-top: 10px !important;
                }
                #reader {
                    border: none !important;
                }
                #reader video {
                    border-radius: 20px !important;
                    object-fit: cover !important;
                }
            `}</style>
        </div>
    )
}
