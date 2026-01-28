// Plugin sandbox code - runs in Figma's main thread with access to the Figma API

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

  // Handle messages from the UI
  figma.ui.onmessage = (msg: { type: string; payload?: unknown }) => {
    switch (msg.type) {
      case 'close':
        figma.closePlugin()
        break
      default:
        console.log('Unknown message type:', msg.type)
    }
  }
}
