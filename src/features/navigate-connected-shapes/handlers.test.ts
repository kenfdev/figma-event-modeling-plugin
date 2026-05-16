import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  computeConnectedNeighbors,
  handleConnectedNeighborsUpdate,
  handleNavigateToShape,
  registerConnectedNeighborsListener,
} from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

interface NodeFields {
  id: string
  name?: string
  type?: string
  pluginType?: string
  text?: { characters: string }
}

function createNode(fields: NodeFields) {
  const { id, name = '', type = 'SHAPE_WITH_TEXT', pluginType = '', text } = fields
  return {
    id,
    name,
    type,
    text,
    getPluginData: vi.fn((key: string) => (key === 'type' ? pluginType : '')),
  }
}

function createConnector(startId: string, endId: string) {
  return {
    type: 'CONNECTOR',
    connectorStart: { endpointNodeId: startId },
    connectorEnd: { endpointNodeId: endId },
  }
}

describe('computeConnectedNeighbors', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('returns empty payload when selection is empty', () => {
    figmaMock.currentPage.selection = []

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result).toEqual({ sourceId: null, incoming: [], outgoing: [] })
  })

  it('returns empty payload when multiple nodes are selected', () => {
    figmaMock.currentPage.selection = [
      createNode({ id: 'a' }),
      createNode({ id: 'b' }),
    ]

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result).toEqual({ sourceId: null, incoming: [], outgoing: [] })
  })

  it('returns empty incoming/outgoing when selected node has no connectors', () => {
    figmaMock.currentPage.selection = [createNode({ id: 'a' })]
    figmaMock.currentPage.findAll.mockReturnValue([])

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result).toEqual({ sourceId: 'a', incoming: [], outgoing: [] })
  })

  it('classifies incoming neighbor when connector ends at selected node', () => {
    const source = createNode({ id: 'a' })
    const neighbor = createNode({
      id: 'b',
      pluginType: 'command',
      text: { characters: 'Place Order' },
    })
    figmaMock.currentPage.selection = [source]
    figmaMock.currentPage.findAll.mockReturnValue([createConnector('b', 'a')])
    figmaMock.getNodeById.mockImplementation((id: string) =>
      id === 'b' ? neighbor : null
    )

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result.incoming).toEqual([
      { id: 'b', name: 'Place Order', elementType: 'command' },
    ])
    expect(result.outgoing).toEqual([])
  })

  it('classifies outgoing neighbor when connector starts at selected node', () => {
    const source = createNode({ id: 'a' })
    const neighbor = createNode({
      id: 'b',
      pluginType: 'event',
      text: { characters: 'Order Placed' },
    })
    figmaMock.currentPage.selection = [source]
    figmaMock.currentPage.findAll.mockReturnValue([createConnector('a', 'b')])
    figmaMock.getNodeById.mockImplementation((id: string) =>
      id === 'b' ? neighbor : null
    )

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result.outgoing).toEqual([
      { id: 'b', name: 'Order Placed', elementType: 'event' },
    ])
    expect(result.incoming).toEqual([])
  })

  it('labels native nodes (no plugin type) with elementType "native" and uses node.name', () => {
    const source = createNode({ id: 'a' })
    const native = createNode({ id: 'sticky-1', name: 'Note', pluginType: '' })
    figmaMock.currentPage.selection = [source]
    figmaMock.currentPage.findAll.mockReturnValue([
      createConnector('sticky-1', 'a'),
    ])
    figmaMock.getNodeById.mockReturnValue(native)

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result.incoming).toEqual([
      { id: 'sticky-1', name: 'Note', elementType: 'native' },
    ])
  })

  it('uses node.name for non-core element types like lane', () => {
    const source = createNode({ id: 'a' })
    const lane = createNode({
      id: 'lane-1',
      name: 'My Lane',
      pluginType: 'lane',
      text: { characters: 'should-not-use-this' },
    })
    figmaMock.currentPage.selection = [source]
    figmaMock.currentPage.findAll.mockReturnValue([
      createConnector('a', 'lane-1'),
    ])
    figmaMock.getNodeById.mockReturnValue(lane)

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result.outgoing).toEqual([
      { id: 'lane-1', name: 'My Lane', elementType: 'lane' },
    ])
  })

  it('skips orphan connectors whose endpoint nodes cannot be resolved', () => {
    const source = createNode({ id: 'a' })
    figmaMock.currentPage.selection = [source]
    figmaMock.currentPage.findAll.mockReturnValue([
      createConnector('ghost', 'a'),
    ])
    figmaMock.getNodeById.mockReturnValue(null)

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result.incoming).toEqual([])
    expect(result.outgoing).toEqual([])
  })

  it('skips connectors with missing endpoint ids', () => {
    const source = createNode({ id: 'a' })
    figmaMock.currentPage.selection = [source]
    figmaMock.currentPage.findAll.mockReturnValue([
      { type: 'CONNECTOR', connectorStart: {}, connectorEnd: {} },
    ])

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result.incoming).toEqual([])
    expect(result.outgoing).toEqual([])
  })

  it('ignores self-loop connectors (start and end both = selected)', () => {
    const source = createNode({ id: 'a' })
    figmaMock.currentPage.selection = [source]
    figmaMock.currentPage.findAll.mockReturnValue([createConnector('a', 'a')])

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result.incoming).toEqual([])
    expect(result.outgoing).toEqual([])
  })

  it('deduplicates parallel connectors to the same neighbor in the same direction', () => {
    const source = createNode({ id: 'a' })
    const neighbor = createNode({
      id: 'b',
      pluginType: 'event',
      text: { characters: 'Event B' },
    })
    figmaMock.currentPage.selection = [source]
    figmaMock.currentPage.findAll.mockReturnValue([
      createConnector('a', 'b'),
      createConnector('a', 'b'),
    ])
    figmaMock.getNodeById.mockReturnValue(neighbor)

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result.outgoing).toHaveLength(1)
    expect(result.outgoing[0].id).toBe('b')
  })

  it('lists a neighbor in both incoming and outgoing when connectors run both directions', () => {
    const source = createNode({ id: 'a' })
    const neighbor = createNode({
      id: 'b',
      pluginType: 'query',
      text: { characters: 'Query B' },
    })
    figmaMock.currentPage.selection = [source]
    figmaMock.currentPage.findAll.mockReturnValue([
      createConnector('a', 'b'),
      createConnector('b', 'a'),
    ])
    figmaMock.getNodeById.mockReturnValue(neighbor)

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result.incoming).toHaveLength(1)
    expect(result.outgoing).toHaveLength(1)
  })

  it('falls back to node.name when core element has no text characters', () => {
    const source = createNode({ id: 'a' })
    const command = createNode({
      id: 'cmd-1',
      name: 'Layer Name',
      pluginType: 'command',
    })
    figmaMock.currentPage.selection = [source]
    figmaMock.currentPage.findAll.mockReturnValue([
      createConnector('a', 'cmd-1'),
    ])
    figmaMock.getNodeById.mockReturnValue(command)

    const result = computeConnectedNeighbors({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(result.outgoing).toEqual([
      { id: 'cmd-1', name: 'Layer Name', elementType: 'command' },
    ])
  })
})

describe('handleConnectedNeighborsUpdate', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('posts a connected-neighbors message with computed payload', () => {
    figmaMock.currentPage.selection = [createNode({ id: 'a' })]
    figmaMock.currentPage.findAll.mockReturnValue([])

    handleConnectedNeighborsUpdate({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'connected-neighbors',
      payload: { sourceId: 'a', incoming: [], outgoing: [] },
    })
  })

  it('posts an empty payload when selection is empty', () => {
    figmaMock.currentPage.selection = []

    handleConnectedNeighborsUpdate({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'connected-neighbors',
      payload: { sourceId: null, incoming: [], outgoing: [] },
    })
  })
})

describe('registerConnectedNeighborsListener', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('registers a selectionchange listener', () => {
    registerConnectedNeighborsListener({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.on).toHaveBeenCalledWith(
      'selectionchange',
      expect.any(Function)
    )
  })

  it('invokes handleConnectedNeighborsUpdate when selectionchange fires', () => {
    let cb: (() => void) | null = null
    figmaMock.on = vi.fn((event: string, fn: () => void) => {
      if (event === 'selectionchange') cb = fn
    })
    figmaMock.currentPage.selection = []

    registerConnectedNeighborsListener({
      figma: figmaMock as unknown as typeof figma,
    })
    cb!()

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'connected-neighbors',
      payload: { sourceId: null, incoming: [], outgoing: [] },
    })
  })
})

describe('handleNavigateToShape', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('selects and recenters viewport on the target node, then posts success', async () => {
    const target = { id: 'target-1', type: 'SHAPE_WITH_TEXT' }
    figmaMock.getNodeByIdAsync.mockResolvedValue(target)

    await handleNavigateToShape(
      { id: 'target-1' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.currentPage.selection).toEqual([target])
    expect(figmaMock.viewport.scrollAndZoomIntoView).toHaveBeenCalledWith([
      target,
    ])
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'navigate-to-shape-success',
      payload: { id: 'target-1' },
    })
  })

  it('posts error when target node cannot be found', async () => {
    figmaMock.getNodeByIdAsync.mockResolvedValue(null)

    await handleNavigateToShape(
      { id: 'missing' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.viewport.scrollAndZoomIntoView).not.toHaveBeenCalled()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'navigate-to-shape-error',
      payload: { message: 'Node not found: missing' },
    })
  })

  it('posts error when payload is missing an id', async () => {
    await handleNavigateToShape(
      {},
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.getNodeByIdAsync).not.toHaveBeenCalled()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'navigate-to-shape-error',
      payload: { message: 'Missing target node id' },
    })
  })
})
