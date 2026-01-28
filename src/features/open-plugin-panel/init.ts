import { createMessageRouter } from './handlers'
import type { PluginMessage } from '../../shared/types/plugin'

export interface InitializePluginContext {
  figma: typeof figma
}

export function initializePlugin({ figma }: InitializePluginContext): void {
  // Show the UI panel
  figma.showUI(__html__, {
    width: 300,
    height: 400,
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
