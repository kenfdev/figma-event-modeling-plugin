import { useState, useEffect } from 'react'
import type { ElementType } from '../../shared/types/plugin'

export interface SelectedElement {
  id: string
  type: ElementType
  name: string
  customFields?: string
  notes?: string
  external?: boolean
}

export interface ElementEditorProps {
  selectedElement: SelectedElement | null
  multipleSelected?: boolean
}

const typeLabels: Record<ElementType, string> = {
  command: 'Command',
  event: 'Event',
  query: 'Query',
  actor: 'Actor',
}

const typesWithCustomFields: ElementType[] = ['command', 'event', 'query']

export function ElementEditor({ selectedElement, multipleSelected }: ElementEditorProps) {
  const [name, setName] = useState('')
  const [customFields, setCustomFields] = useState('')
  const [notes, setNotes] = useState('')
  const [external, setExternal] = useState(false)

  useEffect(() => {
    if (selectedElement) {
      setName(selectedElement.name)
      setCustomFields(selectedElement.customFields ?? '')
      setNotes(selectedElement.notes ?? '')
      setExternal(selectedElement.external ?? false)
    }
  }, [selectedElement?.id, selectedElement?.name, selectedElement?.customFields, selectedElement?.notes, selectedElement?.external])

  if (multipleSelected) {
    return (
      <section className="element-editor" aria-label="Element Editor">
        <p className="multiple-selected-message">Multiple elements selected</p>
      </section>
    )
  }

  if (!selectedElement) {
    return null
  }

  const typeLabel = typeLabels[selectedElement.type]

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'update-element-name',
          payload: { id: selectedElement.id, name: newName },
        },
      },
      '*'
    )
  }

  const handleCustomFieldsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCustomFields = e.target.value
    setCustomFields(newCustomFields)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'update-custom-fields',
          payload: { id: selectedElement.id, customFields: newCustomFields },
        },
      },
      '*'
    )
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value
    setNotes(newNotes)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'update-notes',
          payload: { id: selectedElement.id, notes: newNotes },
        },
      },
      '*'
    )
  }

  const handleExternalToggle = () => {
    const newExternal = !external
    setExternal(newExternal)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'toggle-event-type',
          payload: { id: selectedElement.id, external: newExternal },
        },
      },
      '*'
    )
  }

  const showCustomFields = typesWithCustomFields.includes(selectedElement.type)

  return (
    <section className="element-editor" aria-label="Element Editor">
      <h2>Selected Element</h2>
      <div className="element-editor-content">
        <div className="element-editor-row">
          <span
            role="status"
            className={`type-badge type-${selectedElement.type}`}
          >
            {typeLabel}
          </span>
        </div>
        {selectedElement.type === 'event' && (
          <div className="element-editor-row">
            <label className="element-editor-label">
              <input
                type="checkbox"
                checked={external}
                onChange={handleExternalToggle}
                aria-label="External"
              />
              {' '}External
            </label>
          </div>
        )}
        <div className="element-editor-row">
          <label htmlFor="element-name" className="element-editor-label">
            Name
          </label>
          <input
            id="element-name"
            type="text"
            className="element-editor-input"
            value={name}
            onChange={handleNameChange}
            aria-label="Element name"
          />
        </div>
        {showCustomFields && (
          <div className="element-editor-row">
            <label htmlFor="custom-fields" className="element-editor-label">
              Custom Fields
            </label>
            <textarea
              id="custom-fields"
              className="element-editor-textarea"
              value={customFields}
              onChange={handleCustomFieldsChange}
              aria-label="Custom fields"
            />
          </div>
        )}
        {showCustomFields && (
          <div className="element-editor-row">
            <label htmlFor="notes" className="element-editor-label">
              Notes
            </label>
            <textarea
              id="notes"
              className="element-editor-textarea"
              value={notes}
              onChange={handleNotesChange}
              aria-label="Notes"
            />
          </div>
        )}
      </div>
    </section>
  )
}
