import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const COLOR_MAP: Record<
  string,
  { fill: { r: number; g: number; b: number }; stroke: { r: number; g: number; b: number } }
> = {
  command: {
    fill: { r: 0x3d / 255, g: 0xad / 255, b: 0xff / 255 },
    stroke: { r: 0x00 / 255, g: 0x7a / 255, b: 0xd2 / 255 },
  },
  event: {
    fill: { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 },
    stroke: { r: 0xeb / 255, g: 0x75 / 255, b: 0x00 / 255 },
  },
  query: {
    fill: { r: 0x7e / 255, g: 0xd3 / 255, b: 0x21 / 255 },
    stroke: { r: 0x5b / 255, g: 0xa5 / 255, b: 0x18 / 255 },
  },
}

interface ChangeElementTypePayload {
  id: string
  newType: string
}

export async function handleChangeElementType(
  payload: ChangeElementTypePayload,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { id, newType } = payload
  const node = await figma.getNodeByIdAsync(id)
  if (!node) return

  const shape = node as ShapeWithTextNode
  const oldType = shape.getPluginData('type')

  shape.setPluginData('type', newType)

  if (oldType === 'event' && newType !== 'event') {
    shape.setPluginData('external', '')
  }

  const colors = COLOR_MAP[newType]
  if (colors) {
    shape.fills = [{ type: 'SOLID', color: colors.fill }]
    shape.strokes = [{ type: 'SOLID', color: colors.stroke }]
  }

  figma.ui.postMessage({
    type: 'selection-changed',
    payload: {
      id: shape.id,
      type: newType,
      name: shape.name,
      customFields: shape.getPluginData('customFields') || '',
      notes: shape.getPluginData('notes') || '',
      external: shape.getPluginData('external') === 'true',
      fieldsVisible: shape.getPluginData('fieldsVisible') === 'true',
      issueUrl: shape.getPluginData('issueUrl') || '',
    },
  })
}
