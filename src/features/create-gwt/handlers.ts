import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const PARENT_WIDTH = 400
const PARENT_HEIGHT = 600
const CHILD_WIDTH = 350
const CHILD_HEIGHT = 180

const CHILD_NAMES = ['Given', 'When', 'Then'] as const

export async function handleCreateGWT(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const parent = figma.createSection()

  parent.name = 'GWT'
  parent.setPluginData('type', 'gwt')
  parent.resizeWithoutConstraints(PARENT_WIDTH, PARENT_HEIGHT)

  const center = figma.viewport.center
  parent.x = center.x - PARENT_WIDTH / 2
  parent.y = center.y - PARENT_HEIGHT / 2

  for (const name of CHILD_NAMES) {
    const child = figma.createSection()
    child.name = name
    child.resizeWithoutConstraints(CHILD_WIDTH, CHILD_HEIGHT)
    parent.appendChild(child)
  }

  figma.currentPage.appendChild(parent)
}
