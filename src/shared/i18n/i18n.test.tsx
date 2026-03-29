import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TranslationProvider, useTranslation } from './index'

// Test component that consumes the translation context
function TestConsumer() {
  const { t, locale, setLocale } = useTranslation()
  return (
    <div>
      <span data-locale={locale}>{t('panel.title')}</span>
      <span>{t('sections.coreShapes')}</span>
      <span>{t('messages.multipleSelected')}</span>
      <button onClick={() => setLocale('ja')}>Switch to Japanese</button>
      <button onClick={() => setLocale('en')}>Switch to English</button>
    </div>
  )
}

describe('i18n', () => {
  describe('TranslationProvider', () => {
    it('provides English translations by default', () => {
      render(
        <TranslationProvider>
          <TestConsumer />
        </TranslationProvider>
      )

      expect(screen.getByText('Event Modeling')).toBeInTheDocument()
      expect(screen.getByText('Core Shapes')).toBeInTheDocument()
    })

    it('provides Japanese translations when locale is ja', () => {
      render(
        <TranslationProvider initialLocale="ja">
          <TestConsumer />
        </TranslationProvider>
      )

      // Japanese translations should appear instead of English
      expect(screen.queryByText('Event Modeling')).not.toBeInTheDocument()
      expect(screen.queryByText('Core Shapes')).not.toBeInTheDocument()
    })

    it('re-renders consuming components when locale changes', async () => {
      const user = userEvent.setup()

      render(
        <TranslationProvider>
          <TestConsumer />
        </TranslationProvider>
      )

      // Initially English
      expect(screen.getByText('Event Modeling')).toBeInTheDocument()

      // Switch to Japanese
      await user.click(screen.getByRole('button', { name: 'Switch to Japanese' }))

      // English text should be gone
      expect(screen.queryByText('Event Modeling')).not.toBeInTheDocument()
    })

    it('switches back to English from Japanese', async () => {
      const user = userEvent.setup()

      render(
        <TranslationProvider initialLocale="ja">
          <TestConsumer />
        </TranslationProvider>
      )

      // Initially Japanese — no English text
      expect(screen.queryByText('Event Modeling')).not.toBeInTheDocument()

      // Switch to English
      await user.click(screen.getByRole('button', { name: 'Switch to English' }))

      expect(screen.getByText('Event Modeling')).toBeInTheDocument()
    })

    it('exposes current locale value', () => {
      render(
        <TranslationProvider initialLocale="ja">
          <TestConsumer />
        </TranslationProvider>
      )

      expect(screen.getByText((_, el) => el?.getAttribute('data-locale') === 'ja')).toBeInTheDocument()
    })
  })

  describe('useTranslation', () => {
    it('returns the translation string for a valid key', () => {
      render(
        <TranslationProvider>
          <TestConsumer />
        </TranslationProvider>
      )

      expect(screen.getByText('Multiple elements selected')).toBeInTheDocument()
    })

    it('returns the key itself when translation is missing', () => {
      function MissingKeyConsumer() {
        const { t } = useTranslation()
        return <span>{t('nonexistent.key' as any)}</span>
      }

      render(
        <TranslationProvider>
          <MissingKeyConsumer />
        </TranslationProvider>
      )

      expect(screen.getByText('nonexistent.key')).toBeInTheDocument()
    })
  })

  describe('locale files', () => {
    it('en and ja locale files have identical key structures', async () => {
      const en = await import('./locales/en')
      const ja = await import('./locales/ja')

      const enKeys = Object.keys(flattenObject(en.default))
      const jaKeys = Object.keys(flattenObject(ja.default))

      expect(enKeys.sort()).toEqual(jaKeys.sort())
    })
  })
})

// Helper to flatten nested objects for key comparison
function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flattenObject(obj[key], fullKey))
    } else {
      result[fullKey] = obj[key]
    }
  }
  return result
}
