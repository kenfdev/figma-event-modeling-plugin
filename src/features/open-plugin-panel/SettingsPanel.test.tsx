import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Panel } from './Panel'
import { TranslationProvider } from '../../shared/i18n'

function renderPanel() {
  return render(
    <TranslationProvider initialLocale="en">
      <Panel />
    </TranslationProvider>
  )
}

describe('Settings Panel', () => {
  it('renders a gear icon button in the panel header', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('shows the settings panel when gear icon is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('button', { name: /settings/i }))

    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()
  })

  it('hides the main panel content when settings panel is shown', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('button', { name: /settings/i }))

    // Main panel headings should not be visible
    expect(screen.queryByRole('heading', { name: /Core Shapes/ })).not.toBeInTheDocument()
  })

  it('shows a language selector with English and Japanese options', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('button', { name: /settings/i }))

    const languageSelect = screen.getByRole('combobox', { name: /language/i })
    expect(languageSelect).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /english/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /日本語/i })).toBeInTheDocument()
  })

  it('returns to the main panel when back button is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back/i }))

    // Main panel headings should be visible again
    expect(screen.getByRole('heading', { name: /Core Shapes/ })).toBeInTheDocument()
    // Settings heading should be gone
    expect(screen.queryByRole('heading', { name: /settings/i })).not.toBeInTheDocument()
  })

  it('persists locale change by sending set-locale message to sandbox', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('button', { name: /settings/i }))

    const languageSelect = screen.getByRole('combobox', { name: /language/i })
    await user.selectOptions(languageSelect, 'ja')

    expect(parent.postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'set-locale', payload: { locale: 'ja' } } },
      '*'
    )
  })
})
