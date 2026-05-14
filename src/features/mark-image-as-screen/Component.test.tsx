import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkImageAsScreen } from './Component'
import { TranslationProvider } from '../../shared/i18n'

function renderComponent(props: { hasPlainImages: boolean; hasScreenImages: boolean }) {
  return render(
    <TranslationProvider initialLocale="en">
      <MarkImageAsScreen {...props} />
    </TranslationProvider>
  )
}

describe('MarkImageAsScreen', () => {
  let postMessageSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    postMessageSpy = vi.spyOn(parent, 'postMessage').mockImplementation(() => {})
  })

  afterEach(() => {
    postMessageSpy.mockRestore()
  })

  it('renders Mark as Screen and Revert to Image buttons', () => {
    renderComponent({ hasPlainImages: false, hasScreenImages: false })
    expect(screen.getByRole('button', { name: 'Mark as Screen' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Revert to Image' })).toBeTruthy()
  })

  it('disables Mark button when no plain images in selection', () => {
    renderComponent({ hasPlainImages: false, hasScreenImages: false })
    const markBtn = screen.getByRole('button', { name: 'Mark as Screen' }) as HTMLButtonElement
    expect(markBtn.disabled).toBe(true)
  })

  it('enables Mark button when selection has plain images', () => {
    renderComponent({ hasPlainImages: true, hasScreenImages: false })
    const markBtn = screen.getByRole('button', { name: 'Mark as Screen' }) as HTMLButtonElement
    expect(markBtn.disabled).toBe(false)
  })

  it('disables Revert button when no screen images in selection', () => {
    renderComponent({ hasPlainImages: false, hasScreenImages: false })
    const revertBtn = screen.getByRole('button', { name: 'Revert to Image' }) as HTMLButtonElement
    expect(revertBtn.disabled).toBe(true)
  })

  it('enables Revert button when selection has screen images', () => {
    renderComponent({ hasPlainImages: false, hasScreenImages: true })
    const revertBtn = screen.getByRole('button', { name: 'Revert to Image' }) as HTMLButtonElement
    expect(revertBtn.disabled).toBe(false)
  })

  it('posts mark-as-screen message when Mark button clicked', async () => {
    const user = userEvent.setup()
    renderComponent({ hasPlainImages: true, hasScreenImages: false })
    await user.click(screen.getByRole('button', { name: 'Mark as Screen' }))
    expect(postMessageSpy).toHaveBeenCalledWith(
      { pluginMessage: { type: 'mark-as-screen' } },
      '*'
    )
  })

  it('posts revert-screen message when Revert button clicked', async () => {
    const user = userEvent.setup()
    renderComponent({ hasPlainImages: false, hasScreenImages: true })
    await user.click(screen.getByRole('button', { name: 'Revert to Image' }))
    expect(postMessageSpy).toHaveBeenCalledWith(
      { pluginMessage: { type: 'revert-screen' } },
      '*'
    )
  })
})
