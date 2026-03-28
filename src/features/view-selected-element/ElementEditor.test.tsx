import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ElementEditor } from './ElementEditor'
import type { ElementType, StructuralType, SectionType } from '../../shared/types/plugin'
import { TranslationProvider } from '../../shared/i18n'

interface SelectedElement {
  id: string
  type: ElementType | StructuralType | SectionType
  name: string
  customFields?: string
  notes?: string
  external?: boolean
  issueUrl?: string
  pluginData?: Record<string, string>
}

function renderEditor(ui: React.ReactElement) {
  return render(
    <TranslationProvider initialLocale="en">
      {ui}
    </TranslationProvider>
  )
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
      renderEditor(<ElementEditor selectedElement={null} multipleSelected={true} />)
      expect(screen.getByText(/multiple elements selected/i)).toBeInTheDocument()
    })

    it('does not show editable fields', () => {
      renderEditor(<ElementEditor selectedElement={null} multipleSelected={true} />)
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  describe('when no element is selected', () => {
    it('renders nothing when selectedElement is null', () => {
      const { container } = renderEditor(<ElementEditor selectedElement={null} />)
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('when an element is selected', () => {
    it('renders the element editor section', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement()} />)
      expect(screen.getByRole('region', { name: /element editor/i })).toBeInTheDocument()
    })

    it('displays the element name in a text input field', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ name: 'My Command' })} />)
      const input = screen.getByRole('textbox', { name: /element name/i })
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('My Command')
    })

    it('displays type dropdown for command elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      const dropdown = screen.getByRole('combobox', { name: /element type/i })
      expect(dropdown).toBeInTheDocument()
      expect(dropdown).toHaveValue('command')
    })

    it('displays type dropdown for event elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'event' })} />)
      const dropdown = screen.getByRole('combobox', { name: /element type/i })
      expect(dropdown).toBeInTheDocument()
      expect(dropdown).toHaveValue('event')
    })

    it('displays type dropdown for query elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'query' })} />)
      const dropdown = screen.getByRole('combobox', { name: /element type/i })
      expect(dropdown).toBeInTheDocument()
      expect(dropdown).toHaveValue('query')
    })

    it('type dropdown contains Command, Event, Query options', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      const dropdown = screen.getByRole('combobox', { name: /element type/i })
      const options = Array.from(dropdown.querySelectorAll('option'))
      expect(options).toHaveLength(3)
      expect(options.map(o => o.value)).toEqual(['command', 'event', 'query'])
    })

    it('does NOT show type dropdown for actor elements — shows badge instead', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'actor' })} />)
      expect(screen.queryByRole('combobox', { name: /element type/i })).not.toBeInTheDocument()
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Actor')
      expect(badge).toHaveClass('type-actor')
    })

    it('displays type badge with correct styling class for lane', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'lane' as StructuralType })} />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Lane')
      expect(badge).toHaveClass('type-lane')
    })

    it('displays type badge with correct styling class for chapter', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'chapter' as StructuralType })} />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Chapter')
      expect(badge).toHaveClass('type-chapter')
    })

    it('displays type badge with correct styling class for processor', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'processor' as StructuralType })} />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Processor')
      expect(badge).toHaveClass('type-processor')
    })

    it('displays type badge with correct styling class for screen', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'screen' as StructuralType })} />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Screen')
      expect(badge).toHaveClass('type-screen')
    })

    it('displays type badge with correct styling class for slice', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'slice' as SectionType })} />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Slice')
      expect(badge).toHaveClass('type-slice')
    })

    it('displays type badge with correct styling class for gwt', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'gwt' as SectionType })} />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('GWT')
      expect(badge).toHaveClass('type-gwt')
    })

    it('allows editing the name field', async () => {
      const user = userEvent.setup()
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ name: 'Original' })} />)
      const input = screen.getByRole('textbox', { name: /element name/i })

      await user.clear(input)
      await user.type(input, 'Updated Name')

      expect(input).toHaveValue('Updated Name')
    })

    it('sends update-element-name message to sandbox when name changes', async () => {
      const user = userEvent.setup()
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ id: 'node-42', name: 'Original' })} />)
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
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      expect(screen.getByRole('textbox', { name: /custom fields/i })).toBeInTheDocument()
    })

    it('shows custom fields textarea for event elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'event' })} />)
      expect(screen.getByRole('textbox', { name: /custom fields/i })).toBeInTheDocument()
    })

    it('shows custom fields textarea for query elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'query' })} />)
      expect(screen.getByRole('textbox', { name: /custom fields/i })).toBeInTheDocument()
    })

    it('does NOT show custom fields textarea for actor elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'actor' })} />)
      expect(screen.queryByRole('textbox', { name: /custom fields/i })).not.toBeInTheDocument()
    })

    it('accepts free-form text input', async () => {
      const user = userEvent.setup()
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      const textarea = screen.getByRole('textbox', { name: /custom fields/i })

      await user.type(textarea, 'userId: string\namount: number')

      expect(textarea).toHaveValue('userId: string\namount: number')
    })

    it('displays existing custom fields from selected element', () => {
      renderEditor(
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
      renderEditor(
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
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      expect(screen.getByRole('textbox', { name: /notes/i })).toBeInTheDocument()
    })

    it('shows notes textarea for event elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'event' })} />)
      expect(screen.getByRole('textbox', { name: /notes/i })).toBeInTheDocument()
    })

    it('shows notes textarea for query elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'query' })} />)
      expect(screen.getByRole('textbox', { name: /notes/i })).toBeInTheDocument()
    })

    it('does NOT show notes textarea for actor elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'actor' })} />)
      expect(screen.queryByRole('textbox', { name: /^notes$/i })).not.toBeInTheDocument()
    })

    it('displays existing notes from selected element', () => {
      renderEditor(
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
      renderEditor(
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
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'event' })} />)
      expect(screen.getByRole('checkbox', { name: /external/i })).toBeInTheDocument()
    })

    it('does NOT show toggle for command elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      expect(screen.queryByRole('checkbox', { name: /external/i })).not.toBeInTheDocument()
    })

    it('does NOT show toggle for query elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'query' })} />)
      expect(screen.queryByRole('checkbox', { name: /external/i })).not.toBeInTheDocument()
    })

    it('does NOT show toggle for actor elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'actor' })} />)
      expect(screen.queryByRole('checkbox', { name: /external/i })).not.toBeInTheDocument()
    })

    it('toggle is unchecked when external is false (internal)', () => {
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'event', external: false })}
        />
      )
      const toggle = screen.getByRole('checkbox', { name: /external/i })
      expect(toggle).not.toBeChecked()
    })

    it('toggle is checked when external is true', () => {
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'event', external: true })}
        />
      )
      const toggle = screen.getByRole('checkbox', { name: /external/i })
      expect(toggle).toBeChecked()
    })

    it('sends toggle-event-type message to sandbox when toggled', async () => {
      const user = userEvent.setup()
      renderEditor(
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
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'slice' as ElementType })}
        />
      )
      expect(screen.getByRole('textbox', { name: /issue url/i })).toBeInTheDocument()
    })

    it('does NOT show issue URL field for command elements', () => {
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'command' })}
        />
      )
      expect(screen.queryByRole('textbox', { name: /issue url/i })).not.toBeInTheDocument()
    })

    it('does NOT show issue URL field for event elements', () => {
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'event' })}
        />
      )
      expect(screen.queryByRole('textbox', { name: /issue url/i })).not.toBeInTheDocument()
    })

    it('displays existing issue URL from selected element', () => {
      renderEditor(
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
      renderEditor(
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
      renderEditor(
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

  describe('duplicate button', () => {
    it('shows duplicate button for command elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument()
    })

    it('shows duplicate button for event elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'event' })} />)
      expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument()
    })

    it('shows duplicate button for query elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'query' })} />)
      expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument()
    })

    it('does NOT show duplicate button for actor elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'actor' })} />)
      expect(screen.queryByRole('button', { name: /duplicate/i })).not.toBeInTheDocument()
    })

    it('does NOT show duplicate button for slice elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'slice' as ElementType })} />)
      expect(screen.queryByRole('button', { name: /duplicate/i })).not.toBeInTheDocument()
    })

    it('sends duplicate-element message to sandbox when clicked', async () => {
      const user = userEvent.setup()
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ id: 'node-101', type: 'command' })}
        />
      )
      const button = screen.getByRole('button', { name: /duplicate/i })

      await user.click(button)

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'duplicate-element',
            payload: { id: 'node-101' },
          },
        },
        '*'
      )
    })
  })

  describe('export button', () => {
    it('shows export button when a slice is selected', () => {
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'slice' as ElementType })}
        />
      )
      expect(screen.getByRole('button', { name: /export to markdown/i })).toBeInTheDocument()
    })

    it('does NOT show export button for command elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'command' })} />)
      expect(screen.queryByRole('button', { name: /export to markdown/i })).not.toBeInTheDocument()
    })

    it('does NOT show export button for event elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'event' })} />)
      expect(screen.queryByRole('button', { name: /export to markdown/i })).not.toBeInTheDocument()
    })

    it('does NOT show export button for query elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'query' })} />)
      expect(screen.queryByRole('button', { name: /export to markdown/i })).not.toBeInTheDocument()
    })

    it('does NOT show export button for actor elements', () => {
      renderEditor(<ElementEditor selectedElement={createSelectedElement({ type: 'actor' })} />)
      expect(screen.queryByRole('button', { name: /export to markdown/i })).not.toBeInTheDocument()
    })

    it('does NOT show export button when no element is selected', () => {
      const { container } = renderEditor(<ElementEditor selectedElement={null} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('does NOT show export button when multiple elements are selected', () => {
      renderEditor(<ElementEditor selectedElement={null} multipleSelected={true} />)
      expect(screen.queryByRole('button', { name: /export to markdown/i })).not.toBeInTheDocument()
    })
  })

  describe('change element type dropdown', () => {
    it('sends change-element-type message when type is changed', async () => {
      const user = userEvent.setup()
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ id: 'node-200', type: 'command' })}
        />
      )
      const dropdown = screen.getByRole('combobox', { name: /element type/i })

      await user.selectOptions(dropdown, 'event')

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'change-element-type',
            payload: { id: 'node-200', newType: 'event' },
          },
        },
        '*'
      )
    })

    it('does NOT show type dropdown for structural elements', () => {
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'lane' as StructuralType })}
        />
      )
      expect(screen.queryByRole('combobox', { name: /element type/i })).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Lane')
    })

    it('does NOT show type dropdown for section elements', () => {
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'slice' as SectionType })}
        />
      )
      expect(screen.queryByRole('combobox', { name: /element type/i })).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Slice')
    })
  })

  describe('structural element behavior', () => {
    it.each(['lane', 'chapter', 'processor', 'screen'] as StructuralType[])(
      'shows name field as read-only for %s elements',
      (structuralType) => {
        renderEditor(
          <ElementEditor
            selectedElement={createSelectedElement({ type: structuralType, name: 'My Element' })}
          />
        )
        const input = screen.getByRole('textbox', { name: /element name/i })
        expect(input).toBeInTheDocument()
        expect(input).toHaveValue('My Element')
        expect(input).toBeDisabled()
      }
    )

    it.each(['lane', 'chapter', 'processor', 'screen'] as StructuralType[])(
      'does NOT show custom fields textarea for %s elements',
      (structuralType) => {
        renderEditor(
          <ElementEditor
            selectedElement={createSelectedElement({ type: structuralType })}
          />
        )
        expect(screen.queryByRole('textbox', { name: /custom fields/i })).not.toBeInTheDocument()
      }
    )

    it.each(['lane', 'chapter', 'processor', 'screen'] as StructuralType[])(
      'shows editable notes textarea for %s elements',
      (structuralType) => {
        renderEditor(
          <ElementEditor
            selectedElement={createSelectedElement({ type: structuralType, notes: 'Some notes' })}
          />
        )
        const textarea = screen.getByRole('textbox', { name: /notes/i })
        expect(textarea).toBeInTheDocument()
        expect(textarea).toHaveValue('Some notes')
        expect(textarea).not.toBeDisabled()
      }
    )

    it('sends update-notes message when notes change on a structural element', async () => {
      const user = userEvent.setup()
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ id: 'node-lane-1', type: 'lane' as StructuralType })}
        />
      )
      const textarea = screen.getByRole('textbox', { name: /notes/i })

      await user.type(textarea, 'Lane note')

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'update-notes',
            payload: { id: 'node-lane-1', notes: 'Lane note' },
          },
        },
        '*'
      )
    })

    it('name field is editable for non-structural element types', () => {
      renderEditor(
        <ElementEditor
          selectedElement={createSelectedElement({ type: 'command', name: 'My Command' })}
        />
      )
      const input = screen.getByRole('textbox', { name: /element name/i })
      expect(input).not.toBeDisabled()
    })
  })

  describe('Visual/Raw toggle', () => {
    const pluginData: Record<string, string> = {
      type: 'command',
      customFields: 'field1\nfield2',
      notes: 'some notes',
    }

    const elementWithPluginData = (): SelectedElement =>
      createSelectedElement({ pluginData })

    it('shows Visual/Raw toggle when a single element is selected', () => {
      renderEditor(
        <ElementEditor selectedElement={elementWithPluginData()} />
      )
      expect(screen.getByRole('tab', { name: /visual/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /raw/i })).toBeInTheDocument()
    })

    it('defaults to Visual mode', () => {
      renderEditor(
        <ElementEditor selectedElement={elementWithPluginData()} />
      )
      const visualTab = screen.getByRole('tab', { name: /visual/i })
      expect(visualTab).toHaveAttribute('aria-selected', 'true')
    })

    it('shows the normal editor content in Visual mode', () => {
      renderEditor(
        <ElementEditor selectedElement={elementWithPluginData()} />
      )
      expect(screen.getByRole('textbox', { name: /element name/i })).toBeInTheDocument()
    })

    it('switches to Raw mode when Raw tab is clicked', async () => {
      const user = userEvent.setup()
      renderEditor(
        <ElementEditor selectedElement={elementWithPluginData()} />
      )
      await user.click(screen.getByRole('tab', { name: /raw/i }))
      const rawTab = screen.getByRole('tab', { name: /raw/i })
      expect(rawTab).toHaveAttribute('aria-selected', 'true')
    })

    it('displays formatted JSON in Raw mode', async () => {
      const user = userEvent.setup()
      renderEditor(
        <ElementEditor selectedElement={elementWithPluginData()} />
      )
      await user.click(screen.getByRole('tab', { name: /raw/i }))
      const expectedJson = JSON.stringify({ ...pluginData, name: 'Test Element' }, null, 2)
      expect(screen.getByText(expectedJson)).toBeInTheDocument()
    })

    it('renders JSON in a pre element for read-only display', async () => {
      const user = userEvent.setup()
      renderEditor(
        <ElementEditor selectedElement={elementWithPluginData()} />
      )
      await user.click(screen.getByRole('tab', { name: /raw/i }))
      const preElement = screen.getByText(JSON.stringify({ ...pluginData, name: 'Test Element' }, null, 2)).closest('pre')
      expect(preElement).toBeInTheDocument()
    })

    it('hides normal editor content in Raw mode', async () => {
      const user = userEvent.setup()
      renderEditor(
        <ElementEditor selectedElement={elementWithPluginData()} />
      )
      await user.click(screen.getByRole('tab', { name: /raw/i }))
      expect(screen.queryByRole('textbox', { name: /element name/i })).not.toBeInTheDocument()
    })

    it('switches back to Visual mode when Visual tab is clicked', async () => {
      const user = userEvent.setup()
      renderEditor(
        <ElementEditor selectedElement={elementWithPluginData()} />
      )
      await user.click(screen.getByRole('tab', { name: /raw/i }))
      await user.click(screen.getByRole('tab', { name: /visual/i }))
      expect(screen.getByRole('textbox', { name: /element name/i })).toBeInTheDocument()
    })

    it('resets mode to Visual when selection changes', async () => {
      const user = userEvent.setup()
      const { rerender } = renderEditor(
        <ElementEditor selectedElement={elementWithPluginData()} />
      )
      await user.click(screen.getByRole('tab', { name: /raw/i }))
      // Verify we're in raw mode
      expect(screen.queryByRole('textbox', { name: /element name/i })).not.toBeInTheDocument()

      // Selection changes to a different element
      rerender(
        <TranslationProvider initialLocale="en">
          <ElementEditor
            selectedElement={createSelectedElement({ id: 'different-id', pluginData: { type: 'event' } })}
          />
        </TranslationProvider>
      )
      // Should reset to visual mode
      expect(screen.getByRole('textbox', { name: /element name/i })).toBeInTheDocument()
      const visualTab = screen.getByRole('tab', { name: /visual/i })
      expect(visualTab).toHaveAttribute('aria-selected', 'true')
    })

    it('does not show toggle when no element is selected', () => {
      renderEditor(
        <ElementEditor selectedElement={null} />
      )
      expect(screen.queryByRole('tab', { name: /visual/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: /raw/i })).not.toBeInTheDocument()
    })

    it('does not show toggle when multiple elements are selected', () => {
      renderEditor(
        <ElementEditor selectedElement={null} multipleSelected={true} />
      )
      expect(screen.queryByRole('tab', { name: /visual/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: /raw/i })).not.toBeInTheDocument()
    })
  })
})
