import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Panel } from './Panel'
import { TranslationProvider } from '../../shared/i18n'

function renderPanel(props: React.ComponentProps<typeof Panel> = {}) {
  return render(
    <TranslationProvider initialLocale="en">
      <Panel {...props} />
    </TranslationProvider>
  )
}

describe('Panel', () => {
  it('renders the plugin title', () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: 'Event Modeling' })).toBeInTheDocument()
  })

  it('renders Core Shapes section with buttons', () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: /Core Shapes/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Command' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Event' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Query' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Actor' })).toBeInTheDocument()
  })

  it('renders Structural section with buttons', () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: /Structural/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lane' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chapter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Processor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Screen' })).toBeInTheDocument()
  })

  it('renders Sections section with buttons', () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: /Sections/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Slice' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'GWT' })).toBeInTheDocument()
  })

  it('renders help link', () => {
    renderPanel()
    const link = screen.getByRole('link', { name: /learn about event modeling/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://eventmodeling.org/')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders Command button as enabled', () => {
    renderPanel()
    const commandButton = screen.getByRole('button', { name: 'Command' })
    expect(commandButton).not.toBeDisabled()
  })

  it('sends create-command message to sandbox when Command button is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()

    const commandButton = screen.getByRole('button', { name: 'Command' })
    await user.click(commandButton)

    expect(parent.postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'create-command' } },
      '*'
    )
  })

  it('calls onCreateElement with "command" when Command button is clicked and callback provided', async () => {
    const user = userEvent.setup()
    const onCreateElement = vi.fn()
    renderPanel({ onCreateElement })

    const commandButton = screen.getByRole('button', { name: 'Command' })
    await user.click(commandButton)

    expect(onCreateElement).toHaveBeenCalledWith('command')
  })

  it('renders Event button as enabled', () => {
    renderPanel()
    const eventButton = screen.getByRole('button', { name: 'Event' })
    expect(eventButton).not.toBeDisabled()
  })

  it('sends create-event message to sandbox when Event button is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()

    const eventButton = screen.getByRole('button', { name: 'Event' })
    await user.click(eventButton)

    expect(parent.postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'create-event' } },
      '*'
    )
  })

  it('calls onCreateElement with "event" when Event button is clicked and callback provided', async () => {
    const user = userEvent.setup()
    const onCreateElement = vi.fn()
    renderPanel({ onCreateElement })

    const eventButton = screen.getByRole('button', { name: 'Event' })
    await user.click(eventButton)

    expect(onCreateElement).toHaveBeenCalledWith('event')
  })

  it('renders Query button as enabled', () => {
    renderPanel()
    const queryButton = screen.getByRole('button', { name: 'Query' })
    expect(queryButton).not.toBeDisabled()
  })

  it('sends create-query message to sandbox when Query button is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()

    const queryButton = screen.getByRole('button', { name: 'Query' })
    await user.click(queryButton)

    expect(parent.postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'create-query' } },
      '*'
    )
  })

  it('calls onCreateElement with "query" when Query button is clicked and callback provided', async () => {
    const user = userEvent.setup()
    const onCreateElement = vi.fn()
    renderPanel({ onCreateElement })

    const queryButton = screen.getByRole('button', { name: 'Query' })
    await user.click(queryButton)

    expect(onCreateElement).toHaveBeenCalledWith('query')
  })

  it('renders Actor button as enabled', () => {
    renderPanel()
    const actorButton = screen.getByRole('button', { name: 'Actor' })
    expect(actorButton).not.toBeDisabled()
  })

  it('sends create-actor message to sandbox when Actor button is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()

    const actorButton = screen.getByRole('button', { name: 'Actor' })
    await user.click(actorButton)

    expect(parent.postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'create-actor' } },
      '*'
    )
  })

  it('calls onCreateElement with "actor" when Actor button is clicked and callback provided', async () => {
    const user = userEvent.setup()
    const onCreateElement = vi.fn()
    renderPanel({ onCreateElement })

    const actorButton = screen.getByRole('button', { name: 'Actor' })
    await user.click(actorButton)

    expect(onCreateElement).toHaveBeenCalledWith('actor')
  })

  it('renders Lane button as enabled', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: 'Lane' })).toBeEnabled()
  })

  it('sends create-lane message to sandbox when Lane button is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()

    const laneButton = screen.getByRole('button', { name: 'Lane' })
    await user.click(laneButton)

    expect(parent.postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'create-lane' } },
      '*'
    )
  })

  it('shows multiple selection message when multiple elements are selected', async () => {
    renderPanel()

    // Simulate receiving a multiple-selection message from the sandbox
    const messageEvent = new MessageEvent('message', {
      data: {
        pluginMessage: {
          type: 'selection-changed',
          payload: { multiple: true },
        },
      },
    })
    window.dispatchEvent(messageEvent)

    expect(await screen.findByText(/multiple elements selected/i)).toBeInTheDocument()
  })

  it('keeps creation buttons visible when multiple elements are selected', async () => {
    renderPanel()

    const messageEvent = new MessageEvent('message', {
      data: {
        pluginMessage: {
          type: 'selection-changed',
          payload: { multiple: true },
        },
      },
    })
    window.dispatchEvent(messageEvent)

    // Wait for state update
    await screen.findByText(/multiple elements selected/i)

    // Creation buttons should still be present and functional
    expect(screen.getByRole('button', { name: 'Command' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Event' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Query' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Actor' })).toBeInTheDocument()
  })

  it('does not show element editor fields when multiple elements are selected', async () => {
    renderPanel()

    const messageEvent = new MessageEvent('message', {
      data: {
        pluginMessage: {
          type: 'selection-changed',
          payload: { multiple: true },
        },
      },
    })
    window.dispatchEvent(messageEvent)

    await screen.findByText(/multiple elements selected/i)

    // No editable fields should be shown
    expect(screen.queryByRole('textbox', { name: /element name/i })).not.toBeInTheDocument()
  })

  it('keeps other element buttons disabled', () => {
    renderPanel()
    // Other buttons should still be disabled until their handlers are implemented
    expect(screen.getByRole('button', { name: 'Lane' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Chapter' })).toBeEnabled()
  })

  it('renders GWT button as enabled', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: 'GWT' })).toBeEnabled()
  })

  it('sends create-gwt message to sandbox when GWT button is clicked', async () => {
    const user = userEvent.setup()
    renderPanel()

    const gwtButton = screen.getByRole('button', { name: 'GWT' })
    await user.click(gwtButton)

    expect(parent.postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'create-gwt' } },
      '*'
    )
  })

  it('calls onCreateElement with "gwt" when GWT button is clicked and callback provided', async () => {
    const user = userEvent.setup()
    const onCreateElement = vi.fn()
    renderPanel({ onCreateElement })

    const gwtButton = screen.getByRole('button', { name: 'GWT' })
    await user.click(gwtButton)

    expect(onCreateElement).toHaveBeenCalledWith('gwt')
  })

  describe('ResizeHandle', () => {
    beforeEach(() => {
      vi.spyOn(parent, 'postMessage')
      Object.defineProperty(window, 'innerWidth', { value: 300, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 400, writable: true })
    })

    it('renders a resize handle element', () => {
      renderPanel()
      expect(screen.getByRole('separator', { name: /resize/i })).toBeInTheDocument()
    })

    it('sends resize-panel message on drag', () => {
      renderPanel()
      const handle = screen.getByRole('separator', { name: /resize/i })

      fireEvent.pointerDown(handle, { clientX: 100, clientY: 200 })
      fireEvent.pointerMove(window, { clientX: 120, clientY: 230 })

      expect(parent.postMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'resize-panel',
            payload: { width: 320, height: 430 },
          },
        },
        '*'
      )
    })

    it('enforces minimum width of 240px', () => {
      Object.defineProperty(window, 'innerWidth', { value: 260, writable: true })
      renderPanel()
      const handle = screen.getByRole('separator', { name: /resize/i })

      // Drag left by 30px: 260 + (-30) = 230, should clamp to 240
      fireEvent.pointerDown(handle, { clientX: 100, clientY: 200 })
      fireEvent.pointerMove(window, { clientX: 70, clientY: 200 })

      expect(parent.postMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'resize-panel',
            payload: { width: 240, height: 400 },
          },
        },
        '*'
      )
    })

    it('enforces minimum height of 300px', () => {
      Object.defineProperty(window, 'innerHeight', { value: 320, writable: true })
      renderPanel()
      const handle = screen.getByRole('separator', { name: /resize/i })

      // Drag up by 30px: 320 + (-30) = 290, should clamp to 300
      fireEvent.pointerDown(handle, { clientX: 100, clientY: 200 })
      fireEvent.pointerMove(window, { clientX: 100, clientY: 170 })

      expect(parent.postMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'resize-panel',
            payload: { width: 300, height: 300 },
          },
        },
        '*'
      )
    })

    it('stops tracking on pointerup', () => {
      renderPanel()
      const handle = screen.getByRole('separator', { name: /resize/i })

      fireEvent.pointerDown(handle, { clientX: 100, clientY: 200 })
      fireEvent.pointerUp(window)

      // Clear any calls from the drag
      vi.mocked(parent.postMessage).mockClear()

      // Further movement should not send messages
      fireEvent.pointerMove(window, { clientX: 150, clientY: 250 })

      expect(parent.postMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({
          pluginMessage: expect.objectContaining({ type: 'resize-panel' }),
        }),
        '*'
      )
    })
  })

  it('does not render Import section in main panel (moved to Settings)', () => {
    renderPanel()
    expect(screen.queryByRole('heading', { name: /import/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /import yaml/i })).not.toBeInTheDocument()
  })

  describe('Collapsible sections', () => {
    it('renders all three sections expanded by default', () => {
      renderPanel()
      // All buttons should be visible when sections are expanded
      expect(screen.getByRole('button', { name: 'Command' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Lane' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Slice' })).toBeVisible()
    })

    it('collapses Core Shapes section when its heading is clicked', async () => {
      const user = userEvent.setup()
      renderPanel()

      const heading = screen.getByRole('heading', { name: /Core Shapes/ })
      await user.click(heading)

      // Core Shapes buttons should be hidden
      expect(screen.queryByRole('button', { name: 'Command' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Event' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Query' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Actor' })).not.toBeInTheDocument()

      // Other sections should still be visible
      expect(screen.getByRole('button', { name: 'Lane' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Slice' })).toBeVisible()
    })

    it('collapses Structural section when its heading is clicked', async () => {
      const user = userEvent.setup()
      renderPanel()

      const heading = screen.getByRole('heading', { name: /Structural/ })
      await user.click(heading)

      expect(screen.queryByRole('button', { name: 'Lane' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Chapter' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Processor' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Screen' })).not.toBeInTheDocument()

      // Other sections still visible
      expect(screen.getByRole('button', { name: 'Command' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Slice' })).toBeVisible()
    })

    it('collapses Sections section when its heading is clicked', async () => {
      const user = userEvent.setup()
      renderPanel()

      const heading = screen.getByRole('heading', { name: /Sections/ })
      await user.click(heading)

      expect(screen.queryByRole('button', { name: 'Slice' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'GWT' })).not.toBeInTheDocument()

      // Other sections still visible
      expect(screen.getByRole('button', { name: 'Command' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Lane' })).toBeVisible()
    })

    it('expands a collapsed section when its heading is clicked again', async () => {
      const user = userEvent.setup()
      renderPanel()

      const heading = screen.getByRole('heading', { name: /Core Shapes/ })

      // Collapse
      await user.click(heading)
      expect(screen.queryByRole('button', { name: 'Command' })).not.toBeInTheDocument()

      // Expand
      await user.click(heading)
      expect(screen.getByRole('button', { name: 'Command' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Event' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Query' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Actor' })).toBeVisible()
    })

    it('shows expand chevron indicator when section is expanded', () => {
      renderPanel()
      const heading = screen.getByRole('heading', { name: /Core Shapes/ })
      expect(heading.textContent).toContain('▾')
    })

    it('shows collapse chevron indicator when section is collapsed', async () => {
      const user = userEvent.setup()
      renderPanel()

      const heading = screen.getByRole('heading', { name: /Core Shapes/ })
      await user.click(heading)

      expect(heading.textContent).toContain('▸')
    })
  })

  describe('Copy YAML Template button in Settings', () => {
    async function openSettings() {
      const user = userEvent.setup()
      renderPanel()
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)
      return user
    }

    it('renders a copy template button next to the Import YAML button', async () => {
      await openSettings()
      expect(screen.getByRole('button', { name: /copy yaml template/i })).toBeInTheDocument()
    })

    it('copies YAML template to clipboard when clicked', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const user = await openSettings()
      const copyButton = screen.getByRole('button', { name: /copy yaml template/i })
      await user.click(copyButton)

      expect(writeText).toHaveBeenCalledTimes(1)
      // Verify it copies the actual YAML template content (starts with 'slice:')
      expect(writeText.mock.calls[0][0]).toMatch(/^slice: /)
    })

    it('shows "Copied!" feedback after clicking', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const user = await openSettings()
      const copyButton = screen.getByRole('button', { name: /copy yaml template/i })
      await user.click(copyButton)

      expect(await screen.findByText('Copied!')).toBeInTheDocument()
    })

    it('shows tooltip text "Copy YAML template" on hover', async () => {
      await openSettings()
      const copyButton = screen.getByRole('button', { name: /copy yaml template/i })
      expect(copyButton).toHaveAttribute('title', 'Copy YAML template')
    })
  })

  describe('Card-style element preview buttons', () => {
    it('renders each creation button as a card with color-filled background', () => {
      renderPanel()

      const allButtons = [
        'Command', 'Event', 'Query', 'Actor',
        'Lane', 'Chapter', 'Processor', 'Screen',
        'Slice', 'GWT',
      ]
      for (const name of allButtons) {
        const button = screen.getByRole('button', { name })
        expect(button.style.backgroundColor, `${name} button should have a background color`).toBeTruthy()
      }
    })

    it('renders Core Shapes button colors matching element colors', () => {
      renderPanel()

      // Browser normalizes hex colors to rgb() format
      const colorMap: Record<string, string> = {
        Command: 'rgb(61, 173, 255)',
        Event: 'rgb(255, 158, 66)',
        Query: 'rgb(126, 211, 33)',
        Actor: 'rgb(80, 227, 194)',
      }

      for (const [name, expectedColor] of Object.entries(colorMap)) {
        const button = screen.getByRole('button', { name })
        expect(button.style.backgroundColor).toBe(expectedColor)
      }
    })

    it('renders button-group containers with grid layout class', () => {
      renderPanel()
      const buttonGroups = document.querySelectorAll('.button-group')
      for (const group of buttonGroups) {
        expect(group.classList.contains('card-grid')).toBe(true)
      }
    })

    it('still sends correct message when a card button is clicked', async () => {
      const user = userEvent.setup()
      renderPanel()

      // Click Processor card (one of the structural types) to verify cards still work
      const processorButton = screen.getByRole('button', { name: 'Processor' })
      await user.click(processorButton)

      expect(parent.postMessage).toHaveBeenCalledWith(
        { pluginMessage: { type: 'create-processor' } },
        '*'
      )
    })

    it('still calls onCreateElement callback when a card button is clicked', async () => {
      const user = userEvent.setup()
      const onCreateElement = vi.fn()
      renderPanel({ onCreateElement })

      const screenButton = screen.getByRole('button', { name: 'Screen' })
      await user.click(screenButton)

      expect(onCreateElement).toHaveBeenCalledWith('screen')
    })
  })
})
