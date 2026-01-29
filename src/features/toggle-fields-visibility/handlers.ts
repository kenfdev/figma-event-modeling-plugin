import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const BASE_WIDTH = 176
const BASE_HEIGHT = 80
const LINE_HEIGHT = 20

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

  if ('resize' in node) {
    const resizableNode = node as SceneNode & { resize: (w: number, h: number) => void }

    if (newValue === 'true') {
      const customFields = node.getPluginData('customFields')
      const lines = customFields ? customFields.split('\n').filter((l) => l.length > 0) : []
      const expandedHeight =
        lines.length > 0 ? BASE_HEIGHT + lines.length * LINE_HEIGHT : BASE_HEIGHT
      resizableNode.resize(BASE_WIDTH, expandedHeight)
    } else {
      resizableNode.resize(BASE_WIDTH, BASE_HEIGHT)
    }
  }
}
