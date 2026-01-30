import { describe, it, expect, vi } from 'vitest'
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

describe('Import YAML in Settings Panel', () => {
  async function openSettings() {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: /settings/i }))
    return user
  }

  it('renders Import YAML button in settings panel', async () => {
    await openSettings()
    expect(screen.getByRole('button', { name: /import yaml/i })).toBeInTheDocument()
  })

  it('shows textarea when Import YAML button is clicked', async () => {
    const user = await openSettings()

    await user.click(screen.getByRole('button', { name: /import yaml/i }))

    expect(screen.getByPlaceholderText(/paste yaml here/i)).toBeInTheDocument()
  })

  it('sends import-from-yaml message with textarea content on Import', async () => {
    const user = await openSettings()

    await user.click(screen.getByRole('button', { name: /import yaml/i }))
    await user.type(screen.getByPlaceholderText(/paste yaml here/i), 'slice: Test')
    await user.click(screen.getByRole('button', { name: /^import$/i }))

    expect(parent.postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'import-from-yaml', payload: { yamlContent: 'slice: Test' } } },
      '*'
    )
  })

  it('hides textarea when Cancel is clicked', async () => {
    const user = await openSettings()

    await user.click(screen.getByRole('button', { name: /import yaml/i }))
    expect(screen.getByPlaceholderText(/paste yaml here/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByPlaceholderText(/paste yaml here/i)).not.toBeInTheDocument()
  })

  it('disables Import button when textarea is empty', async () => {
    const user = await openSettings()

    await user.click(screen.getByRole('button', { name: /import yaml/i }))

    expect(screen.getByRole('button', { name: /^import$/i })).toBeDisabled()
  })
})
