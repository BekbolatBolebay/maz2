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
}

const AppContext = createContext<AppContextType>({
  lang: 'ru',
  setLang: () => { },
  theme: 'light',
  setTheme: () => { },
  toggleTheme: () => { },
})

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru')
  const [theme, setThemeState] = useState<Theme>('light')

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

  return (
    <AppContext.Provider value={{ lang, setLang, theme, setTheme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
