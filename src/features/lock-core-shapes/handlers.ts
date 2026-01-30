import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const CORE_ELEMENT_TYPES = new Set(['command', 'event', 'query', 'actor'])

export interface AutoLockManager {
  handleSelectionForLock(context: MessageHandlerContext): void
}

export function createAutoLockManager(): AutoLockManager {
  const autoUnlockedIds = new Set<string>()

  return {
    handleSelectionForLock({ figma }: MessageHandlerContext): void {
      const selection = figma.currentPage.selection
      const selectedIds = new Set(selection.map((n) => n.id))

      // Re-lock previously auto-unlocked nodes that are no longer selected
      for (const id of autoUnlockedIds) {
        if (!selectedIds.has(id)) {
          const node = figma.getNodeById(id)
          if (node && 'locked' in node) {
            ;(node as SceneNode).locked = true
          }
          autoUnlockedIds.delete(id)
        }
      }

      // Unlock newly selected locked core shapes
      for (const node of selection) {
        const elementType = node.getPluginData('type')
        if (
          CORE_ELEMENT_TYPES.has(elementType) &&
          node.locked &&
          !autoUnlockedIds.has(node.id)
        ) {
          node.locked = false
          autoUnlockedIds.add(node.id)
        }
      }
    },
  }
}
