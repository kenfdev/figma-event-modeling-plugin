import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const EVENT_WIDTH = 176
const EVENT_HEIGHT = 80
const EVENT_FILL_COLOR = { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 }
const EVENT_STROKE_COLOR = { r: 0xeb / 255, g: 0x75 / 255, b: 0x00 / 255 }
const EVENT_CORNER_RADIUS = 0
const EVENT_TEXT_COLOR = { r: 1, g: 1, b: 1 }

export async function handleCreateEvent(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const shape = figma.createShapeWithText()

  shape.shapeType = 'ROUNDED_RECTANGLE'
  shape.resize(EVENT_WIDTH, EVENT_HEIGHT)
  shape.cornerRadius = EVENT_CORNER_RADIUS
  shape.fills = [{ type: 'SOLID', color: EVENT_FILL_COLOR }]
  shape.strokes = [{ type: 'SOLID', color: EVENT_STROKE_COLOR }]
  shape.strokeWeight = 2
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  shape.text.characters = 'Event'
  shape.text.fills = [{ type: 'SOLID', color: EVENT_TEXT_COLOR }]
  shape.setPluginData('type', 'event')
  shape.setPluginData('label', 'Event')
  shape.setPluginData('external', 'false')

  const center = figma.viewport.center
  shape.x = center.x - EVENT_WIDTH / 2
  shape.y = center.y - EVENT_HEIGHT / 2

  figma.currentPage.appendChild(shape)
}
