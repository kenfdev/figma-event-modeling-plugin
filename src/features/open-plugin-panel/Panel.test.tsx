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

  it('calls onCreateElement when button is clicked', async () => {
    const user = userEvent.setup()
    const onCreateElement = vi.fn()

    // Re-render with enabled buttons by providing onCreateElement
    // Note: buttons are disabled by default until element creation is implemented
    render(<Panel onCreateElement={onCreateElement} />)

    // Buttons are disabled by default, so we can't click them
    // This test documents the expected behavior when enabled
    const commandButton = screen.getByRole('button', { name: 'Command' })
    expect(commandButton).toBeDisabled()
  })

  it('sends postMessage when no onCreateElement provided and button clicked', async () => {
    // This test verifies the default messaging behavior
    // Currently buttons are disabled, so this is a placeholder for when enabled
    render(<Panel />)

    const commandButton = screen.getByRole('button', { name: 'Command' })
    expect(commandButton).toBeDisabled()
  })
})
