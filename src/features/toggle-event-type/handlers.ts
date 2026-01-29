import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

interface ToggleEventTypePayload {
  id: string
  external: boolean
}

const INTERNAL_COLOR = { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 }
const EXTERNAL_COLOR = { r: 0x9b / 255, g: 0x59 / 255, b: 0xb6 / 255 }

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
    const color = external ? EXTERNAL_COLOR : INTERNAL_COLOR
    node.fills = [{ ...node.fills[0], color }]
  }
}
