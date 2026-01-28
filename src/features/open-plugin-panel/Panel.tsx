import { useEffect, useState } from 'react'
import type { ElementType, StructuralType, SectionType } from '../../shared/types/plugin'

type EditorType = 'figma' | 'figjam' | null

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
  enabledTypes: Set<string>
}

function ButtonGroup({ title, buttons, onCreateElement, enabledTypes }: ButtonGroupProps) {
  return (
    <div className="section">
      <h2>{title}</h2>
      <div className="button-group">
        {buttons.map((btn) => (
          <button
            key={btn.type}
            className={`button ${btn.className}`}
            onClick={() => onCreateElement(btn.type)}
            disabled={!enabledTypes.has(btn.type)}
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
  const [editorType, setEditorType] = useState<EditorType>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data?.pluginMessage
      if (message?.type === 'platform-detected') {
        setEditorType(message.payload?.editorType)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleCreateElement = (type: ElementType | StructuralType | SectionType) => {
    if (onCreateElement) {
      onCreateElement(type)
    }

    // Send type-specific message to plugin sandbox
    const messageTypeMap: Partial<Record<ElementType | StructuralType | SectionType, string>> = {
      command: 'create-command',
    }

    const messageType = messageTypeMap[type]
    if (messageType) {
      parent.postMessage({ pluginMessage: { type: messageType } }, '*')
    }
  }

  // Types with implemented handlers
  const enabledTypes = new Set<string>(['command'])
  const isFigmaDesign = editorType === 'figma'

  return (
    <div className="container">
      <h1>Event Modeling</h1>

      {isFigmaDesign ? (
        <div role="alert" className="error-message">
          This plugin only works in FigJam. Please open a FigJam file to use this plugin.
        </div>
      ) : (
        <>
          <p className="description">
            Create Event Modeling diagrams in FigJam.
          </p>

          <ButtonGroup
            title="Core Shapes"
            buttons={coreShapes}
            onCreateElement={handleCreateElement}
            enabledTypes={enabledTypes}
          />

          <ButtonGroup
            title="Structural"
            buttons={structural}
            onCreateElement={handleCreateElement}
            enabledTypes={enabledTypes}
          />

          <ButtonGroup
            title="Sections"
            buttons={sections}
            onCreateElement={handleCreateElement}
            enabledTypes={enabledTypes}
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
        </>
      )}
    </div>
  )
}
