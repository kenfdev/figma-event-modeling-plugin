import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const CONNECTOR_WIDTH = 200
const CONNECTOR_COLOR = { r: 0, g: 1, b: 1 } // Cyan

export async function handleCreateChapter(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const connector = figma.createConnector()

  const center = figma.viewport.center

  connector.connectorStart = {
    position: { x: center.x - CONNECTOR_WIDTH / 2, y: center.y },
  }
  connector.connectorEnd = {
    position: { x: center.x + CONNECTOR_WIDTH / 2, y: center.y },
  }

  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  connector.text.characters = 'Chapter'
  connector.text.fills = [{ type: 'SOLID', color: CONNECTOR_COLOR }]

  connector.strokes = [{ type: 'SOLID', color: CONNECTOR_COLOR }]

  connector.setPluginData('type', 'chapter')
  connector.setPluginData('label', 'Chapter')

  figma.currentPage.appendChild(connector)
}
