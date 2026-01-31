import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import type { MessageHandler } from '../open-plugin-panel/sandbox'

const CORE_ELEMENT_TYPES = new Set(['command', 'event', 'query', 'actor'])

export function handleSelectionForDrift({ figma }: MessageHandlerContext): void {
  const selection = figma.currentPage.selection
  if (selection.length !== 1) return

  const node = selection[0]
  const elementType = node.getPluginData('type')
  if (!CORE_ELEMENT_TYPES.has(elementType)) return

  const label = node.getPluginData('label')
  const canvasText = (node as unknown as { text: { characters: string } }).text
    ?.characters
  if (canvasText === undefined) return

  const drifted = canvasText !== label
  const shapeNode = node as unknown as {
    strokes: Array<{
      type: string
      color: { r: number; g: number; b: number }
    }>
    setPluginData: (key: string, value: string) => void
    getPluginData: (key: string) => string
  }

  if (drifted) {
    // Save original stroke color before changing to red (only if not already saved)
    if (
      shapeNode.strokes.length > 0 &&
      !shapeNode.getPluginData('originalStrokeR')
    ) {
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
    strokes: Array<{
      type: string
      color: { r: number; g: number; b: number }
    }>
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
    // Clean up saved stroke data
    const setData = (
      node as unknown as {
        setPluginData: (key: string, value: string) => void
      }
    ).setPluginData
    setData.call(node, 'originalStrokeR', '')
    setData.call(node, 'originalStrokeG', '')
    setData.call(node, 'originalStrokeB', '')
  }

  figma.ui.postMessage({
    type: 'drift-detected',
    payload: { id, drifted: false },
  })
}
