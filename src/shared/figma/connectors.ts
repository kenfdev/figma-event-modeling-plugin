interface FigmaCreateConnector {
  createConnector(): {
    id: string
    connectorStart: unknown
    connectorEnd: unknown
    connectorLineType: string
    strokes: unknown[]
  }
}

interface NodeLike {
  id: string
}

export function createConnector(
  figma: FigmaCreateConnector,
  source: NodeLike,
  target: NodeLike
): { id: string; connectorStart: unknown; connectorEnd: unknown; connectorLineType: string; strokes: unknown[] } {
  const connector = figma.createConnector()
  connector.connectorStart = { endpointNodeId: source.id, magnet: 'AUTO' }
  connector.connectorEnd = { endpointNodeId: target.id, magnet: 'AUTO' }
  connector.connectorLineType = 'CURVED'
  connector.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
  return connector
}