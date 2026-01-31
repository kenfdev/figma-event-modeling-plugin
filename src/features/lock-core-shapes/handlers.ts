import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import type { MessageHandler } from '../open-plugin-panel/handlers'

const CORE_ELEMENT_TYPES = new Set(['command', 'event', 'query', 'actor'])

export interface AutoLockManager {
  handleSelectionForLock(context: MessageHandlerContext): void
  handleSelectionForDrift(context: MessageHandlerContext): void
}

export const handleSyncDrift: MessageHandler = (payload, { figma }) => {
  const { id } = payload as { id: string }
  const node = figma.getNodeById(id)
  if (!node) return

  const elementType = node.getPluginData('type')
  if (!CORE_ELEMENT_TYPES.has(elementType)) return

  const label = node.getPluginData('label')
  const textNode = node as unknown as { text: { characters: string } }
  if (textNode.text) {
    textNode.text.characters = label
  }

  // Restore original stroke color
  const shapeNode = node as unknown as {
    strokes: Array<{ type: string; color: { r: number; g: number; b: number } }>
    getPluginData: (key: string) => string
  }
  const origR = shapeNode.getPluginData('originalStrokeR')
  const origG = shapeNode.getPluginData('originalStrokeG')
  const origB = shapeNode.getPluginData('originalStrokeB')
  if (origR && origG && origB) {
    shapeNode.strokes = [
      {
        type: 'SOLID',
        color: {
          r: Number(origR),
          g: Number(origG),
          b: Number(origB),
        },
      },
    ]
  }

  figma.ui.postMessage({
    type: 'drift-detected',
    payload: { id, drifted: false },
  })
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

    handleSelectionForDrift({ figma }: MessageHandlerContext): void {
      const selection = figma.currentPage.selection
      if (selection.length !== 1) return

      const node = selection[0]
      const elementType = node.getPluginData('type')
      if (!CORE_ELEMENT_TYPES.has(elementType)) return

      const label = node.getPluginData('label')
      const canvasText = (node as unknown as { text: { characters: string } }).text?.characters
      if (canvasText === undefined) return

      const drifted = canvasText !== label
      const shapeNode = node as unknown as {
        strokes: Array<{ type: string; color: { r: number; g: number; b: number } }>
        setPluginData: (key: string, value: string) => void
        getPluginData: (key: string) => string
      }

      if (drifted) {
        // Save original stroke color before changing to red
        if (shapeNode.strokes.length > 0) {
          const original = shapeNode.strokes[0].color
          shapeNode.setPluginData('originalStrokeR', String(original.r))
          shapeNode.setPluginData('originalStrokeG', String(original.g))
          shapeNode.setPluginData('originalStrokeB', String(original.b))
        }
        shapeNode.strokes = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]
      } else {
        // Restore original stroke color if it was saved
        const origR = shapeNode.getPluginData('originalStrokeR')
        const origG = shapeNode.getPluginData('originalStrokeG')
        const origB = shapeNode.getPluginData('originalStrokeB')
        if (origR && origG && origB) {
          shapeNode.strokes = [
            {
              type: 'SOLID',
              color: {
                r: Number(origR),
                g: Number(origG),
                b: Number(origB),
              },
            },
          ]
        }
      }

      figma.ui.postMessage({
        type: 'drift-detected',
        payload: { id: node.id, drifted },
      })
    },
  }
}
