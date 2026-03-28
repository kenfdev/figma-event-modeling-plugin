import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

export async function handleConnectElements(
  _payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const selection = figma.currentPage.selection

  if (selection.length !== 2) {
    figma.notify('Select exactly 2 elements to connect')
    return
  }

  const connector = figma.createConnector()
  connector.connectorStart = { endpointNodeId: selection[0].id, magnet: 'AUTO' }
  connector.connectorEnd = { endpointNodeId: selection[1].id, magnet: 'AUTO' }
  connector.connectorLineType = 'CURVED'
  connector.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
}