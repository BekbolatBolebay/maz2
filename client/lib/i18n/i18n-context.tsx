'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Locale } from './translations'

type I18nContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: typeof translations.en & ((path: string) => string)
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

function getTranslation(obj: any, path: string): string {
  if (!path) return ''
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      // Fallback: search in common or other top-level keys if path is not dotted
      if (keys.length === 1) {
        for (const topKey in obj) {
          if (obj[topKey] && typeof obj[topKey] === 'object' && path in obj[topKey]) {
            return obj[topKey][path]
          }
        }
      }
      return path
    }
  }

  return typeof current === 'string' ? current : path
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru')

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale
    if (saved && (saved === 'en' || saved === 'ru' || saved === 'kk')) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  const tBase = translations[locale]
  const t = ((path: string) => getTranslation(tBase, path)) as any
  Object.assign(t, tBase)

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
