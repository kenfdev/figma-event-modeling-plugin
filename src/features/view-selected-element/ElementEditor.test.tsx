import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ElementEditor } from './ElementEditor'
import type { ElementType, SectionType } from '../../shared/types/plugin'

interface SelectedElement {
  id: string
  type: ElementType | SectionType
  name: string
  customFields?: string
  notes?: string
  external?: boolean
  fieldsVisible?: boolean
  issueUrl?: string
}

describe('ElementEditor', () => {
  const postMessageSpy = vi.fn()

  beforeEach(() => {
    postMessageSpy.mockClear()
    vi.stubGlobal('parent', { postMessage: postMessageSpy })
  })

  const createSelectedElement = (
    overrides: Partial<SelectedElement> = {}
  ): SelectedElement => ({
    id: 'test-id-123',
    type: 'command',
    name: 'Test Element',
    ...overrides,
  })

  describe('when multiple elements are selected', () => {
    it('shows "Multiple elements selected" message', () => {
      render(<ElementEditor selectedElement={null} multipleSelected={true} />)
      expect(screen.getByText(/multiple elements selected/i)).toBeInTheDocument()
    })

    it('does not show editable fields', () => {
      render(<ElementEditor selectedElement={null} multipleSelected={true} />)
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
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

    it('allows editing the name field', async () => {
      const user = userEvent.setup()
      render(<ElementEditor selectedElement={createSelectedElement({ name: 'Original' })} />)
      const input = screen.getByRole('textbox', { name: /element name/i })

      await user.clear(input)
      await user.type(input, 'Updated Name')

      expect(input).toHaveValue('Updated Name')
    })

    it('sends update-element-name message to sandbox when name changes', async () => {
      const user = userEvent.setup()
      render(<ElementEditor selectedElement={createSelectedElement({ id: 'node-42', name: 'Original' })} />)
      const input = screen.getByRole('textbox', { name: /element name/i })

      await user.clear(input)
      await user.type(input, 'New Name')

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'update-element-name',
            payload: { id: 'node-42', name: 'New Name' },
          },
        },
        '*'
      )
    })
  })

  describe('custom fields textarea', () => {
    it('shows custom fields textarea for command elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      expect(screen.getByRole('textbox', { name: /custom fields/i })).toBeInTheDocument()
    })

    it('shows custom fields textarea for event elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'event' })} />)
      expect(screen.getByRole('textbox', { name: /custom fields/i })).toBeInTheDocument()
    })

    it('shows custom fields textarea for query elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'query' })} />)
      expect(screen.getByRole('textbox', { name: /custom fields/i })).toBeInTheDocument()
    })

    it('does NOT show custom fields textarea for actor elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'actor' })} />)
      expect(screen.queryByRole('textbox', { name: /custom fields/i })).not.toBeInTheDocument()
    })

    it('accepts free-form text input', async () => {
      const user = userEvent.setup()
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      const textarea = screen.getByRole('textbox', { name: /custom fields/i })

      await user.type(textarea, 'userId: string\namount: number')

      expect(textarea).toHaveValue('userId: string\namount: number')
    })

    it('displays existing custom fields from selected element', () => {
      render(
        <ElementEditor
          selectedElement={createSelectedElement({
            type: 'event',
            customFields: 'orderId: string\nstatus: string',
          })}
        />
      )
      const textarea = screen.getByRole('textbox', { name: /custom fields/i })
      expect(textarea).toHaveValue('orderId: string\nstatus: string')
    })

    it('sends update-custom-fields message to sandbox when custom fields change', async () => {
      const user = userEvent.setup()
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ id: 'node-99', type: 'command' })}
        />
      )
      const textarea = screen.getByRole('textbox', { name: /custom fields/i })

      await user.type(textarea, 'name: string')

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'update-custom-fields',
            payload: { id: 'node-99', customFields: 'name: string' },
          },
        },
        '*'
      )
    })
  })

  describe('notes textarea', () => {
    it('shows notes textarea for command elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      expect(screen.getByRole('textbox', { name: /notes/i })).toBeInTheDocument()
    })

    it('shows notes textarea for event elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'event' })} />)
      expect(screen.getByRole('textbox', { name: /notes/i })).toBeInTheDocument()
    })

    it('shows notes textarea for query elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'query' })} />)
      expect(screen.getByRole('textbox', { name: /notes/i })).toBeInTheDocument()
    })

    it('does NOT show notes textarea for actor elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'actor' })} />)
      expect(screen.queryByRole('textbox', { name: /^notes$/i })).not.toBeInTheDocument()
    })

    it('displays existing notes from selected element', () => {
      render(
        <ElementEditor
          selectedElement={createSelectedElement({
            type: 'event',
            notes: 'Important note about this event',
          })}
        />
      )
      const textarea = screen.getByRole('textbox', { name: /notes/i })
      expect(textarea).toHaveValue('Important note about this event')
    })

    it('sends update-notes message to sandbox when notes change', async () => {
      const user = userEvent.setup()
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ id: 'node-55', type: 'command' })}
        />
      )
      const textarea = screen.getByRole('textbox', { name: /^notes$/i })

      await user.type(textarea, 'A note')

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'update-notes',
            payload: { id: 'node-55', notes: 'A note' },
          },
        },
        '*'
      )
    })
  })

  describe('event type toggle', () => {
    it('shows toggle only for event elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'event' })} />)
      expect(screen.getByRole('checkbox', { name: /external/i })).toBeInTheDocument()
    })

    it('does NOT show toggle for command elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      expect(screen.queryByRole('checkbox', { name: /external/i })).not.toBeInTheDocument()
    })

    it('does NOT show toggle for query elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'query' })} />)
      expect(screen.queryByRole('checkbox', { name: /external/i })).not.toBeInTheDocument()
    })

    it('does NOT show toggle for actor elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'actor' })} />)
      expect(screen.queryByRole('checkbox', { name: /external/i })).not.toBeInTheDocument()
    })

    it('toggle is unchecked when external is false (internal)', () => {
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'event', external: false })}
        />
      )
      const toggle = screen.getByRole('checkbox', { name: /external/i })
      expect(toggle).not.toBeChecked()
    })

    it('toggle is checked when external is true', () => {
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'event', external: true })}
        />
      )
      const toggle = screen.getByRole('checkbox', { name: /external/i })
      expect(toggle).toBeChecked()
    })

    it('sends toggle-event-type message to sandbox when toggled', async () => {
      const user = userEvent.setup()
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ id: 'node-77', type: 'event', external: false })}
        />
      )
      const toggle = screen.getByRole('checkbox', { name: /external/i })

      await user.click(toggle)

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'toggle-event-type',
            payload: { id: 'node-77', external: true },
          },
        },
        '*'
      )
    })
  })

  describe('issue URL field', () => {
    it('shows issue URL field when slice is selected', () => {
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'slice' as ElementType })}
        />
      )
      expect(screen.getByRole('textbox', { name: /issue url/i })).toBeInTheDocument()
    })

    it('does NOT show issue URL field for command elements', () => {
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'command' })}
        />
      )
      expect(screen.queryByRole('textbox', { name: /issue url/i })).not.toBeInTheDocument()
    })

    it('does NOT show issue URL field for event elements', () => {
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'event' })}
        />
      )
      expect(screen.queryByRole('textbox', { name: /issue url/i })).not.toBeInTheDocument()
    })

    it('displays existing issue URL from selected element', () => {
      render(
        <ElementEditor
          selectedElement={createSelectedElement({
            type: 'slice' as ElementType,
            issueUrl: 'https://github.com/issues/456',
          })}
        />
      )
      const input = screen.getByRole('textbox', { name: /issue url/i })
      expect(input).toHaveValue('https://github.com/issues/456')
    })

    it('sends update-slice-issue-url message to sandbox when issue URL changes', async () => {
      const user = userEvent.setup()
      render(
        <ElementEditor
          selectedElement={createSelectedElement({
            id: 'node-slice-1',
            type: 'slice' as ElementType,
          })}
        />
      )
      const input = screen.getByRole('textbox', { name: /issue url/i })

      await user.type(input, 'https://jira.com/PROJ-1')

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'update-slice-issue-url',
            payload: { id: 'node-slice-1', issueUrl: 'https://jira.com/PROJ-1' },
          },
        },
        '*'
      )
    })

    it('allows clearing the issue URL', async () => {
      const user = userEvent.setup()
      render(
        <ElementEditor
          selectedElement={createSelectedElement({
            id: 'node-slice-2',
            type: 'slice' as ElementType,
            issueUrl: 'https://github.com/issues/123',
          })}
        />
      )
      const input = screen.getByRole('textbox', { name: /issue url/i })

      await user.clear(input)

      expect(input).toHaveValue('')
      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'update-slice-issue-url',
            payload: { id: 'node-slice-2', issueUrl: '' },
          },
        },
        '*'
      )
    })
  })

  describe('fields visibility toggle', () => {
    it('shows toggle for command elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      expect(screen.getByRole('checkbox', { name: /show fields/i })).toBeInTheDocument()
    })

    it('shows toggle for event elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'event' })} />)
      expect(screen.getByRole('checkbox', { name: /show fields/i })).toBeInTheDocument()
    })

    it('shows toggle for query elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'query' })} />)
      expect(screen.getByRole('checkbox', { name: /show fields/i })).toBeInTheDocument()
    })

    it('does NOT show toggle for actor elements', () => {
      render(<ElementEditor selectedElement={createSelectedElement({ type: 'actor' })} />)
      expect(screen.queryByRole('checkbox', { name: /show fields/i })).not.toBeInTheDocument()
    })

    it('toggle is unchecked when fieldsVisible is false', () => {
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'command', fieldsVisible: false })}
        />
      )
      const toggle = screen.getByRole('checkbox', { name: /show fields/i })
      expect(toggle).not.toBeChecked()
    })

    it('toggle is checked when fieldsVisible is true', () => {
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'command', fieldsVisible: true })}
        />
      )
      const toggle = screen.getByRole('checkbox', { name: /show fields/i })
      expect(toggle).toBeChecked()
    })

    it('toggle defaults to unchecked when fieldsVisible is undefined', () => {
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'command' })}
        />
      )
      const toggle = screen.getByRole('checkbox', { name: /show fields/i })
      expect(toggle).not.toBeChecked()
    })

    it('sends toggle-fields-visibility message to sandbox when toggled', async () => {
      const user = userEvent.setup()
      render(
        <ElementEditor
          selectedElement={createSelectedElement({ id: 'node-88', type: 'command', fieldsVisible: false })}
        />
      )
      const toggle = screen.getByRole('checkbox', { name: /show fields/i })

      await user.click(toggle)

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'toggle-fields-visibility',
            payload: { id: 'node-88' },
          },
        },
        '*'
      )
    })
  })
})
