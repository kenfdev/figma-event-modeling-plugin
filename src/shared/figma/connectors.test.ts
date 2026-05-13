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

    it('applies canonical anchors when reversing a chain pair, ignoring caller magnets', () => {
      const source = nodeWithType('q-id', 'query')
      const target = nodeWithType('e-id', 'event')

      const connector = createConnector(figmaMock, source, target, {
        magnetSource: 'LEFT',
        magnetTarget: 'RIGHT',
      })

      // event → query in chain direction: event is source (TOP), query is target (BOTTOM)
      expect((connector.connectorStart as any).endpointNodeId).toBe('e-id')
      expect((connector.connectorStart as any).magnet).toBe('TOP')
      expect((connector.connectorEnd as any).endpointNodeId).toBe('q-id')
      expect((connector.connectorEnd as any).magnet).toBe('BOTTOM')
    })

    it('honors caller magnet options for non-chain pairs', () => {
      const source = nodeWithType('a-id', 'actor')
      const target = nodeWithType('cmd-id', 'command')

      const connector = createConnector(figmaMock, source, target, {
        magnetSource: 'TOP',
        magnetTarget: 'BOTTOM',
      })

      expect((connector.connectorStart as any).magnet).toBe('TOP')
      expect((connector.connectorEnd as any).magnet).toBe('BOTTOM')
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

  describe('chain-direction anchors', () => {
    function nodeWithType(id: string, type: string) {
      return { id, getPluginData: (key: string) => (key === 'type' ? type : '') }
    }

    it.each([
      { src: 'command', tgt: 'event', magnetSource: 'BOTTOM', magnetTarget: 'TOP' },
      { src: 'event', tgt: 'query', magnetSource: 'TOP', magnetTarget: 'BOTTOM' },
      { src: 'query', tgt: 'screen', magnetSource: 'TOP', magnetTarget: 'BOTTOM' },
      { src: 'screen', tgt: 'command', magnetSource: 'BOTTOM', magnetTarget: 'TOP' },
    ])(
      'anchors $src→$tgt at source=$magnetSource and target=$magnetTarget',
      ({ src, tgt, magnetSource, magnetTarget }) => {
        const source = nodeWithType('src-id', src)
        const target = nodeWithType('tgt-id', tgt)

        const connector = createConnector(figmaMock, source, target)

        expect((connector.connectorStart as any).endpointNodeId).toBe('src-id')
        expect((connector.connectorStart as any).magnet).toBe(magnetSource)
        expect((connector.connectorEnd as any).endpointNodeId).toBe('tgt-id')
        expect((connector.connectorEnd as any).magnet).toBe(magnetTarget)
      }
    )

    it.each([
      { selSrc: 'event', selTgt: 'command', chainSrcId: 'sel-tgt', chainTgtId: 'sel-src', magnetSource: 'BOTTOM', magnetTarget: 'TOP' },
      { selSrc: 'query', selTgt: 'event', chainSrcId: 'sel-tgt', chainTgtId: 'sel-src', magnetSource: 'TOP', magnetTarget: 'BOTTOM' },
      { selSrc: 'screen', selTgt: 'query', chainSrcId: 'sel-tgt', chainTgtId: 'sel-src', magnetSource: 'TOP', magnetTarget: 'BOTTOM' },
      { selSrc: 'command', selTgt: 'screen', chainSrcId: 'sel-tgt', chainTgtId: 'sel-src', magnetSource: 'BOTTOM', magnetTarget: 'TOP' },
    ])(
      'anchors $selSrc→$selTgt (reverse selection) with canonical magnets',
      ({ selSrc, selTgt, chainSrcId, chainTgtId, magnetSource, magnetTarget }) => {
        const source = nodeWithType('sel-src', selSrc)
        const target = nodeWithType('sel-tgt', selTgt)

        const connector = createConnector(figmaMock, source, target)

        expect((connector.connectorStart as any).endpointNodeId).toBe(chainSrcId)
        expect((connector.connectorStart as any).magnet).toBe(magnetSource)
        expect((connector.connectorEnd as any).endpointNodeId).toBe(chainTgtId)
        expect((connector.connectorEnd as any).magnet).toBe(magnetTarget)
      }
    )

    it.each([
      // processor substituted for screen in query→screen
      { srcType: 'query', tgtType: 'processor', chainSrcId: 'src-id', chainTgtId: 'tgt-id', magnetSource: 'TOP', magnetTarget: 'BOTTOM' },
      { srcType: 'processor', tgtType: 'query', chainSrcId: 'tgt-id', chainTgtId: 'src-id', magnetSource: 'TOP', magnetTarget: 'BOTTOM' },
      // processor substituted for screen in screen→command
      { srcType: 'processor', tgtType: 'command', chainSrcId: 'src-id', chainTgtId: 'tgt-id', magnetSource: 'BOTTOM', magnetTarget: 'TOP' },
      { srcType: 'command', tgtType: 'processor', chainSrcId: 'tgt-id', chainTgtId: 'src-id', magnetSource: 'BOTTOM', magnetTarget: 'TOP' },
    ])(
      'processor parity for $srcType→$tgtType',
      ({ srcType, tgtType, chainSrcId, chainTgtId, magnetSource, magnetTarget }) => {
        const source = nodeWithType('src-id', srcType)
        const target = nodeWithType('tgt-id', tgtType)

        const connector = createConnector(figmaMock, source, target)

        expect((connector.connectorStart as any).endpointNodeId).toBe(chainSrcId)
        expect((connector.connectorStart as any).magnet).toBe(magnetSource)
        expect((connector.connectorEnd as any).endpointNodeId).toBe(chainTgtId)
        expect((connector.connectorEnd as any).magnet).toBe(magnetTarget)
        expect((connector as any).connectorStartStrokeCap).toBe('NONE')
        expect((connector as any).connectorEndStrokeCap).toBe('ARROW_LINES')
      }
    )
  })

  describe('chain-direction arrowheads', () => {
    function nodeWithType(id: string, type: string) {
      return { id, getPluginData: (key: string) => (key === 'type' ? type : '') }
    }

    it.each([
      ['command', 'event'],
      ['event', 'query'],
      ['query', 'screen'],
      ['screen', 'command'],
    ])('renders a single arrowhead at the target end for %s→%s', (src, tgt) => {
      const source = nodeWithType('src-id', src)
      const target = nodeWithType('tgt-id', tgt)

      const connector = createConnector(figmaMock, source, target)

      expect((connector as any).connectorStartStrokeCap).toBe('NONE')
      expect((connector as any).connectorEndStrokeCap).toBe('ARROW_LINES')
    })

    it.each([
      ['screen', 'command'],
      ['command', 'screen'],
    ])('removes the double arrowhead on screen↔command (selection order %s→%s)', (src, tgt) => {
      const source = nodeWithType('src-id', src)
      const target = nodeWithType('tgt-id', tgt)

      const connector = createConnector(figmaMock, source, target)

      expect((connector as any).connectorStartStrokeCap).toBe('NONE')
      expect((connector as any).connectorEndStrokeCap).toBe('ARROW_LINES')
    })

    it('leaves stroke caps untouched for actor+command (non-chain)', () => {
      const source = nodeWithType('a-id', 'actor')
      const target = nodeWithType('cmd-id', 'command')

      const connector = createConnector(figmaMock, source, target)

      expect((connector as any).connectorStartStrokeCap).toBeUndefined()
      expect((connector as any).connectorEndStrokeCap).toBeUndefined()
    })

    it('leaves stroke caps untouched for event+screen (non-adjacent chain pair)', () => {
      const source = nodeWithType('s-id', 'screen')
      const target = nodeWithType('e-id', 'event')

      const connector = createConnector(figmaMock, source, target)

      expect((connector as any).connectorStartStrokeCap).toBeUndefined()
      expect((connector as any).connectorEndStrokeCap).toBeUndefined()
    })

    it('leaves stroke caps untouched for event+event (same-type)', () => {
      const source = nodeWithType('e1-id', 'event')
      const target = nodeWithType('e2-id', 'event')

      const connector = createConnector(figmaMock, source, target)

      expect((connector as any).connectorStartStrokeCap).toBeUndefined()
      expect((connector as any).connectorEndStrokeCap).toBeUndefined()
    })

    it('leaves stroke caps untouched when nodes have no getPluginData', () => {
      const connector = createConnector(figmaMock, { id: 'a' }, { id: 'b' })

      expect((connector as any).connectorStartStrokeCap).toBeUndefined()
      expect((connector as any).connectorEndStrokeCap).toBeUndefined()
    })

    it('leaves stroke caps untouched and honors AUTO for non-chain magnets', () => {
      const source = nodeWithType('a-id', 'actor')
      const target = nodeWithType('cmd-id', 'command')

      const connector = createConnector(figmaMock, source, target)

      expect((connector.connectorStart as any).magnet).toBe('AUTO')
      expect((connector.connectorEnd as any).magnet).toBe('AUTO')
      expect((connector as any).connectorStartStrokeCap).toBeUndefined()
      expect((connector as any).connectorEndStrokeCap).toBeUndefined()
    })
  })
})
