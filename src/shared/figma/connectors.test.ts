import { describe, it, expect, beforeEach } from 'vitest'
import { createConnector } from './connectors'
import { createFigmaMock } from '../test/mocks/figma'

describe('createConnector', () => {
  let figmaMock: ReturnType<typeof createFigmaMock>

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('sets connectorStart.endpointNodeId to source id', () => {
    const source = { id: 'source-id' }
    const target = { id: 'target-id' }

    const connector = createConnector(figmaMock, source, target)

    expect((connector.connectorStart as any).endpointNodeId).toBe('source-id')
  })

  it('sets connectorEnd.endpointNodeId to target id', () => {
    const source = { id: 'source-id' }
    const target = { id: 'target-id' }

    const connector = createConnector(figmaMock, source, target)

    expect((connector.connectorEnd as any).endpointNodeId).toBe('target-id')
  })

  it('sets connectorStart.magnet to AUTO', () => {
    const source = { id: 'source-id' }
    const target = { id: 'target-id' }

    const connector = createConnector(figmaMock, source, target)

    expect((connector.connectorStart as any).magnet).toBe('AUTO')
  })

  it('sets connectorEnd.magnet to AUTO', () => {
    const source = { id: 'source-id' }
    const target = { id: 'target-id' }

    const connector = createConnector(figmaMock, source, target)

    expect((connector.connectorEnd as any).magnet).toBe('AUTO')
  })

  it('sets connectorLineType to CURVED', () => {
    const source = { id: 'source-id' }
    const target = { id: 'target-id' }

    const connector = createConnector(figmaMock, source, target)

    expect(connector.connectorLineType).toBe('CURVED')
  })

  it('sets strokes to solid black', () => {
    const source = { id: 'source-id' }
    const target = { id: 'target-id' }

    const connector = createConnector(figmaMock, source, target)

    expect(connector.strokes).toEqual([{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }])
  })

  it('returns the created connector node', () => {
    const source = { id: 'source-id' }
    const target = { id: 'target-id' }

    const connector = createConnector(figmaMock, source, target)

    expect(connector).toBeDefined()
    expect(connector.id).toBe('mock-connector-id')
  })

  it('overrides connectorStart.magnet when magnetSource option is provided', () => {
    const connector = createConnector(
      figmaMock,
      { id: 'source-id' },
      { id: 'target-id' },
      { magnetSource: 'TOP' }
    )

    expect((connector.connectorStart as any).magnet).toBe('TOP')
  })

  it('overrides connectorEnd.magnet when magnetTarget option is provided', () => {
    const connector = createConnector(
      figmaMock,
      { id: 'source-id' },
      { id: 'target-id' },
      { magnetTarget: 'BOTTOM' }
    )

    expect((connector.connectorEnd as any).magnet).toBe('BOTTOM')
  })

  it('falls back to AUTO when only one of the magnet options is provided', () => {
    const connector = createConnector(
      figmaMock,
      { id: 'source-id' },
      { id: 'target-id' },
      { magnetSource: 'BOTTOM' }
    )

    expect((connector.connectorStart as any).magnet).toBe('BOTTOM')
    expect((connector.connectorEnd as any).magnet).toBe('AUTO')
  })

  describe('chain-based direction', () => {
    function nodeWithType(id: string, type: string) {
      return { id, getPluginData: (key: string) => (key === 'type' ? type : '') }
    }

    it.each([
      ['event', 'query'],
      ['query', 'screen'],
      ['screen', 'command'],
      ['command', 'event'],
    ])('keeps order when source=%s and target=%s already follow the chain', (src, tgt) => {
      const source = nodeWithType('src-id', src)
      const target = nodeWithType('tgt-id', tgt)

      const connector = createConnector(figmaMock, source, target)

      expect((connector.connectorStart as any).endpointNodeId).toBe('src-id')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('tgt-id')
    })

    it.each([
      ['query', 'event'],
      ['screen', 'query'],
      ['command', 'screen'],
      ['event', 'command'],
    ])('reverses order when source=%s and target=%s violate the chain', (src, tgt) => {
      const source = nodeWithType('src-id', src)
      const target = nodeWithType('tgt-id', tgt)

      const connector = createConnector(figmaMock, source, target)

      expect((connector.connectorStart as any).endpointNodeId).toBe('tgt-id')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('src-id')
    })

    it('treats processor as screen for chain ordering', () => {
      const source = nodeWithType('cmd-id', 'command')
      const target = nodeWithType('proc-id', 'processor')

      const connector = createConnector(figmaMock, source, target)

      // chain: query → processor → command, so processor should be source, command target
      expect((connector.connectorStart as any).endpointNodeId).toBe('proc-id')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('cmd-id')
    })

    it('reorders processor→query the same as screen→query', () => {
      const source = nodeWithType('q-id', 'query')
      const target = nodeWithType('proc-id', 'processor')

      const connector = createConnector(figmaMock, source, target)

      expect((connector.connectorStart as any).endpointNodeId).toBe('q-id')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('proc-id')
    })

    it('preserves selection order for actor pairs (not in chain)', () => {
      const source = nodeWithType('a-id', 'actor')
      const target = nodeWithType('cmd-id', 'command')

      const connector = createConnector(figmaMock, source, target)

      expect((connector.connectorStart as any).endpointNodeId).toBe('a-id')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('cmd-id')
    })

    it('preserves selection order for non-adjacent chain pairs (e.g., event+screen)', () => {
      const source = nodeWithType('s-id', 'screen')
      const target = nodeWithType('e-id', 'event')

      const connector = createConnector(figmaMock, source, target)

      expect((connector.connectorStart as any).endpointNodeId).toBe('s-id')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('e-id')
    })

    it('preserves selection order for same-type pairs (e.g., event+event)', () => {
      const source = nodeWithType('e1-id', 'event')
      const target = nodeWithType('e2-id', 'event')

      const connector = createConnector(figmaMock, source, target)

      expect((connector.connectorStart as any).endpointNodeId).toBe('e1-id')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('e2-id')
    })

    it('preserves selection order when nodes have no getPluginData', () => {
      const connector = createConnector(figmaMock, { id: 'a' }, { id: 'b' })

      expect((connector.connectorStart as any).endpointNodeId).toBe('a')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('b')
    })

    it('preserves selection order when only one node has getPluginData', () => {
      const source = { id: 'a' }
      const target = { id: 'b', getPluginData: () => 'event' }

      const connector = createConnector(figmaMock, source, target)

      expect((connector.connectorStart as any).endpointNodeId).toBe('a')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('b')
    })

    it('swaps magnets when reversing direction', () => {
      const source = nodeWithType('q-id', 'query')
      const target = nodeWithType('e-id', 'event')

      const connector = createConnector(figmaMock, source, target, {
        magnetSource: 'TOP',
        magnetTarget: 'BOTTOM',
      })

      // event becomes the actual source
      expect((connector.connectorStart as any).endpointNodeId).toBe('e-id')
      expect((connector.connectorStart as any).magnet).toBe('BOTTOM')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('q-id')
      expect((connector.connectorEnd as any).magnet).toBe('TOP')
    })

    it('treats external events the same as internal events', () => {
      // External events are still type='event' (external flag is separate plugin data)
      const source = nodeWithType('q-id', 'query')
      const target = nodeWithType('eExt-id', 'event')

      const connector = createConnector(figmaMock, source, target)

      // event → query in chain, so event becomes source
      expect((connector.connectorStart as any).endpointNodeId).toBe('eExt-id')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('q-id')
    })

    it('preserves order for unknown plugin types', () => {
      const source = nodeWithType('a-id', 'lane')
      const target = nodeWithType('b-id', 'event')

      const connector = createConnector(figmaMock, source, target)

      expect((connector.connectorStart as any).endpointNodeId).toBe('a-id')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('b-id')
    })
  })
})