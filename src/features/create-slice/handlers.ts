import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

export async function handleCreateSlice(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const section = figma.createSection()

  section.name = 'Slice'
  section.setPluginData('type', 'slice')

  const center = figma.viewport.center
  section.x = center.x
  section.y = center.y

  figma.currentPage.appendChild(section)
}
