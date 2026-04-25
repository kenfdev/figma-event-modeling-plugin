interface FigmaCreateConnector {
  createConnector(): {
    id: string
    connectorStart: unknown
    connectorEnd: unknown
    connectorLineType: string
    strokes: readonly unknown[]
  }
}

interface NodeLike {
  id: string
  getPluginData?: (key: string) => string
}

export type ConnectorMagnet =
  | 'AUTO'
  | 'TOP'
  | 'BOTTOM'
  | 'LEFT'
  | 'RIGHT'
  | 'CENTER'
  | 'NONE'

export interface ConnectorOptions {
  magnetSource?: ConnectorMagnet
  magnetTarget?: ConnectorMagnet
}

type ChainCategory = 'event' | 'query' | 'screen' | 'command'

const CHAIN_FORWARD_PAIRS: ReadonlyArray<readonly [ChainCategory, ChainCategory]> = [
  ['event', 'query'],
  ['query', 'screen'],
  ['screen', 'command'],
  ['command', 'event'],
]

function getChainCategory(type: string | undefined): ChainCategory | null {
  if (!type) return null
  if (type === 'event' || type === 'query' || type === 'command') return type
  if (type === 'screen' || type === 'processor') return 'screen'
  return null
}

function readType(node: NodeLike): string | undefined {
  if (typeof node.getPluginData !== 'function') return undefined
  return node.getPluginData('type')
}

function chainNeighborDirection(
  a: ChainCategory | null,
  b: ChainCategory | null
): 'forward' | 'reverse' | 'none' {
  if (!a || !b || a === b) return 'none'
  for (const [src, tgt] of CHAIN_FORWARD_PAIRS) {
    if (a === src && b === tgt) return 'forward'
    if (a === tgt && b === src) return 'reverse'
  }
  return 'none'
}

export function createConnector(
  figma: FigmaCreateConnector,
  source: NodeLike,
  target: NodeLike,
  options: ConnectorOptions = {}
) {
  const direction = chainNeighborDirection(
    getChainCategory(readType(source)),
    getChainCategory(readType(target))
  )

  let actualSource = source
  let actualTarget = target
  let magnetSource = options.magnetSource ?? 'AUTO'
  let magnetTarget = options.magnetTarget ?? 'AUTO'

  if (direction === 'reverse') {
    actualSource = target
    actualTarget = source
    ;[magnetSource, magnetTarget] = [magnetTarget, magnetSource]
  }

  const connector = figma.createConnector()
  connector.connectorStart = {
    endpointNodeId: actualSource.id,
    magnet: magnetSource,
  }
  connector.connectorEnd = {
    endpointNodeId: actualTarget.id,
    magnet: magnetTarget,
  }
  connector.connectorLineType = 'CURVED'
  connector.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
  return connector
}
