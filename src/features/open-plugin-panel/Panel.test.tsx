import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Panel } from './Panel'

describe('Panel', () => {
  it('renders the plugin title', () => {
    render(<Panel />)
    expect(screen.getByRole('heading', { name: 'Event Modeling' })).toBeInTheDocument()
  })

  it('renders Core Shapes section with buttons', () => {
    render(<Panel />)
    expect(screen.getByRole('heading', { name: 'Core Shapes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Command' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Event' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Query' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Actor' })).toBeInTheDocument()
  })

  it('renders Structural section with buttons', () => {
    render(<Panel />)
    expect(screen.getByRole('heading', { name: 'Structural' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lane' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chapter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Processor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Screen' })).toBeInTheDocument()
  })

  it('renders Sections section with buttons', () => {
    render(<Panel />)
    expect(screen.getByRole('heading', { name: 'Sections' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Slice' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'GWT' })).toBeInTheDocument()
  })

  it('renders help link', () => {
    render(<Panel />)
    const link = screen.getByRole('link', { name: /learn about event modeling/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://eventmodeling.org/')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders Command button as enabled', () => {
    render(<Panel />)
    const commandButton = screen.getByRole('button', { name: 'Command' })
    expect(commandButton).not.toBeDisabled()
  })

  it('sends create-command message to sandbox when Command button is clicked', async () => {
    const user = userEvent.setup()
    render(<Panel />)

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
    render(<Panel onCreateElement={onCreateElement} />)

    const commandButton = screen.getByRole('button', { name: 'Command' })
    await user.click(commandButton)

    expect(onCreateElement).toHaveBeenCalledWith('command')
  })

  it('renders Event button as enabled', () => {
    render(<Panel />)
    const eventButton = screen.getByRole('button', { name: 'Event' })
    expect(eventButton).not.toBeDisabled()
  })

  it('sends create-event message to sandbox when Event button is clicked', async () => {
    const user = userEvent.setup()
    render(<Panel />)

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
    render(<Panel onCreateElement={onCreateElement} />)

    const eventButton = screen.getByRole('button', { name: 'Event' })
    await user.click(eventButton)

    expect(onCreateElement).toHaveBeenCalledWith('event')
  })

  it('renders Query button as enabled', () => {
    render(<Panel />)
    const queryButton = screen.getByRole('button', { name: 'Query' })
    expect(queryButton).not.toBeDisabled()
  })

  it('sends create-query message to sandbox when Query button is clicked', async () => {
    const user = userEvent.setup()
    render(<Panel />)

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
    render(<Panel onCreateElement={onCreateElement} />)

    const queryButton = screen.getByRole('button', { name: 'Query' })
    await user.click(queryButton)

    expect(onCreateElement).toHaveBeenCalledWith('query')
  })

  it('renders Actor button as enabled', () => {
    render(<Panel />)
    const actorButton = screen.getByRole('button', { name: 'Actor' })
    expect(actorButton).not.toBeDisabled()
  })

  it('sends create-actor message to sandbox when Actor button is clicked', async () => {
    const user = userEvent.setup()
    render(<Panel />)

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
    render(<Panel onCreateElement={onCreateElement} />)

    const actorButton = screen.getByRole('button', { name: 'Actor' })
    await user.click(actorButton)

    expect(onCreateElement).toHaveBeenCalledWith('actor')
  })

  it('renders Lane button as enabled', () => {
    render(<Panel />)
    expect(screen.getByRole('button', { name: 'Lane' })).toBeEnabled()
  })

  it('sends create-lane message to sandbox when Lane button is clicked', async () => {
    const user = userEvent.setup()
    render(<Panel />)

    const laneButton = screen.getByRole('button', { name: 'Lane' })
    await user.click(laneButton)

    expect(parent.postMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'create-lane' } },
      '*'
    )
  })

  it('shows multiple selection message when multiple elements are selected', async () => {
    render(<Panel />)

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
    render(<Panel />)

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
    render(<Panel />)

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
    render(<Panel />)
    // Other buttons should still be disabled until their handlers are implemented
    expect(screen.getByRole('button', { name: 'Lane' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Chapter' })).toBeEnabled()
  })

  it('renders GWT button as enabled', () => {
    render(<Panel />)
    expect(screen.getByRole('button', { name: 'GWT' })).toBeEnabled()
  })

  it('sends create-gwt message to sandbox when GWT button is clicked', async () => {
    const user = userEvent.setup()
    render(<Panel />)

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
    render(<Panel onCreateElement={onCreateElement} />)

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
      render(<Panel />)
      expect(screen.getByRole('separator', { name: /resize/i })).toBeInTheDocument()
    })

    it('sends resize-panel message on drag', () => {
      render(<Panel />)
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
      render(<Panel />)
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
      render(<Panel />)
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
      render(<Panel />)
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
})
