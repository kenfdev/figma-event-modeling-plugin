import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const COMMAND_WIDTH = 176
const COMMAND_HEIGHT = 80
const COMMAND_FILL_COLOR = { r: 0x3d / 255, g: 0xad / 255, b: 0xff / 255 }
const COMMAND_STROKE_COLOR = { r: 0x00 / 255, g: 0x7a / 255, b: 0xd2 / 255 }
const COMMAND_CORNER_RADIUS = 0
const COMMAND_TEXT_COLOR = { r: 1, g: 1, b: 1 }

export async function handleCreateCommand(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const shape = figma.createShapeWithText()

  shape.shapeType = 'ROUNDED_RECTANGLE'
  shape.resize(COMMAND_WIDTH, COMMAND_HEIGHT)
  shape.cornerRadius = COMMAND_CORNER_RADIUS
  shape.fills = [{ type: 'SOLID', color: COMMAND_FILL_COLOR }]
  shape.strokes = [{ type: 'SOLID', color: COMMAND_STROKE_COLOR }]
  shape.strokeWeight = 2
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  shape.text.characters = 'Command'
  shape.text.fills = [{ type: 'SOLID', color: COMMAND_TEXT_COLOR }]
  shape.setPluginData('type', 'command')
  shape.setPluginData('label', 'Command')

  const center = figma.viewport.center
  shape.x = center.x - COMMAND_WIDTH / 2
  shape.y = center.y - COMMAND_HEIGHT / 2

  shape.locked = true

  figma.currentPage.appendChild(shape)
}
