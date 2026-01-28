import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const COMMAND_WIDTH = 200
const COMMAND_HEIGHT = 120
const COMMAND_COLOR = { r: 74 / 255, g: 144 / 255, b: 217 / 255 }

export function handleCreateCommand(
  _payload: unknown,
  { figma }: MessageHandlerContext
): void {
  const shape = figma.createShapeWithText()

  shape.shapeType = 'ROUNDED_RECTANGLE'
  shape.resize(COMMAND_WIDTH, COMMAND_HEIGHT)
  shape.fills = [{ type: 'SOLID', color: COMMAND_COLOR }]
  shape.text.characters = 'Command'
  shape.setPluginData('type', 'command')

  const center = figma.viewport.center
  shape.x = center.x - COMMAND_WIDTH / 2
  shape.y = center.y - COMMAND_HEIGHT / 2

  figma.currentPage.appendChild(shape)
}
