'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Lang } from '@/lib/i18n'

type Theme = 'light' | 'dark'

interface AppContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isInstallable: boolean
  isIos: boolean
  isStandalone: boolean
  installApp: () => Promise<void>
}

const AppContext = createContext<AppContextType>({
  lang: 'ru',
  setLang: () => { },
  theme: 'light',
  setTheme: () => { },
  toggleTheme: () => { },
  isInstallable: false,
  isIos: false,
  isStandalone: false,
  installApp: async () => { },
})

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru')
  const [theme, setThemeState] = useState<Theme>('light')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem('cafe_lang') as Lang
    const savedTheme = localStorage.getItem('cafe_theme') as Theme
    if (savedLang) {
      setLangState(savedLang)
      document.documentElement.lang = savedLang
    }
    if (savedTheme) {
      setThemeState(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }

    // PWA Install logic
    const handleBeforeInstall = (e: any) => {
      console.log('PWA: beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e)
      // Also store on window for global access (useful for direct button triggers)
      ;(window as any).deferredPrompt = e
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // iOS and Standalone detection
    const ua = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua)
    const standalone = window.matchMedia('(display-mode: standalone)').matches

    setIsIos(ios)
    setIsStandalone(standalone)

    if (ios && !standalone) {
      setIsInstallable(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('cafe_lang', l)
    document.documentElement.lang = l
  }

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('cafe_theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  const installApp = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
  }

  return (
    <AppContext.Provider value={{ lang, setLang, theme, setTheme, toggleTheme, isInstallable, isIos, isStandalone, installApp }}>
      {children}
    </AppContext.Provider>
  )
}


export function useApp() {
  return useContext(AppContext)
}
