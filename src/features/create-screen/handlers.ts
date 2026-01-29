import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

// Simple window/browser icon SVG
const WINDOW_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="8" width="40" height="32" rx="3" ry="3" fill="none" stroke="#666666" stroke-width="2.5"/>
  <line x1="4" y1="16" x2="44" y2="16" stroke="#666666" stroke-width="2.5"/>
  <circle cx="10" cy="12" r="1.5" fill="#666666"/>
  <circle cx="15" cy="12" r="1.5" fill="#666666"/>
  <circle cx="20" cy="12" r="1.5" fill="#666666"/>
</svg>`

const PLACEHOLDER_WIDTH = 200
const PLACEHOLDER_HEIGHT = 160
const ICON_SIZE = 48
const LABEL_GAP = 8
const GRAY_COLOR = { r: 0.9, g: 0.9, b: 0.9 }
const TEXT_COLOR = { r: 0.4, g: 0.4, b: 0.4 }

export async function handleCreateScreen(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const rect = figma.createRectangle()
  rect.resize(PLACEHOLDER_WIDTH, PLACEHOLDER_HEIGHT)
  rect.fills = [{ type: 'SOLID', color: GRAY_COLOR }]
  rect.cornerRadius = 4

  const svgNode = figma.createNodeFromSvg(WINDOW_SVG)
  // Center icon on the rectangle
  svgNode.x = rect.x + (PLACEHOLDER_WIDTH - ICON_SIZE) / 2
  svgNode.y = rect.y + (PLACEHOLDER_HEIGHT - ICON_SIZE) / 2 - 10

  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })

  const textNode = figma.createText()
  textNode.fontName = { family: 'Inter', style: 'Medium' }
  textNode.fontSize = 14
  textNode.characters = 'Screen'
  textNode.fills = [{ type: 'SOLID', color: TEXT_COLOR }]
  textNode.textAlignHorizontal = 'CENTER'
  textNode.y = rect.y + PLACEHOLDER_HEIGHT + LABEL_GAP
  textNode.x = rect.x + (PLACEHOLDER_WIDTH - textNode.width) / 2

  const group = figma.group([rect, svgNode, textNode], figma.currentPage)

  group.setPluginData('type', 'screen')
  group.setPluginData('label', 'Screen')

  const center = figma.viewport.center
  group.x = center.x - group.width / 2
  group.y = center.y - group.height / 2
}
