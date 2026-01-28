import type { ElementType, StructuralType, SectionType } from '../../shared/types/plugin'

interface ButtonConfig {
  type: ElementType | StructuralType | SectionType
  label: string
  className: string
}

const coreShapes: ButtonConfig[] = [
  { type: 'command', label: 'Command', className: 'button-command' },
  { type: 'event', label: 'Event', className: 'button-event' },
  { type: 'query', label: 'Query', className: 'button-query' },
  { type: 'actor', label: 'Actor', className: 'button-actor' },
]

const structural: ButtonConfig[] = [
  { type: 'lane', label: 'Lane', className: 'button-lane' },
  { type: 'chapter', label: 'Chapter', className: 'button-chapter' },
  { type: 'processor', label: 'Processor', className: 'button-processor' },
  { type: 'screen', label: 'Screen', className: 'button-screen' },
]

const sections: ButtonConfig[] = [
  { type: 'slice', label: 'Slice', className: 'button-slice' },
  { type: 'gwt', label: 'GWT', className: 'button-gwt' },
]

interface ButtonGroupProps {
  title: string
  buttons: ButtonConfig[]
  onCreateElement: (type: ElementType | StructuralType | SectionType) => void
  disabled?: boolean
}

function ButtonGroup({ title, buttons, onCreateElement, disabled = false }: ButtonGroupProps) {
  return (
    <div className="section">
      <h2>{title}</h2>
      <div className="button-group">
        {buttons.map((btn) => (
          <button
            key={btn.type}
            className={`button ${btn.className}`}
            onClick={() => onCreateElement(btn.type)}
            disabled={disabled}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface PanelProps {
  onCreateElement?: (type: ElementType | StructuralType | SectionType) => void
}

export function Panel({ onCreateElement }: PanelProps) {
  const handleCreateElement = (type: ElementType | StructuralType | SectionType) => {
    if (onCreateElement) {
      onCreateElement(type)
    } else {
      // Default: send message to plugin sandbox
      parent.postMessage(
        { pluginMessage: { type: 'create-element', payload: { elementType: type } } },
        '*'
      )
    }
  }

  // TODO: Enable buttons when element creation is implemented
  const disabled = true

  return (
    <div className="container">
      <h1>Event Modeling</h1>
      <p className="description">
        Create Event Modeling diagrams in FigJam.
      </p>

      <ButtonGroup
        title="Core Shapes"
        buttons={coreShapes}
        onCreateElement={handleCreateElement}
        disabled={disabled}
      />

      <ButtonGroup
        title="Structural"
        buttons={structural}
        onCreateElement={handleCreateElement}
        disabled={disabled}
      />

      <ButtonGroup
        title="Sections"
        buttons={sections}
        onCreateElement={handleCreateElement}
        disabled={disabled}
      />

      <div className="help-link">
        <a
          href="https://eventmodeling.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn about Event Modeling
        </a>
      </div>
    </div>
  )
}
