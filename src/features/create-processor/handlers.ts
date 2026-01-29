import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const GEAR_SVG = `<svg width="48" height="48" viewBox="-1 6 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M24 30C27.3137 30 30 27.3137 30 24C30 20.6863 27.3137 18 24 18C20.6863 18 18 20.6863 18 24C18 27.3137 20.6863 30 24 30Z" fill="black"/>
  <path d="M43.2 26.4L38.88 29.76C39.12 28.56 39.12 27.36 38.88 26.16L43.2 22.8C43.68 22.32 43.68 21.6 43.44 21.12L39.12 13.68C38.88 13.2 38.16 12.96 37.68 13.2L32.64 15.36C31.2 14.16 29.52 13.2 27.84 12.72L27.12 7.44C27.12 6.72 26.4 6.24 25.92 6.24H17.28C16.56 6.24 16.08 6.72 15.84 7.44L15.12 12.72C13.44 13.2 11.76 14.16 10.32 15.36L5.28 13.2C4.8 12.96 4.08 13.2 3.84 13.68L-0.48 21.12C-0.72 21.6 -0.48 22.32 0 22.8L4.32 26.16C4.08 27.36 4.08 28.56 4.32 29.76L0 33.12C-0.48 33.6 -0.48 34.32 -0.24 34.8L4.08 42.24C4.32 42.72 5.04 42.96 5.52 42.72L10.56 40.56C11.76 41.76 13.68 42.72 15.36 43.2L16.08 48.48C16.08 49.2 16.8 49.68 17.28 49.68H25.92C26.64 49.68 27.12 49.2 27.36 48.48L28.08 43.2C29.76 42.72 31.44 41.76 32.88 40.56L37.92 42.72C38.4 42.96 39.12 42.72 39.36 42.24L43.68 34.8C43.92 34.32 43.68 33.6 43.2 33.12L38.88 29.76" fill="black"/>
</svg>`

const ICON_SIZE = 48
const LABEL_GAP = 8
const TEXT_COLOR = { r: 0, g: 0, b: 0 }

export async function handleCreateProcessor(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const svgNode = figma.createNodeFromSvg(GEAR_SVG)

  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })

  const textNode = figma.createText()
  textNode.fontName = { family: 'Inter', style: 'Medium' }
  textNode.fontSize = 14
  textNode.characters = 'Processor'
  textNode.fills = [{ type: 'SOLID', color: TEXT_COLOR }]

  textNode.y = ICON_SIZE + LABEL_GAP

  const group = figma.group([svgNode, textNode], figma.currentPage)

  group.setPluginData('type', 'processor')
  group.setPluginData('label', 'Processor')

  const center = figma.viewport.center
  group.x = center.x - group.width / 2
  group.y = center.y - group.height / 2
}
