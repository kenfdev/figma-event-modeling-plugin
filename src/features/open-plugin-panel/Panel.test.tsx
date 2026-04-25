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

  describe('Import YAML in main panel', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    async function expandOtherSection() {
      const user = userEvent.setup()
      renderPanel()
      const otherHeading = screen.getByRole('heading', { name: /Other/ })
      await user.click(otherHeading)
      return user
    }

    it('renders Other section collapsed by default', () => {
      renderPanel()
      expect(screen.getByRole('heading', { name: /Other/ })).toBeInTheDocument()
      expect(screen.queryByPlaceholderText(/paste yaml here/i)).not.toBeInTheDocument()
    })

    it('expands Other section and shows textarea when heading is clicked', async () => {
      await expandOtherSection()
      expect(screen.getByPlaceholderText(/paste yaml here/i)).toBeInTheDocument()
    })

    it('sends import-from-yaml message with parsed data when Import is clicked', async () => {
      const user = await expandOtherSection()

      const validYaml = 'slice: Test\nscreen:\n  type: user\ncommands:\n  - name: DoSomething'
      await user.type(screen.getByPlaceholderText(/paste yaml here/i), validYaml)
      await user.click(screen.getByRole('button', { name: /^import$/i }))

      expect(parent.postMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'import-from-yaml',
            payload: {
              slice: 'Test',
              screen: { type: 'user' },
              commands: [{ name: 'DoSomething', fields: undefined, notes: undefined, produces: undefined }],
            },
          },
        },
        '*'
      )
    })

    it('sets inline error when YAML is invalid and does not send message to sandbox', async () => {
      const user = await expandOtherSection()

      vi.spyOn(console, 'error').mockImplementation(() => {})
      await user.type(screen.getByPlaceholderText(/paste yaml here/i), 'slice: Test\nscreen:\n  type: not-valid')
      await user.click(screen.getByRole('button', { name: /^import$/i }))

      expect(await screen.findByRole('alert')).toBeInTheDocument()
      expect(parent.postMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ pluginMessage: expect.objectContaining({ type: 'import-from-yaml' }) }),
        '*'
      )
    })

    it('console.warns parser warnings for unknown top-level keys', async () => {
      const user = await expandOtherSection()
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const yamlWithUnknownKey = 'slice: Test\nscreen:\n  type: user\nunknown_key: some_value'
      await user.type(screen.getByPlaceholderText(/paste yaml here/i), yamlWithUnknownKey)
      await user.click(screen.getByRole('button', { name: /^import$/i }))

      expect(warnSpy).toHaveBeenCalledWith("Unknown top-level key: 'unknown_key'")
    })

    it('on import-resolution-needed, hides import form and renders ResolutionFlow', async () => {
      await expandOtherSection()

      const pendingData = [
        {
          queryName: 'FindUser',
          eventName: 'UserFound',
          kind: 'cross-slice' as const,
          candidates: [
            { nodeId: 'node-1', label: 'UserFound', parentSliceName: 'OtherSlice' },
          ],
        },
      ]

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'import-resolution-needed',
            payload: { pending: pendingData },
          },
        },
      })
      window.dispatchEvent(messageEvent)

      expect(await screen.findByText(/Event 1 of 1/i)).toBeInTheDocument()
      expect(screen.queryByPlaceholderText(/paste yaml here/i)).not.toBeInTheDocument()
    })

    it('ResolutionFlow onDone posts import-resolution-answered and restores form', async () => {
      await expandOtherSection()

      const pendingData = [
        {
          queryName: 'FindUser',
          eventName: 'UserFound',
          kind: 'no-match' as const,
          candidates: [],
        },
      ]

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'import-resolution-needed',
            payload: { pending: pendingData },
          },
        },
      })
      window.dispatchEvent(messageEvent)
      await screen.findByText(/Event 1 of 1/i)

      const user = userEvent.setup()
      const createButton = screen.getByRole('button', { name: /create/i })
      await user.click(createButton)

      expect(parent.postMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'import-resolution-answered',
            payload: {
              answers: [{ kind: 'create' }],
            },
          },
        },
        '*'
      )
      expect(screen.queryByText(/Event 1 of 1/i)).not.toBeInTheDocument()
      expect(screen.getByPlaceholderText(/paste yaml here/i)).toBeInTheDocument()
    })

    it('ResolutionFlow onFocus posts focus-node', async () => {
      await expandOtherSection()

      const pendingData = [
        {
          queryName: 'FindUser',
          eventName: 'UserFound',
          kind: 'cross-slice' as const,
          candidates: [
            { nodeId: 'node-123', label: 'UserFound', parentSliceName: 'OtherSlice' },
          ],
        },
      ]

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'import-resolution-needed',
            payload: { pending: pendingData },
          },
        },
      })
      window.dispatchEvent(messageEvent)
      await screen.findByText(/Event 1 of 1/i)

      const user = userEvent.setup()
      const focusButton = screen.getByRole('button', { name: /focus/i })
      await user.click(focusButton)

      expect(parent.postMessage).toHaveBeenCalledWith(
        { pluginMessage: { type: 'focus-node', payload: { nodeId: 'node-123' } } },
        '*'
      )
    })

    it('import-from-yaml-success restores form with success feedback', async () => {
      await expandOtherSection()

      const pendingData = [
        {
          queryName: 'FindUser',
          eventName: 'UserFound',
          kind: 'no-match' as const,
          candidates: [],
        },
      ]

      const resolutionNeededEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'import-resolution-needed',
            payload: { pending: pendingData },
          },
        },
      })
      window.dispatchEvent(resolutionNeededEvent)
      await screen.findByText(/Event 1 of 1/i)

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /create/i }))

      const successEvent = new MessageEvent('message', {
        data: {
          pluginMessage: { type: 'import-from-yaml-success' },
        },
      })
      window.dispatchEvent(successEvent)

      await vi.waitFor(() => {
        expect(screen.queryByText(/Event 1 of 1/i)).not.toBeInTheDocument()
        expect(screen.getByPlaceholderText(/paste yaml here/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/paste yaml here/i)).toHaveValue('')
      })
    })

    it('import-from-yaml-error clears pending state and displays error', async () => {
      await expandOtherSection()

      const pendingData = [
        {
          queryName: 'FindUser',
          eventName: 'UserFound',
          kind: 'no-match' as const,
          candidates: [],
        },
      ]

      const resolutionNeededEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'import-resolution-needed',
            payload: { pending: pendingData },
          },
        },
      })
      window.dispatchEvent(resolutionNeededEvent)
      await screen.findByText(/Event 1 of 1/i)

      const errorEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'import-from-yaml-error',
            payload: { error: 'Import failed' },
          },
        },
      })
      window.dispatchEvent(errorEvent)

      await vi.waitFor(() => {
        expect(screen.queryByText(/Event 1 of 1/i)).not.toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveTextContent('Import failed')
      })
    })

    it('clears error when textarea is edited', async () => {
      const user = await expandOtherSection()

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'import-from-yaml-error',
            payload: { error: 'Some error' },
          },
        },
      })
      window.dispatchEvent(messageEvent)

      await vi.waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText(/paste yaml here/i), 's')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('clears error on successful import', async () => {
      const user = await expandOtherSection()

      // Set up an error first
      const errorEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'import-from-yaml-error',
            payload: { error: 'Some error' },
          },
        },
      })
      window.dispatchEvent(errorEvent)

      await vi.waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Type new YAML and click Import
      await user.type(screen.getByPlaceholderText(/paste yaml here/i), 'slice: Test')
      await user.click(screen.getByRole('button', { name: /^import$/i }))

      // Simulate success signal from sandbox
      const successEvent = new MessageEvent('message', {
        data: {
          pluginMessage: { type: 'import-from-yaml-success' },
        },
      })
      window.dispatchEvent(successEvent)

      await vi.waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.getByPlaceholderText(/paste yaml here/i)).toHaveValue('')
      })
    })

    it('preserves textarea content on failed import', async () => {
      const user = await expandOtherSection()

      const validYaml = 'slice: Test\nscreen:\n  type: user'
      await user.type(screen.getByPlaceholderText(/paste yaml here/i), validYaml)
      await user.click(screen.getByRole('button', { name: /^import$/i }))

      const errorEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'import-from-yaml-error',
            payload: { error: 'Invalid YAML' },
          },
        },
      })
      window.dispatchEvent(errorEvent)

      await vi.waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/paste yaml here/i)).toHaveValue(validYaml)
      })
    })

    it('disables Import button when textarea is empty', async () => {
      await expandOtherSection()
      expect(screen.getByRole('button', { name: /^import$/i })).toBeDisabled()
    })

    it('renders a copy template button in Other section', async () => {
      await expandOtherSection()
      expect(screen.getByRole('button', { name: /copy yaml template/i })).toBeInTheDocument()
    })

    it('copies YAML template to clipboard when clicked', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const user = await expandOtherSection()
      const copyButton = screen.getByRole('button', { name: /copy yaml template/i })
      await user.click(copyButton)

      expect(writeText).toHaveBeenCalledTimes(1)
      expect(writeText.mock.calls[0][0]).toMatch(/^slice: /)
    })

    it('shows "Copied!" feedback after clicking copy template', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const user = await expandOtherSection()
      const copyButton = screen.getByRole('button', { name: /copy yaml template/i })
      await user.click(copyButton)

      expect(await screen.findByText('Copied!')).toBeInTheDocument()
    })

    it('shows tooltip text "Copy YAML template" on hover', async () => {
      await expandOtherSection()
      const copyButton = screen.getByRole('button', { name: /copy yaml template/i })
      expect(copyButton).toHaveAttribute('title', 'Copy YAML template')
    })
  })

  describe('copy-element-to-yaml-result handler', () => {
    it('copies YAML to clipboard and shows success toast on success', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      renderPanel()

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'copy-element-to-yaml-result',
            payload: { yaml: 'name: TestCommand\ntype: command\n' },
          },
        },
      })
      window.dispatchEvent(messageEvent)

      await vi.waitFor(() => {
        expect(writeText).toHaveBeenCalledWith('name: TestCommand\ntype: command\n')
      })

      expect(await screen.findByText(/copied to clipboard/i)).toBeInTheDocument()
    })

    it('shows failure toast when clipboard write fails', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('denied'))
      Object.assign(navigator, { clipboard: { writeText } })

      renderPanel()

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'copy-element-to-yaml-result',
            payload: { yaml: 'name: TestCommand\ntype: command\n' },
          },
        },
      })
      window.dispatchEvent(messageEvent)

      expect(await screen.findByText(/failed to copy/i)).toBeInTheDocument()
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
