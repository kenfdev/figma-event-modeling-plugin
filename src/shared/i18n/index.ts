import { createContext, useContext, useState, useCallback, createElement } from 'react'
import type { ReactNode } from 'react'
import en from './locales/en'
import ja from './locales/ja'

export type Locale = 'en' | 'ja'

type TranslationMap = typeof en

// Flatten nested object keys into dot-notation paths
type FlattenKeys<T, Prefix extends string = ''> = T extends Record<string, unknown>
  ? {
      [K in keyof T & string]: T[K] extends Record<string, unknown>
        ? FlattenKeys<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
        : Prefix extends ''
          ? K
          : `${Prefix}.${K}`
    }[keyof T & string]
  : never

export type TranslationKey = FlattenKeys<TranslationMap>

const locales: Record<Locale, TranslationMap> = { en, ja: ja as unknown as TranslationMap }

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : path
}

interface TranslationContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const TranslationContext = createContext<TranslationContextValue | null>(null)

interface TranslationProviderProps {
  initialLocale?: Locale
  children: ReactNode
}

export function TranslationProvider({ initialLocale = 'en', children }: TranslationProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  const t = useCallback(
    (key: TranslationKey): string => {
      return getNestedValue(locales[locale] as unknown as Record<string, unknown>, key)
    },
    [locale]
  )

  return createElement(
    TranslationContext.Provider,
    { value: { locale, setLocale, t } },
    children
  )
}

export function useTranslation(): TranslationContextValue {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
