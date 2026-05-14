import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import { handleSelectionChange } from '../view-selected-element/handlers'

export const MARK_AS_SCREEN_MESSAGE = 'mark-as-screen'
export const REVERT_SCREEN_MESSAGE = 'revert-screen'
export const MARK_AS_SCREEN_SUCCESS = 'mark-as-screen-success'
export const REVERT_SCREEN_SUCCESS = 'revert-screen-success'
export const MARK_AS_SCREEN_ERROR = 'mark-as-screen-error'
export const REVERT_SCREEN_ERROR = 'revert-screen-error'

export const SCREEN_PLUGIN_TYPE = 'screen'

export const ORIGINAL_STROKES_KEY = 'originalStrokes'
export const ORIGINAL_STROKE_WEIGHT_KEY = 'originalStrokeWeight'
export const ORIGINAL_STROKE_ALIGN_KEY = 'originalStrokeAlign'

const SCREEN_BORDER_COLOR = { r: 0.5, g: 0.5, b: 0.5 }
const SCREEN_BORDER_WEIGHT = 3
const SCREEN_BORDER_ALIGN = 'INSIDE' as const

const VALID_STROKE_ALIGNS = new Set(['INSIDE', 'OUTSIDE', 'CENTER'])

type ImageNode = SceneNode & {
  fills: readonly Paint[] | Paint[]
  strokes: readonly Paint[] | Paint[]
  strokeWeight: number
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER'
}

export function hasImageFill(node: SceneNode): boolean {
  if (!('fills' in node)) return false
  const fills = (node as ImageNode).fills as readonly Paint[]
  if (!Array.isArray(fills)) return false
  return fills.some((f) => f.type === 'IMAGE')
}

function isScreenMarked(node: SceneNode): boolean {
  return node.getPluginData('type') === SCREEN_PLUGIN_TYPE
}

function safeParseStrokes(json: string): Paint[] {
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed as Paint[]
  } catch {
    return []
  }
}

function safeParseStrokeWeight(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function safeParseStrokeAlign(value: string): 'INSIDE' | 'OUTSIDE' | 'CENTER' {
  return VALID_STROKE_ALIGNS.has(value)
    ? (value as 'INSIDE' | 'OUTSIDE' | 'CENTER')
    : 'INSIDE'
}

export function handleMarkImagesAsScreen(
  _payload: unknown,
  { figma }: MessageHandlerContext
): void {
  try {
    const selection = figma.currentPage.selection
    let count = 0

    for (const node of selection) {
      if (!hasImageFill(node)) continue
      if (isScreenMarked(node)) continue

      const imageNode = node as ImageNode

      if (!node.getPluginData(ORIGINAL_STROKES_KEY)) {
        node.setPluginData(ORIGINAL_STROKES_KEY, JSON.stringify(imageNode.strokes ?? []))
      }
      if (!node.getPluginData(ORIGINAL_STROKE_WEIGHT_KEY)) {
        node.setPluginData(
          ORIGINAL_STROKE_WEIGHT_KEY,
          String(imageNode.strokeWeight ?? 0)
        )
      }
      if (!node.getPluginData(ORIGINAL_STROKE_ALIGN_KEY)) {
        node.setPluginData(
          ORIGINAL_STROKE_ALIGN_KEY,
          imageNode.strokeAlign ?? 'INSIDE'
        )
      }

      imageNode.strokes = [{ type: 'SOLID', color: SCREEN_BORDER_COLOR }]
      imageNode.strokeWeight = SCREEN_BORDER_WEIGHT
      if ('strokeAlign' in imageNode) {
        imageNode.strokeAlign = SCREEN_BORDER_ALIGN
      }

      node.setPluginData('type', SCREEN_PLUGIN_TYPE)
      node.setPluginData('label', node.name || 'Screen')

      count++
    }

    figma.ui.postMessage({
      type: MARK_AS_SCREEN_SUCCESS,
      payload: { count },
    })
    handleSelectionChange({ figma })
  } catch (error) {
    figma.ui.postMessage({
      type: MARK_AS_SCREEN_ERROR,
      payload: { message: String(error) },
    })
  }
}

export function handleRevertScreenImages(
  _payload: unknown,
  { figma }: MessageHandlerContext
): void {
  try {
    const selection = figma.currentPage.selection
    let count = 0

    for (const node of selection) {
      if (!hasImageFill(node)) continue
      if (!isScreenMarked(node)) continue

      const imageNode = node as ImageNode

      const savedStrokes = node.getPluginData(ORIGINAL_STROKES_KEY)
      const savedWeight = node.getPluginData(ORIGINAL_STROKE_WEIGHT_KEY)
      const savedAlign = node.getPluginData(ORIGINAL_STROKE_ALIGN_KEY)

      if (savedStrokes) {
        imageNode.strokes = safeParseStrokes(savedStrokes)
      } else {
        imageNode.strokes = []
      }
      if (savedWeight) {
        imageNode.strokeWeight = safeParseStrokeWeight(savedWeight)
      } else {
        imageNode.strokeWeight = 0
      }
      if ('strokeAlign' in imageNode && savedAlign) {
        imageNode.strokeAlign = safeParseStrokeAlign(savedAlign)
      }

      node.setPluginData(ORIGINAL_STROKES_KEY, '')
      node.setPluginData(ORIGINAL_STROKE_WEIGHT_KEY, '')
      node.setPluginData(ORIGINAL_STROKE_ALIGN_KEY, '')

      node.setPluginData('type', '')
      node.setPluginData('label', '')

      count++
    }

    figma.ui.postMessage({
      type: REVERT_SCREEN_SUCCESS,
      payload: { count },
    })
    handleSelectionChange({ figma })
  } catch (error) {
    figma.ui.postMessage({
      type: REVERT_SCREEN_ERROR,
      payload: { message: String(error) },
    })
  }
}
