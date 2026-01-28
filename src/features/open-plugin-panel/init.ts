import { createMessageRouter } from './handlers'
import type { PluginMessage } from '../../shared/types/plugin'

export interface InitializePluginContext {
  figma: typeof figma
}

export function initializePlugin({ figma }: InitializePluginContext): void {
  // Check if running in FigJam
  if (figma.editorType !== 'figjam') {
    figma.closePlugin('This plugin only works in FigJam files.')
    return
  }

  // Show the UI panel
  figma.showUI(__html__, {
    width: 300,
    height: 400,
    title: 'Event Modeling',
    themeColors: true,
  })

  // Create message router with Figma context
  const handleMessage = createMessageRouter({ figma })

  // Handle messages from the UI
  figma.ui.onmessage = (msg: PluginMessage) => {
    handleMessage(msg)
  }
}
