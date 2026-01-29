import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

interface UpdateCustomFieldsPayload {
  id: string
  customFields: string
}

export async function handleUpdateCustomFields(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { id, customFields } = payload as UpdateCustomFieldsPayload

  const node = figma.getNodeById(id)
  if (!node) {
    return
  }

  node.setPluginData('customFields', customFields)
}
