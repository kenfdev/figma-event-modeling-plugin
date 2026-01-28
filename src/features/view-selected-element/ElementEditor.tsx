import type { ElementType } from '../../shared/types/plugin'

export interface SelectedElement {
  id: string
  type: ElementType
  name: string
}

export interface ElementEditorProps {
  selectedElement: SelectedElement | null
}

const typeLabels: Record<ElementType, string> = {
  command: 'Command',
  event: 'Event',
  query: 'Query',
  actor: 'Actor',
}

export function ElementEditor({ selectedElement }: ElementEditorProps) {
  if (!selectedElement) {
    return null
  }

  const typeLabel = typeLabels[selectedElement.type]

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
        <div className="element-editor-row">
          <label htmlFor="element-name" className="element-editor-label">
            Name
          </label>
          <input
            id="element-name"
            type="text"
            className="element-editor-input"
            value={selectedElement.name}
            aria-label="Element name"
            readOnly
          />
        </div>
      </div>
    </section>
  )
}
