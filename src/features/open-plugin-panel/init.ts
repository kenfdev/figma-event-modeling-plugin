import { createMessageRouter } from './handlers'
import type { PluginMessage } from '../../shared/types/plugin'

export interface InitializePluginContext {
  figma: typeof figma
}

export function initializePlugin({ figma }: InitializePluginContext): void {
  const viewportHeight = figma.viewport.bounds.height
  const height = Math.min(1100, Math.max(400, Math.round(viewportHeight * 0.8)))

  figma.showUI(__html__, {
    width: 300,
    height,
    title: 'Event Modeling',
    themeColors: true,
  })

  // Notify UI of the detected platform (let UI handle the error display)
  figma.ui.postMessage({
    type: 'platform-detected',
    payload: { editorType: figma.editorType },
  })

  // Create message router with Figma context
  const handleMessage = createMessageRouter({ figma })

  // Handle messages from the UI
  figma.ui.onmessage = (msg: PluginMessage) => {
    handleMessage(msg)
  }
}
