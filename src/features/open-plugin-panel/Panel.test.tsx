import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('keeps other element buttons disabled', () => {
    render(<Panel />)
    // Other buttons should still be disabled until their handlers are implemented
    expect(screen.getByRole('button', { name: 'Actor' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Lane' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Chapter' })).toBeDisabled()
  })
})
