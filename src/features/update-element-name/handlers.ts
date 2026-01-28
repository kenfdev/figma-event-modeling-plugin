import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

interface UpdateElementNamePayload {
  id: string
  name: string
}

export async function handleUpdateElementName(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { id, name } = payload as UpdateElementNamePayload

  const node = figma.getNodeById(id) as ShapeWithTextNode | null
  if (!node) {
    return
  }

  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  node.text.characters = name
  node.setPluginData('label', name)
}
