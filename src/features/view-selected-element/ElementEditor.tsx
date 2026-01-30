import { useState, useEffect } from 'react'
import type { ElementType, StructuralType, SectionType } from '../../shared/types/plugin'
import { useTranslation } from '../../shared/i18n'

export interface SelectedElement {
  id: string
  type: ElementType | StructuralType | SectionType
  name: string
  customFields?: string
  notes?: string
  external?: boolean
  fieldsVisible?: boolean
  issueUrl?: string
}

export interface ElementEditorProps {
  selectedElement: SelectedElement | null
  multipleSelected?: boolean
}

const typeLabels: Record<string, string> = {
  command: 'Command',
  event: 'Event',
  query: 'Query',
  actor: 'Actor',
  lane: 'Lane',
  chapter: 'Chapter',
  processor: 'Processor',
  screen: 'Screen',
  slice: 'Slice',
  gwt: 'GWT',
}

const typesWithCustomFields: ElementType[] = ['command', 'event', 'query']
const typesWithDropdown: ElementType[] = ['command', 'event', 'query']
const structuralTypes: StructuralType[] = ['lane', 'chapter', 'processor', 'screen']

export function ElementEditor({ selectedElement, multipleSelected }: ElementEditorProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [customFields, setCustomFields] = useState('')
  const [notes, setNotes] = useState('')
  const [external, setExternal] = useState(false)
  const [fieldsVisible, setFieldsVisible] = useState(false)
  const [issueUrl, setIssueUrl] = useState('')

  useEffect(() => {
    if (selectedElement) {
      setName(selectedElement.name)
      setCustomFields(selectedElement.customFields ?? '')
      setNotes(selectedElement.notes ?? '')
      setExternal(selectedElement.external ?? false)
      setFieldsVisible(selectedElement.fieldsVisible ?? false)
      setIssueUrl(selectedElement.issueUrl ?? '')
    }
  }, [selectedElement?.id, selectedElement?.name, selectedElement?.customFields, selectedElement?.notes, selectedElement?.external, selectedElement?.fieldsVisible, selectedElement?.issueUrl])

  if (multipleSelected) {
    return (
      <section className="element-editor" aria-label="Element Editor">
        <p className="multiple-selected-message">{t('messages.multipleSelected')}</p>
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

  const handleDuplicate = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'duplicate-element',
          payload: { id: selectedElement.id },
        },
      },
      '*'
    )
  }

  const handleFieldsVisibilityToggle = () => {
    setFieldsVisible(!fieldsVisible)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'toggle-fields-visibility',
          payload: { id: selectedElement.id },
        },
      },
      '*'
    )
  }

  const handleOpenIssueUrl = () => {
    if (!issueUrl) return
    parent.postMessage(
      {
        pluginMessage: {
          type: 'open-slice-issue-url',
          payload: { url: issueUrl },
        },
      },
      '*'
    )
  }

  const handleIssueUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIssueUrl = e.target.value
    setIssueUrl(newIssueUrl)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'update-slice-issue-url',
          payload: { id: selectedElement.id, issueUrl: newIssueUrl },
        },
      },
      '*'
    )
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value
    parent.postMessage(
      {
        pluginMessage: {
          type: 'change-element-type',
          payload: { id: selectedElement.id, newType },
        },
      },
      '*'
    )
  }

  const showCustomFields = typesWithCustomFields.includes(selectedElement.type as ElementType)
  const showTypeDropdown = typesWithDropdown.includes(selectedElement.type as ElementType)
  const isStructural = structuralTypes.includes(selectedElement.type as StructuralType)

  return (
    <section className="element-editor" aria-label="Element Editor">
      <h2>{t('editor.selectedElement')}</h2>
      <div className="element-editor-content">
        <div className="element-editor-row">
          {showTypeDropdown ? (
            <select
              value={selectedElement.type}
              onChange={handleTypeChange}
              aria-label={t('editor.elementType')}
              className={`type-badge type-${selectedElement.type}`}
            >
              <option value="command">Command</option>
              <option value="event">Event</option>
              <option value="query">Query</option>
            </select>
          ) : (
            <span
              role="status"
              className={`type-badge type-${selectedElement.type}`}
            >
              {typeLabel}
            </span>
          )}
        </div>
        {selectedElement.type === 'event' && (
          <div className="element-editor-row">
            <label className="element-editor-label">
              <input
                type="checkbox"
                checked={external}
                onChange={handleExternalToggle}
                aria-label={t('editor.external')}
              />
              {' '}{t('editor.external')}
            </label>
          </div>
        )}
        <div className="element-editor-row">
          <label htmlFor="element-name" className="element-editor-label">
            {t('editor.name')}
          </label>
          <input
            id="element-name"
            type="text"
            className="element-editor-input"
            value={name}
            onChange={handleNameChange}
            aria-label="Element name"
            disabled={isStructural}
          />
        </div>
        {showCustomFields && (
          <div className="element-editor-row">
            <label htmlFor="custom-fields" className="element-editor-label">
              {t('editor.customFields')}
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
        {(showCustomFields || isStructural) && (
          <div className="element-editor-row">
            <label htmlFor="notes" className="element-editor-label">
              {t('editor.notes')}
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
        {showCustomFields && (
          <div className="element-editor-row">
            <label className="element-editor-label">
              <input
                type="checkbox"
                checked={fieldsVisible}
                onChange={handleFieldsVisibilityToggle}
                aria-label={t('editor.showFields')}
              />
              {' '}{t('editor.showFields')}
            </label>
          </div>
        )}
        {showCustomFields && (
          <div className="element-editor-row">
            <button
              type="button"
              onClick={handleDuplicate}
              aria-label={t('buttons.duplicate')}
            >
              {t('buttons.duplicate')}
            </button>
          </div>
        )}
        {selectedElement.type === 'slice' && (
          <div className="element-editor-row">
            <label htmlFor="issue-url" className="element-editor-label">
              {t('editor.issueUrl')}
            </label>
            <div className="element-editor-url-row">
              <input
                id="issue-url"
                type="text"
                className="element-editor-input"
                value={issueUrl}
                onChange={handleIssueUrlChange}
                aria-label="Issue URL"
              />
              {issueUrl && (
                <button
                  type="button"
                  className="element-editor-open-url-button"
                  onClick={handleOpenIssueUrl}
                  aria-label={`${t('editor.openInBrowser')} Issue URL`}
                  title={t('editor.openInBrowser')}
                >
                  🔗
                </button>
              )}
            </div>
          </div>
        )}
        {selectedElement.type === 'slice' && (
          <div className="element-editor-row">
            <button
              type="button"
              aria-label={t('buttons.exportToMarkdown')}
              onClick={() => {
                parent.postMessage(
                  {
                    pluginMessage: {
                      type: 'export-slice-to-markdown',
                      payload: { id: selectedElement.id },
                    },
                  },
                  '*'
                )
              }}
            >
              {t('buttons.exportToMarkdown')}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
