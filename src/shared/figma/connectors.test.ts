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
})