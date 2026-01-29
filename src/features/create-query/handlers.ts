import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const QUERY_WIDTH = 176
const QUERY_HEIGHT = 80
const QUERY_FILL_COLOR = { r: 0x7e / 255, g: 0xd3 / 255, b: 0x21 / 255 }
const QUERY_STROKE_COLOR = { r: 0x5b / 255, g: 0xa5 / 255, b: 0x18 / 255 }
const QUERY_CORNER_RADIUS = 0
const QUERY_TEXT_COLOR = { r: 0, g: 0, b: 0 }

export async function handleCreateQuery(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const shape = figma.createShapeWithText()

  shape.shapeType = 'ROUNDED_RECTANGLE'
  shape.resize(QUERY_WIDTH, QUERY_HEIGHT)
  shape.cornerRadius = QUERY_CORNER_RADIUS
  shape.fills = [{ type: 'SOLID', color: QUERY_FILL_COLOR }]
  shape.strokes = [{ type: 'SOLID', color: QUERY_STROKE_COLOR }]
  shape.strokeWeight = 2
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  shape.text.characters = 'Query'
  shape.text.fills = [{ type: 'SOLID', color: QUERY_TEXT_COLOR }]
  shape.setPluginData('type', 'query')
  shape.setPluginData('label', 'Query')

  const center = figma.viewport.center
  shape.x = center.x - QUERY_WIDTH / 2
  shape.y = center.y - QUERY_HEIGHT / 2

  figma.currentPage.appendChild(shape)
}
