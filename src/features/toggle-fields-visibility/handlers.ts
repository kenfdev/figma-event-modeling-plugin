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

  const node = (await figma.getNodeByIdAsync(id)) as SceneNode | null
  if (!node) {
    return
  }

  const currentValue = node.getPluginData('fieldsVisible')
  const newValue = currentValue === 'true' ? 'false' : 'true'

  if ('resize' in node) {
    const resizableNode = node as SceneNode & {
      resize: (w: number, h: number) => void
      text: { characters: string }
    }
    const label = node.getPluginData('label')
    const customFields = node.getPluginData('customFields')
    const lines = customFields ? customFields.split('\n').filter((l) => l.length > 0) : []

    const hasText = 'text' in resizableNode && resizableNode.text != null

    if (hasText) {
      await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
    }

    const hasCornerRadius = 'cornerRadius' in resizableNode
    const savedCornerRadius = hasCornerRadius
      ? (resizableNode as unknown as { cornerRadius: number }).cornerRadius
      : undefined

    if (newValue === 'true') {
      const expandedHeight =
        lines.length > 0 ? BASE_HEIGHT + lines.length * LINE_HEIGHT : BASE_HEIGHT
      resizableNode.resize(BASE_WIDTH, expandedHeight)
      if (hasText) {
        resizableNode.text.characters =
          lines.length > 0 ? label + '\n' + lines.join('\n') : label
      }
    } else {
      resizableNode.resize(BASE_WIDTH, BASE_HEIGHT)
      if (hasText) {
        resizableNode.text.characters = label
      }
    }

    if (hasCornerRadius && savedCornerRadius !== undefined) {
      ;(resizableNode as unknown as { cornerRadius: number }).cornerRadius = savedCornerRadius
    }
  }

  node.setPluginData('fieldsVisible', newValue)
}
