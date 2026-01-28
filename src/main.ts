// Plugin sandbox code - runs in Figma's main thread with access to the Figma API

import { createMessageRouter } from './features/open-plugin-panel/sandbox'
import type { PluginMessage } from './shared/types/plugin'

export default function main() {
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
  })

  // Create message router with Figma context
  const handleMessage = createMessageRouter({ figma })

  // Handle messages from the UI
  figma.ui.onmessage = (msg: PluginMessage) => {
    handleMessage(msg)
  }
}
