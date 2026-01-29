import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

interface ToggleEventTypePayload {
  id: string
  external: boolean
}

const INTERNAL_FILL_COLOR = { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 }
const INTERNAL_STROKE_COLOR = { r: 0xeb / 255, g: 0x75 / 255, b: 0x00 / 255 }
const EXTERNAL_FILL_COLOR = { r: 0x9b / 255, g: 0x59 / 255, b: 0xb6 / 255 }
const EXTERNAL_STROKE_COLOR = { r: 0x7d / 255, g: 0x3c / 255, b: 0x98 / 255 }

export async function handleToggleEventType(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { id, external } = payload as ToggleEventTypePayload

  const node = figma.getNodeById(id) as SceneNode | null
  if (!node) {
    return
  }

  node.setPluginData('external', external ? 'true' : 'false')

  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    const fillColor = external ? EXTERNAL_FILL_COLOR : INTERNAL_FILL_COLOR
    node.fills = [{ ...node.fills[0], color: fillColor }]
  }

  if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
    const strokeColor = external ? EXTERNAL_STROKE_COLOR : INTERNAL_STROKE_COLOR
    node.strokes = [{ ...node.strokes[0], color: strokeColor }]
  }
}
