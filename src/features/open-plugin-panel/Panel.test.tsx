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

  it('keeps other element buttons disabled', () => {
    render(<Panel />)
    // Other buttons should still be disabled until their handlers are implemented
    expect(screen.getByRole('button', { name: 'Event' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Query' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Actor' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Lane' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Chapter' })).toBeDisabled()
  })
})
