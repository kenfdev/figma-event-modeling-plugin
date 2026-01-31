import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

// Gear icon with 8 teeth, center hole, generated via parametric math
function buildGearPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  holeR: number,
  teeth: number
): string {
  const points: string[] = []
  const toothArc = (2 * Math.PI) / teeth
  // Each tooth: outer plateau, then inner valley
  const tipHalf = toothArc * 0.22
  const valleyHalf = toothArc * 0.22

  for (let i = 0; i < teeth; i++) {
    const angle = i * toothArc - Math.PI / 2
    // Start of tooth rise
    const a0 = angle - tipHalf - valleyHalf
    // Outer tooth corners
    const a1 = angle - tipHalf
    const a2 = angle + tipHalf
    // End of tooth, start of valley
    const a3 = angle + tipHalf + valleyHalf

    if (i === 0) {
      points.push(
        `M${cx + innerR * Math.cos(a0)},${cy + innerR * Math.sin(a0)}`
      )
    }
    points.push(
      `L${cx + outerR * Math.cos(a1)},${cy + outerR * Math.sin(a1)}`
    )
    points.push(
      `L${cx + outerR * Math.cos(a2)},${cy + outerR * Math.sin(a2)}`
    )
    points.push(
      `L${cx + innerR * Math.cos(a3)},${cy + innerR * Math.sin(a3)}`
    )
  }
  points.push('Z')

  // Center hole (counter-clockwise for cutout via even-odd rule)
  const holeSteps = 32
  for (let i = 0; i <= holeSteps; i++) {
    const a = (-i * 2 * Math.PI) / holeSteps
    const cmd = i === 0 ? 'M' : 'L'
    points.push(`${cmd}${cx + holeR * Math.cos(a)},${cy + holeR * Math.sin(a)}`)
  }
  points.push('Z')

  return points.join(' ')
}

const GEAR_PATH = buildGearPath(24, 24, 22, 15, 8, 8)
const GEAR_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path d="${GEAR_PATH}" fill="black" fill-rule="evenodd"/>
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
  textNode.textAlignHorizontal = 'CENTER'

  textNode.y = ICON_SIZE + LABEL_GAP
  // Center text horizontally under the icon
  textNode.x = svgNode.x + (svgNode.width - textNode.width) / 2

  const group = figma.group([svgNode, textNode], figma.currentPage)

  group.setPluginData('type', 'processor')
  group.setPluginData('label', 'Processor')

  const center = figma.viewport.center
  group.x = center.x - group.width / 2
  group.y = center.y - group.height / 2
}
