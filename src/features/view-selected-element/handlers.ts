import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import type { ElementType, StructuralType, SectionType } from '../../shared/types/plugin'
import { hasImageFill } from '../mark-image-as-screen/handlers'
import {
  SCREEN_ACTORS_PLUGIN_DATA_KEY,
  deserializeActors,
} from '../screen-actors/handlers'

const CORE_ELEMENT_TYPES: readonly ElementType[] = ['command', 'event', 'query', 'actor']

export interface SelectionChangePayload {
  id: string
  type: ElementType | StructuralType | SectionType | 'wrapping-section'
  name: string
  pluginData?: Record<string, string>
  sliceCount?: number
  hasPlainImages?: boolean
  hasScreenImages?: boolean
}

interface ImageSelectionInfo {
  hasPlainImages?: boolean
  hasScreenImages?: boolean
}

function computeImageSelectionInfo(selection: readonly SceneNode[]): ImageSelectionInfo {
  let hasPlainImages = false
  let hasScreenImages = false
  for (const node of selection) {
    if (!hasImageFill(node)) continue
    if (node.getPluginData('type') === 'screen') {
      hasScreenImages = true
    } else {
      hasPlainImages = true
    }
  }
  const info: ImageSelectionInfo = {}
  if (hasPlainImages) info.hasPlainImages = true
  if (hasScreenImages) info.hasScreenImages = true
  return info
}

export function handleSelectionChange({
  figma,
}: MessageHandlerContext): void {
  const selection = figma.currentPage.selection
  const imageInfo = computeImageSelectionInfo(selection as readonly SceneNode[])

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'selection-changed',
      payload: null,
    })
    return
  }

  if (selection.length > 1) {
    const allSlices = selection.every(
      (node) => node.getPluginData('type') === 'slice'
    )
    if (allSlices) {
      const multiSliceIds = selection.map((node) => node.id)
      figma.ui.postMessage({
        type: 'selection-changed',
        payload: {
          multiple: true,
          count: selection.length,
          multiSliceIds,
          ...imageInfo,
        },
      })
      return
    }
    figma.ui.postMessage({
      type: 'selection-changed',
      payload: { multiple: true, count: selection.length, ...imageInfo },
    })
    return
  }

  const node = selection[0]
  const elementType = node.getPluginData('type')

  if (!elementType) {
    if (node.type === 'SECTION') {
      const children = (node as SectionNode).children ?? []
      const sliceCount = children.filter(
        (c: SceneNode) => c.getPluginData('type') === 'slice'
      ).length
      if (sliceCount >= 1) {
        figma.ui.postMessage({
          type: 'selection-changed',
          payload: {
            id: node.id,
            type: 'wrapping-section' as const,
            name: node.name,
            sliceCount,
            ...imageInfo,
          },
        })
        return
      }
    }
    if (imageInfo.hasPlainImages || imageInfo.hasScreenImages) {
      figma.ui.postMessage({
        type: 'selection-changed',
        payload: { ...imageInfo },
      })
      return
    }
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
    ...imageInfo,
  }

  if (elementType === 'screen') {
    payload.actors = deserializeActors(
      node.getPluginData(SCREEN_ACTORS_PLUGIN_DATA_KEY)
    )
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
