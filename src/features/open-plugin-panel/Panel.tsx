import { useCallback, useEffect, useRef, useState } from 'react'
import type { ElementType, StructuralType, SectionType } from '../../shared/types/plugin'
import { ElementEditor, type SelectedElement } from '../view-selected-element'
import { useTranslation, type Locale } from '../../shared/i18n'

type EditorType = 'figma' | 'figjam' | null

interface ButtonConfig {
  type: ElementType | StructuralType | SectionType
  label: string
  className: string
  previewColor: string
}

const coreShapes: ButtonConfig[] = [
  { type: 'command', label: 'Command', className: 'button-command', previewColor: '#3DADFF' },
  { type: 'event', label: 'Event', className: 'button-event', previewColor: '#FF9E42' },
  { type: 'query', label: 'Query', className: 'button-query', previewColor: '#7ED321' },
  { type: 'actor', label: 'Actor', className: 'button-actor', previewColor: '#50E3C2' },
]

const structural: ButtonConfig[] = [
  { type: 'lane', label: 'Lane', className: 'button-lane', previewColor: '#C0C0C0' },
  { type: 'chapter', label: 'Chapter', className: 'button-chapter', previewColor: '#00BCD4' },
  { type: 'processor', label: 'Processor', className: 'button-processor', previewColor: '#333333' },
  { type: 'screen', label: 'Screen', className: 'button-screen', previewColor: '#808080' },
]

const sections: ButtonConfig[] = [
  { type: 'slice', label: 'Slice', className: 'button-slice', previewColor: '#E91E63' },
  { type: 'gwt', label: 'GWT', className: 'button-gwt', previewColor: '#FF5722' },
]

interface ButtonGroupProps {
  title: string
  buttons: ButtonConfig[]
  onCreateElement: (type: ElementType | StructuralType | SectionType) => void
  enabledTypes: Set<string>
  collapsed: boolean
  onToggle: () => void
}

function ButtonGroup({ title, buttons, onCreateElement, enabledTypes, collapsed, onToggle }: ButtonGroupProps) {
  return (
    <div className="section">
      <h2 onClick={onToggle} style={{ cursor: 'pointer' }}>{collapsed ? '▸' : '▾'} {title}</h2>
      {!collapsed && (
        <div className="button-group card-grid">
          {buttons.map((btn) => (
            <button
              key={btn.type}
              className={`button card-button ${btn.className}`}
              style={{ backgroundColor: btn.previewColor }}
              onClick={() => onCreateElement(btn.type)}
              disabled={!enabledTypes.has(btn.type)}
            >
              <span className="card-label">{btn.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }
  // Fallback for environments where Clipboard API is unavailable (e.g. Figma plugin iframe)
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    return Promise.resolve()
  } catch {
    return Promise.reject(new Error('Copy failed'))
  } finally {
    document.body.removeChild(textarea)
  }
}

const MIN_WIDTH = 240
const MIN_HEIGHT = 300

function ResizeHandle() {
  const dragging = useRef<{ startX: number; startY: number; initW: number; initH: number } | null>(null)

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return
    const { startX, startY, initW, initH } = dragging.current
    const width = Math.max(MIN_WIDTH, initW + (e.clientX - startX))
    const height = Math.max(MIN_HEIGHT, initH + (e.clientY - startY))
    parent.postMessage({ pluginMessage: { type: 'resize-panel', payload: { width, height } } }, '*')
  }, [])

  const onPointerUp = useCallback(() => {
    dragging.current = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }, [onPointerMove])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = {
      startX: e.clientX,
      startY: e.clientY,
      initW: window.innerWidth,
      initH: window.innerHeight,
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }, [onPointerMove, onPointerUp])

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [onPointerMove, onPointerUp])

  return (
    <div
      role="separator"
      aria-label="Resize handle"
      className="resize-handle"
      onPointerDown={onPointerDown}
    />
  )
}

interface SettingsPanelProps {
  onBack: () => void
}

function SettingsPanel({ onBack }: SettingsPanelProps) {
  const { locale, setLocale, t } = useTranslation()
  const [showImportTextarea, setShowImportTextarea] = useState(false)
  const [importYaml, setImportYaml] = useState('')

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale
    setLocale(newLocale)
    parent.postMessage({ pluginMessage: { type: 'set-locale', payload: { locale: newLocale } } }, '*')
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <button
          className="settings-back-button"
          onClick={onBack}
          aria-label={t('settings.back')}
        >
          ← {t('settings.back')}
        </button>
        <h2>{t('settings.title')}</h2>
      </div>
      <div className="settings-content">
        <div className="settings-row">
          <label htmlFor="language-select">{t('settings.language')}</label>
          <select
            id="language-select"
            value={locale}
            onChange={handleLocaleChange}
            aria-label={t('settings.language')}
          >
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>
        <div className="section">
          <h2>{t('sections.import')}</h2>
          {!showImportTextarea ? (
            <div className="button-group">
              <button
                className="button"
                onClick={() => setShowImportTextarea(true)}
              >
                {t('buttons.importYaml')}
              </button>
            </div>
          ) : (
            <div className="import-form">
              <textarea
                className="import-textarea"
                placeholder={t('placeholders.pasteYaml')}
                value={importYaml}
                onChange={(e) => setImportYaml(e.target.value)}
                rows={8}
              />
              <div className="button-group">
                <button
                  className="button"
                  disabled={!importYaml.trim()}
                  onClick={() => {
                    parent.postMessage({ pluginMessage: { type: 'import-from-yaml', payload: { yamlContent: importYaml } } }, '*')
                    setImportYaml('')
                    setShowImportTextarea(false)
                  }}
                >
                  {t('buttons.import')}
                </button>
                <button
                  className="button import-cancel-button"
                  onClick={() => {
                    setImportYaml('')
                    setShowImportTextarea(false)
                  }}
                >
                  {t('buttons.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export interface PanelProps {
  onCreateElement?: (type: ElementType | StructuralType | SectionType) => void
}

export function Panel({ onCreateElement }: PanelProps) {
  const [editorType, setEditorType] = useState<EditorType>(null)
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [multipleSelected, setMultipleSelected] = useState(false)
  const [driftDetected, setDriftDetected] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const { t } = useTranslation()

  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    setToastMessage(message)
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000)
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data?.pluginMessage
      if (message?.type === 'platform-detected') {
        setEditorType(message.payload?.editorType)
      }
      if (message?.type === 'selection-changed') {
        if (message.payload?.multiple) {
          setMultipleSelected(true)
          setSelectedElement(null)
          setDriftDetected(false)
        } else {
          setMultipleSelected(false)
          setSelectedElement(message.payload)
          setDriftDetected(false)
        }
      }
      if (message?.type === 'drift-detected') {
        setDriftDetected(message.payload?.drifted ?? false)
      }
      if (message?.type === 'export-slice-to-markdown-result') {
        const markdown = message.payload?.markdown
        if (markdown) {
          copyToClipboard(markdown).then(() => {
            showToast(t('messages.copiedToClipboard'))
          }).catch(() => {
            showToast(t('messages.failedToCopy'))
          })
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [t])

  const handleCreateElement = (type: ElementType | StructuralType | SectionType) => {
    if (onCreateElement) {
      onCreateElement(type)
    }

    // Send type-specific message to plugin sandbox
    const messageTypeMap: Partial<Record<ElementType | StructuralType | SectionType, string>> = {
      command: 'create-command',
      event: 'create-event',
      query: 'create-query',
      actor: 'create-actor',
      lane: 'create-lane',
      chapter: 'create-chapter',
      processor: 'create-processor',
      screen: 'create-screen',
      slice: 'create-slice',
      gwt: 'create-gwt',
    }

    const messageType = messageTypeMap[type]
    if (messageType) {
      parent.postMessage({ pluginMessage: { type: messageType } }, '*')
    }
  }

  // Types with implemented handlers
  const enabledTypes = new Set<string>(['command', 'event', 'query', 'actor', 'lane', 'chapter', 'processor', 'screen', 'slice', 'gwt'])
  const isFigmaDesign = editorType === 'figma'

  if (showSettings) {
    return (
      <div className="container">
        <SettingsPanel onBack={() => setShowSettings(false)} />
        <ResizeHandle />
      </div>
    )
  }

  return (
    <div className="container">
      <div className="panel-header">
        <h1>{t('panel.title')}</h1>
        <button
          className="settings-gear-button"
          onClick={() => setShowSettings(true)}
          aria-label={t('settings.title')}
        >
          ⚙
        </button>
      </div>

      {isFigmaDesign ? (
        <div role="alert" className="error-message">
          {t('messages.figjamOnly')}
        </div>
      ) : (
        <>
          <p className="description">
            {t('panel.description')}
          </p>

          <ButtonGroup
            title={t('sections.coreShapes')}
            buttons={coreShapes}
            onCreateElement={handleCreateElement}
            enabledTypes={enabledTypes}
            collapsed={!!collapsedSections['coreShapes']}
            onToggle={() => setCollapsedSections(prev => ({ ...prev, coreShapes: !prev.coreShapes }))}
          />

          <ButtonGroup
            title={t('sections.structural')}
            buttons={structural}
            onCreateElement={handleCreateElement}
            enabledTypes={enabledTypes}
            collapsed={!!collapsedSections['structural']}
            onToggle={() => setCollapsedSections(prev => ({ ...prev, structural: !prev.structural }))}
          />

          <ButtonGroup
            title={t('sections.sections')}
            buttons={sections}
            onCreateElement={handleCreateElement}
            enabledTypes={enabledTypes}
            collapsed={!!collapsedSections['sections']}
            onToggle={() => setCollapsedSections(prev => ({ ...prev, sections: !prev.sections }))}
          />

          <ElementEditor selectedElement={selectedElement} multipleSelected={multipleSelected} driftDetected={driftDetected} />

          {toastMessage && (
            <div className="toast" role="status">{toastMessage}</div>
          )}

          <div className="help-link">
            <a
              href="https://eventmodeling.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('links.learnAboutEventModeling')}
            </a>
          </div>
        </>
      )}
      <ResizeHandle />
    </div>
  )
}
