import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const ACTOR_WIDTH = 176
const ACTOR_HEIGHT = 80
const ACTOR_FILL_COLOR = { r: 0x50 / 255, g: 0xe3 / 255, b: 0xc2 / 255 }
const ACTOR_STROKE_COLOR = { r: 0x3b / 255, g: 0xb8 / 255, b: 0x9e / 255 }
const ACTOR_CORNER_RADIUS = 0
const ACTOR_TEXT_COLOR = { r: 0, g: 0, b: 0 }

export async function handleCreateActor(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const shape = figma.createShapeWithText()

  shape.shapeType = 'ROUNDED_RECTANGLE'
  shape.resize(ACTOR_WIDTH, ACTOR_HEIGHT)
  shape.cornerRadius = ACTOR_CORNER_RADIUS
  shape.fills = [{ type: 'SOLID', color: ACTOR_FILL_COLOR }]
  shape.strokes = [{ type: 'SOLID', color: ACTOR_STROKE_COLOR }]
  shape.strokeWeight = 2
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  shape.text.characters = 'Actor'
  shape.text.fills = [{ type: 'SOLID', color: ACTOR_TEXT_COLOR }]
  shape.setPluginData('type', 'actor')
  shape.setPluginData('label', 'Actor')

  const center = figma.viewport.center
  shape.x = center.x - ACTOR_WIDTH / 2
  shape.y = center.y - ACTOR_HEIGHT / 2

  figma.currentPage.appendChild(shape)
}
