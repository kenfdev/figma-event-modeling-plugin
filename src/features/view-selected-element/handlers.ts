import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import type { ElementType, StructuralType, SectionType } from '../../shared/types/plugin'

const CORE_ELEMENT_TYPES: readonly ElementType[] = ['command', 'event', 'query', 'actor']

export interface SelectionChangePayload {
  id: string
  type: ElementType | StructuralType | SectionType
  name: string
  pluginData?: Record<string, string>
}

export function handleSelectionChange({
  figma,
}: MessageHandlerContext): void {
  const selection = figma.currentPage.selection

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'selection-changed',
      payload: null,
    })
    return
  }

  if (selection.length > 1) {
    figma.ui.postMessage({
      type: 'selection-changed',
      payload: { multiple: true },
    })
    return
  }

  const node = selection[0]
  const elementType = node.getPluginData('type')

  if (!elementType) {
    figma.ui.postMessage({
      type: 'selection-changed',
      payload: null,
    })
    return
  }

  let name = node.name

  if (CORE_ELEMENT_TYPES.includes(elementType as ElementType)) {
    const canvasText = (node as ShapeWithTextNode).text?.characters
    if (canvasText !== undefined) {
      const pluginLabel = node.getPluginData('label')
      if (canvasText !== pluginLabel) {
        node.setPluginData('label', canvasText)
      }
      name = canvasText
    }
  }

  const payload: Record<string, unknown> = {
    id: node.id,
    type: elementType as ElementType | StructuralType | SectionType,
    name,
    customFields: node.getPluginData('customFields') || '',
    notes: node.getPluginData('notes') || '',
    external: node.getPluginData('external') === 'true',
    issueUrl: node.getPluginData('issueUrl') || '',
  }

  if ('getPluginDataKeys' in node && typeof node.getPluginDataKeys === 'function') {
    const keys = (node as unknown as { getPluginDataKeys: () => string[] }).getPluginDataKeys()
    const pluginData: Record<string, string> = {}
    for (const key of keys) {
      pluginData[key] = node.getPluginData(key)
    }
    payload.pluginData = pluginData
  }

  figma.ui.postMessage({
    type: 'selection-changed',
    payload,
  })
}

export function registerSelectionChangeListener({
  figma,
}: MessageHandlerContext): void {
  figma.on('selectionchange', () => {
    handleSelectionChange({ figma })
  })
}
