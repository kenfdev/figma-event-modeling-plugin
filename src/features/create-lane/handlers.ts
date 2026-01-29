import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const LANE_HEIGHT = 120
const LANE_FILL_COLOR = { r: 0.85, g: 0.85, b: 0.85 }
const LANE_FILL_OPACITY = 0.05

export async function handleCreateLane(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const shape = figma.createShapeWithText()

  const viewportWidth = figma.viewport.bounds.width
  const laneWidth = viewportWidth / 2

  shape.shapeType = 'SQUARE'
  shape.resize(laneWidth, LANE_HEIGHT)
  shape.fills = [{ type: 'SOLID', color: LANE_FILL_COLOR, opacity: LANE_FILL_OPACITY }]
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  shape.text.characters = ''
  shape.setPluginData('type', 'lane')
  shape.setPluginData('label', '')

  const center = figma.viewport.center
  shape.x = center.x - laneWidth / 2
  shape.y = center.y - LANE_HEIGHT / 2

  figma.currentPage.appendChild(shape)
}
