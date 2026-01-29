import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

interface ToggleFieldsVisibilityPayload {
  id: string
}

export async function handleToggleFieldsVisibility(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { id } = payload as ToggleFieldsVisibilityPayload

  const node = figma.getNodeById(id) as SceneNode | null
  if (!node) {
    return
  }

  const currentValue = node.getPluginData('fieldsVisible')
  const newValue = currentValue === 'true' ? 'false' : 'true'

  node.setPluginData('fieldsVisible', newValue)
}
