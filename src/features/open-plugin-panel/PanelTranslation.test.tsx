import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Panel } from './Panel'
import { TranslationProvider } from '../../shared/i18n'

function renderWithLocale(locale: 'en' | 'ja') {
  return render(
    <TranslationProvider initialLocale={locale}>
      <Panel />
    </TranslationProvider>
  )
}

describe('Panel translation integration', () => {
  describe('English locale', () => {
    it('renders panel title in English', () => {
      renderWithLocale('en')
      expect(screen.getByRole('heading', { name: 'Event Modeling' })).toBeInTheDocument()
    })

    it('renders section headings in English', () => {
      renderWithLocale('en')
      expect(screen.getByRole('heading', { name: /Core Shapes/ })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /Structural/ })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /Sections/ })).toBeInTheDocument()
    })

    it('renders description text in English', () => {
      renderWithLocale('en')
      expect(screen.getByText('Create Event Modeling diagrams in FigJam.')).toBeInTheDocument()
    })

    it('renders link text in English', () => {
      renderWithLocale('en')
      expect(screen.getByRole('link', { name: 'Learn about Event Modeling' })).toBeInTheDocument()
    })
  })

  describe('Japanese locale', () => {
    it('renders panel title in Japanese', () => {
      renderWithLocale('ja')
      expect(screen.getByRole('heading', { name: 'イベントモデリング' })).toBeInTheDocument()
    })

    it('renders section headings in Japanese', () => {
      renderWithLocale('ja')
      expect(screen.getByRole('heading', { name: /基本シェイプ/ })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /構造/ })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /セクション/ })).toBeInTheDocument()
    })

    it('renders description text in Japanese', () => {
      renderWithLocale('ja')
      expect(screen.getByText('FigJamでイベントモデリング図を作成します。')).toBeInTheDocument()
    })

    it('renders link text in Japanese', () => {
      renderWithLocale('ja')
      expect(screen.getByRole('link', { name: 'イベントモデリングについて学ぶ' })).toBeInTheDocument()
    })
  })

  describe('Element type labels remain in English regardless of locale', () => {
    it('keeps element type button labels in English when locale is Japanese', () => {
      renderWithLocale('ja')
      expect(screen.getByRole('button', { name: 'Command' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Event' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Query' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Actor' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Lane' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Chapter' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Processor' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Screen' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Slice' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'GWT' })).toBeInTheDocument()
    })
  })
})
