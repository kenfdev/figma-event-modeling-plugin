import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const DUPLICATE_OFFSET = 30

export async function handleDuplicateElement(
  payload: { id: string },
  { figma }: MessageHandlerContext
): Promise<void> {
  const node = figma.getNodeById(payload.id)
  if (!node) return

  const original = node as SceneNode & {
    clone(): SceneNode
    getPluginDataKeys(): string[]
    getPluginData(key: string): string
  }

  const cloned = original.clone() as SceneNode & {
    setPluginData(key: string, value: string): void
  }

  for (const key of original.getPluginDataKeys()) {
    cloned.setPluginData(key, original.getPluginData(key))
  }

  cloned.x = original.x + DUPLICATE_OFFSET
  cloned.y = original.y + DUPLICATE_OFFSET

  figma.currentPage.appendChild(cloned)
  figma.currentPage.selection = [cloned]
}
