import { useCallback, useEffect, useRef, useState } from 'react'
import type { ElementType, StructuralType, SectionType } from '../../shared/types/plugin'
import { ElementEditor, type SelectedElement } from '../view-selected-element'
import { useTranslation, type Locale } from '../../shared/i18n'
import { YAML_TEMPLATE } from '../import-from-yaml/template'
import { parseImportYaml } from '../import-from-yaml/parser'
import { ResolutionFlow, type PendingResolution } from '../import-from-yaml'

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
  { type: 'slice', label: 'Slice', className: 'button-slice', previewColor: '#FFFFFF' },
  { type: 'gwt', label: 'GWT', className: 'button-gwt', previewColor: '#FFFFFF' },
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
  const [selectionCount, setSelectionCount] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({ other: true })
  const [importYaml, setImportYaml] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [templateCopied, setTemplateCopied] = useState(false)
  const [pending, setPending] = useState<PendingResolution[] | null>(null)
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
          setSelectionCount(message.payload?.count ?? 0)
        } else {
          setMultipleSelected(false)
          setSelectedElement(message.payload)
          setSelectionCount(0)
        }
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
      if (message?.type === 'export-slice-to-yaml-result') {
        const yaml = message.payload?.yaml
        if (yaml) {
          copyToClipboard(yaml).then(() => {
            showToast(t('messages.copiedToClipboard'))
          }).catch(() => {
            showToast(t('messages.failedToCopy'))
          })
        }
      }
      if (message?.type === 'copy-element-to-yaml-result') {
        const yaml = message.payload?.yaml
        if (yaml) {
          copyToClipboard(yaml).then(() => {
            showToast(t('messages.copiedToClipboard'))
          }).catch(() => {
            showToast(t('messages.failedToCopy'))
          })
        }
      }
      if (message?.type === 'copy-multi-slice-to-yaml-result') {
        const yaml = message.payload?.yaml
        if (yaml) {
          copyToClipboard(yaml).then(() => {
            showToast(t('messages.copiedToClipboard'))
          }).catch(() => {
            showToast(t('messages.failedToCopy'))
          })
        }
      }
      if (message?.type === 'copy-multi-slice-to-yaml-error') {
        showToast(message.payload?.message ?? t('messages.failedToCopy'))
      }
      if (message?.type === 'import-from-yaml-error') {
        setImportError(message.payload?.error ?? 'Import failed')
        setPending(null)
      }
      if (message?.type === 'import-from-yaml-success') {
        setImportYaml('')
        setImportError(null)
        setPending(null)
      }
      if (message?.type === 'import-resolution-needed') {
        setPending(message.payload?.pending ?? [])
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

  const handleCopyTemplate = async () => {
    await copyToClipboard(YAML_TEMPLATE)
    setTemplateCopied(true)
    setTimeout(() => setTemplateCopied(false), 2000)
  }

  const handleResolutionDone = (answers: Array<{ kind: 'connect'; candidateNodeId: string } | { kind: 'create' } | { kind: 'skip' }>) => {
    parent.postMessage({ pluginMessage: { type: 'import-resolution-answered', payload: { answers } } }, '*')
    setPending(null)
  }

  const handleResolutionFocus = (nodeId: string) => {
    parent.postMessage({ pluginMessage: { type: 'focus-node', payload: { nodeId } } }, '*')
  }

  const handleImport = () => {
    if (!importYaml.trim()) return
    const result = parseImportYaml(importYaml)
    if (!result.success) {
      setImportError(result.error)
      return
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.warn(w))
    }
    parent.postMessage({ pluginMessage: { type: 'import-from-yaml', payload: result.data } }, '*')
    setImportError(null)
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

          <div className="section">
            <h2 onClick={() => setCollapsedSections(prev => ({ ...prev, other: !prev.other }))} style={{ cursor: 'pointer' }}>
              {collapsedSections['other'] ? '▸' : '▾'} {t('sections.other')}
            </h2>
            {!collapsedSections['other'] && (
              <div className="import-form">
                {pending !== null ? (
                  <ResolutionFlow
                    pending={pending}
                    onDone={handleResolutionDone}
                    onFocus={handleResolutionFocus}
                  />
                ) : (
                  <>
                    <textarea
                      className="import-textarea"
                      placeholder={t('placeholders.pasteYaml')}
                      value={importYaml}
                      onChange={(e) => {
                        setImportYaml(e.target.value)
                        setImportError(null)
                      }}
                      rows={6}
                    />
                    {importError && (
                      <div className="import-error" role="alert">{importError}</div>
                    )}
                    <div className="button-group">
                      <button
                        className="button"
                        disabled={!importYaml.trim()}
                        onClick={handleImport}
                      >
                        {t('buttons.import')}
                      </button>
                      <button
                        className="button copy-template-button"
                        onClick={handleCopyTemplate}
                        title="Copy YAML template"
                        aria-label="Copy YAML template"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </button>
                      {templateCopied && <span className="copied-feedback">Copied!</span>}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <ElementEditor selectedElement={selectedElement} multipleSelected={multipleSelected} selectionCount={selectionCount} />

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
