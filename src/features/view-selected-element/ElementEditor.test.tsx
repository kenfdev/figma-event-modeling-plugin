import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ElementEditor } from './ElementEditor'
import type { ElementType } from '../../shared/types/plugin'

interface SelectedElement {
  id: string
  type: ElementType
  name: string
}

describe('ElementEditor', () => {
  const createSelectedElement = (
    overrides: Partial<SelectedElement> = {}
  ): SelectedElement => ({
    id: 'test-id-123',
    type: 'command',
    name: 'Test Element',
    ...overrides,
  })

  describe('when no element is selected', () => {
    it('renders nothing when selectedElement is null', () => {
      const { container } = render(<ElementEditor selectedElement={null} />)
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('when an element is selected', () => {
    it('renders the element editor section', () => {
      render(<ElementEditor selectedElement={createSelectedElement()} />)
      expect(screen.getByRole('region', { name: /element editor/i })).toBeInTheDocument()
    })

    it('displays the element name in a text input field', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ name: 'My Command' })} />)
      const input = screen.getByRole('textbox', { name: /element name/i })
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('My Command')
    })

    it('displays type badge with correct styling class for command', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Command')
      expect(badge).toHaveClass('type-command')
    })

    it('displays type badge with correct styling class for event', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'event' })} />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Event')
      expect(badge).toHaveClass('type-event')
    })

    it('displays type badge with correct styling class for query', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'query' })} />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Query')
      expect(badge).toHaveClass('type-query')
    })

    it('displays type badge with correct styling class for actor', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'actor' })} />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Actor')
      expect(badge).toHaveClass('type-actor')
    })
  })
})
