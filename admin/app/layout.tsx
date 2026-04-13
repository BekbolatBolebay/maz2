import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppProvider } from '@/lib/app-context'
import { PushPrompt } from '@/components/pwa/push-prompt'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { Toaster } from 'sonner'
import { FCMHandler } from '@/components/fcm-handler'
import { SWRegistration } from '@/components/pwa/sw-registration'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Məzir Admin - Кафе Админ-Панелі',
  description: 'Кафені басқару жүйесі',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Məzir Admin',
    startupImage: [
      {
        url: '/apple-touch-icon.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1f5f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} font-sans antialiased bg-background text-foreground`}>
        <AppProvider>
          {children}
          <SWRegistration />
          <FCMHandler />
          <PushPrompt />
          <InstallPrompt />
          <Toaster position="top-center" />
        </AppProvider>
        <Analytics />
      </body>
    </html>
  )
}
