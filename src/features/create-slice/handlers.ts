import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

export async function handleCreateSlice(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const section = figma.createSection()

  section.name = 'Slice'
  section.setPluginData('type', 'slice')
  section.setPluginData('label', 'Slice')

  const center = figma.viewport.center
  section.x = center.x - section.width / 2
  section.y = center.y - section.height / 2

  figma.currentPage.appendChild(section)
}
