import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import type {
  ElementType,
  StructuralType,
  SectionType,
  NeighborItem,
} from '../../shared/types/plugin'

const CORE_ELEMENT_TYPES: readonly ElementType[] = [
  'command',
  'event',
  'query',
  'actor',
]

export interface ConnectedNeighborsPayload {
  sourceId: string | null
  incoming: NeighborItem[]
  outgoing: NeighborItem[]
}

interface ConnectorLike {
  type: string
  connectorStart?: { endpointNodeId?: string }
  connectorEnd?: { endpointNodeId?: string }
}

function resolveNeighbor(node: BaseNode | null): NeighborItem | null {
  if (!node) return null
  const pluginType = node.getPluginData('type')
  const elementType =
    pluginType === ''
      ? 'native'
      : (pluginType as ElementType | StructuralType | SectionType)

  let name = node.name
  if (CORE_ELEMENT_TYPES.includes(elementType as ElementType)) {
    const text = (node as ShapeWithTextNode).text?.characters
    if (text !== undefined && text !== '') {
      name = text
    }
  }

  return { id: node.id, name, elementType }
}

export async function computeConnectedNeighbors({
  figma,
}: MessageHandlerContext): Promise<ConnectedNeighborsPayload> {
  const selection = figma.currentPage.selection
  if (selection.length !== 1) {
    return { sourceId: null, incoming: [], outgoing: [] }
  }

  const sourceId = selection[0].id
  const allConnectors = figma.currentPage.findAll(
    (n) => n.type === 'CONNECTOR'
  ) as unknown as ConnectorLike[]

  const incoming: NeighborItem[] = []
  const outgoing: NeighborItem[] = []
  const seenIncoming = new Set<string>()
  const seenOutgoing = new Set<string>()

  for (const conn of allConnectors) {
    const startId = conn.connectorStart?.endpointNodeId
    const endId = conn.connectorEnd?.endpointNodeId
    if (!startId || !endId) continue

    if (endId === sourceId && startId !== sourceId) {
      if (seenIncoming.has(startId)) continue
      const neighbor = resolveNeighbor(await figma.getNodeByIdAsync(startId))
      if (!neighbor) continue
      seenIncoming.add(startId)
      incoming.push(neighbor)
    } else if (startId === sourceId && endId !== sourceId) {
      if (seenOutgoing.has(endId)) continue
      const neighbor = resolveNeighbor(await figma.getNodeByIdAsync(endId))
      if (!neighbor) continue
      seenOutgoing.add(endId)
      outgoing.push(neighbor)
    }
  }

  return { sourceId, incoming, outgoing }
}

export async function handleConnectedNeighborsUpdate(
  context: MessageHandlerContext
): Promise<void> {
  const payload = await computeConnectedNeighbors(context)
  context.figma.ui.postMessage({
    type: 'connected-neighbors',
    payload,
  })
}

export function registerConnectedNeighborsListener(
  context: MessageHandlerContext
): void {
  context.figma.on('selectionchange', () => {
    void handleConnectedNeighborsUpdate(context)
  })
}

export async function handleNavigateToShape(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { id } = (payload ?? {}) as { id?: string }
  if (!id) {
    figma.ui.postMessage({
      type: 'navigate-to-shape-error',
      payload: { message: 'Missing target node id' },
    })
    return
  }

  try {
    const node = await figma.getNodeByIdAsync(id)
    if (!node || node.type === 'DOCUMENT' || node.type === 'PAGE') {
      figma.ui.postMessage({
        type: 'navigate-to-shape-error',
        payload: { message: `Node not found: ${id}` },
      })
      return
    }

    const sceneNode = node as SceneNode
    figma.currentPage.selection = [sceneNode]
    figma.viewport.scrollAndZoomIntoView([sceneNode])

    figma.ui.postMessage({
      type: 'navigate-to-shape-success',
      payload: { id },
    })
  } catch (error) {
    figma.ui.postMessage({
      type: 'navigate-to-shape-error',
      payload: {
        message: error instanceof Error ? error.message : String(error),
      },
    })
  }
}
