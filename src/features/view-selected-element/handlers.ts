import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import type { ElementType } from '../../shared/types/plugin'

export interface SelectionChangePayload {
  id: string
  type: ElementType
  name: string
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

  const node = selection[0]
  const elementType = node.getPluginData('type')

  if (!elementType) {
    figma.ui.postMessage({
      type: 'selection-changed',
      payload: null,
    })
    return
  }

  figma.ui.postMessage({
    type: 'selection-changed',
    payload: {
      id: node.id,
      type: elementType as ElementType,
      name: node.name,
    },
  })
}

export function registerSelectionChangeListener({
  figma,
}: MessageHandlerContext): void {
  figma.on('selectionchange', () => {
    handleSelectionChange({ figma })
  })
}
