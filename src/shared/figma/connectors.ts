interface FigmaCreateConnector {
  createConnector(): {
    id: string
    connectorStart: unknown
    connectorEnd: unknown
    connectorLineType: string
    connectorStartStrokeCap?: string
    connectorEndStrokeCap?: string
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

interface ChainPairRecord {
  source: ChainCategory
  target: ChainCategory
  magnetSource: ConnectorMagnet
  magnetTarget: ConnectorMagnet
}

const CHAIN_FORWARD_PAIRS: ReadonlyArray<ChainPairRecord> = [
  { source: 'command', target: 'event', magnetSource: 'BOTTOM', magnetTarget: 'TOP' },
  { source: 'event', target: 'query', magnetSource: 'TOP', magnetTarget: 'BOTTOM' },
  { source: 'query', target: 'screen', magnetSource: 'TOP', magnetTarget: 'BOTTOM' },
  { source: 'screen', target: 'command', magnetSource: 'BOTTOM', magnetTarget: 'TOP' },
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
): { direction: 'forward' | 'reverse' | 'none'; pair: ChainPairRecord | null } {
  if (!a || !b || a === b) return { direction: 'none', pair: null }
  for (const pair of CHAIN_FORWARD_PAIRS) {
    if (a === pair.source && b === pair.target) return { direction: 'forward', pair }
    if (a === pair.target && b === pair.source) return { direction: 'reverse', pair }
  }
  return { direction: 'none', pair: null }
}

export function createConnector(
  figma: FigmaCreateConnector,
  source: NodeLike,
  target: NodeLike,
  options: ConnectorOptions = {}
) {
  const { direction, pair } = chainNeighborDirection(
    getChainCategory(readType(source)),
    getChainCategory(readType(target))
  )

  let actualSource = source
  let actualTarget = target
  let magnetSource: ConnectorMagnet = options.magnetSource ?? 'AUTO'
  let magnetTarget: ConnectorMagnet = options.magnetTarget ?? 'AUTO'

  if (direction !== 'none' && pair) {
    if (direction === 'reverse') {
      actualSource = target
      actualTarget = source
    }
    magnetSource = pair.magnetSource
    magnetTarget = pair.magnetTarget
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

  if (direction !== 'none') {
    connector.connectorStartStrokeCap = 'NONE'
    connector.connectorEndStrokeCap = 'ARROW_LINES'
  }

  return connector
}
