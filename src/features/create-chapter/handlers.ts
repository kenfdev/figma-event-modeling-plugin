import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

const CONNECTOR_WIDTH = 200

export async function handleCreateChapter(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const connector = figma.createConnector()

  const center = figma.viewport.center

  connector.connectorStart = {
    endpointNodeId: '',
    magnet: 'NONE',
    position: { x: center.x - CONNECTOR_WIDTH / 2, y: center.y },
  }
  connector.connectorEnd = {
    endpointNodeId: '',
    magnet: 'NONE',
    position: { x: center.x + CONNECTOR_WIDTH / 2, y: center.y },
  }

  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
  connector.text.characters = 'Chapter'

  connector.setPluginData('type', 'chapter')
  connector.setPluginData('label', 'Chapter')

  figma.currentPage.appendChild(connector)
}
