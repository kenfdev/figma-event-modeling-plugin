import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const SCREEN_WIDTH = 200
const SCREEN_HEIGHT = 160
const GRAY_FILL_COLOR = { r: 0.9, g: 0.9, b: 0.9 }
const TEXT_COLOR = { r: 0.4, g: 0.4, b: 0.4 }

export async function handleCreateScreen(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const shape = figma.createShapeWithText()

  shape.shapeType = 'SQUARE'
  shape.resize(SCREEN_WIDTH, SCREEN_HEIGHT)
  shape.cornerRadius = 4
  shape.fills = [{ type: 'SOLID', color: GRAY_FILL_COLOR }]

  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  shape.text.characters = 'Screen'
  shape.text.fills = [{ type: 'SOLID', color: TEXT_COLOR }]

  shape.setPluginData('type', 'screen')
  shape.setPluginData('label', 'Screen')

  const center = figma.viewport.center
  shape.x = center.x - SCREEN_WIDTH / 2
  shape.y = center.y - SCREEN_HEIGHT / 2

  figma.currentPage.appendChild(shape)
}