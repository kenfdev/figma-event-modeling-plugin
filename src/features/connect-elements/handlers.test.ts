import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleConnectElements } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleConnectElements', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('creates connector with correct connectorStart when exactly 2 elements are selected', async () => {
    const node1 = { id: 'node-1', name: 'First' }
    const node2 = { id: 'node-2', name: 'Second' }
    figmaMock.currentPage.selection = [node1, node2]

    await handleConnectElements(undefined, { figma: figmaMock as unknown as typeof figma })

    const connector = (figmaMock.createConnector as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(connector.connectorStart.endpointNodeId).toBe('node-1')
  })

  it('creates connector with correct connectorEnd when exactly 2 elements are selected', async () => {
    const node1 = { id: 'node-1', name: 'First' }
    const node2 = { id: 'node-2', name: 'Second' }
    figmaMock.currentPage.selection = [node1, node2]

    await handleConnectElements(undefined, { figma: figmaMock as unknown as typeof figma })

    const connector = (figmaMock.createConnector as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(connector.connectorEnd.endpointNodeId).toBe('node-2')
  })

  it('sets connectorLineType to CURVED', async () => {
    const node1 = { id: 'node-1', name: 'First' }
    const node2 = { id: 'node-2', name: 'Second' }
    figmaMock.currentPage.selection = [node1, node2]

    await handleConnectElements(undefined, { figma: figmaMock as unknown as typeof figma })

    const connector = (figmaMock.createConnector as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(connector.connectorLineType).toBe('CURVED')
  })

  it('sets strokes to black solid', async () => {
    const node1 = { id: 'node-1', name: 'First' }
    const node2 = { id: 'node-2', name: 'Second' }
    figmaMock.currentPage.selection = [node1, node2]

    await handleConnectElements(undefined, { figma: figmaMock as unknown as typeof figma })

    const connector = (figmaMock.createConnector as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(connector.strokes).toEqual([{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }])
  })

  it('shows error notification when no elements are selected', async () => {
    figmaMock.currentPage.selection = []

    await handleConnectElements(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.notify).toHaveBeenCalledWith('Select exactly 2 elements to connect')
    expect(figmaMock.createConnector).not.toHaveBeenCalled()
  })

  it('shows error notification when only 1 element is selected', async () => {
    const node1 = { id: 'node-1', name: 'Only One' }
    figmaMock.currentPage.selection = [node1]

    await handleConnectElements(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.notify).toHaveBeenCalledWith('Select exactly 2 elements to connect')
    expect(figmaMock.createConnector).not.toHaveBeenCalled()
  })

  it('shows error notification when more than 2 elements are selected', async () => {
    const node1 = { id: 'node-1', name: 'First' }
    const node2 = { id: 'node-2', name: 'Second' }
    const node3 = { id: 'node-3', name: 'Third' }
    figmaMock.currentPage.selection = [node1, node2, node3]

    await handleConnectElements(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.notify).toHaveBeenCalledWith('Select exactly 2 elements to connect')
    expect(figmaMock.createConnector).not.toHaveBeenCalled()
  })

  it('does not create connector when selection is not exactly 2', async () => {
    figmaMock.currentPage.selection = []

    await handleConnectElements(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.createConnector).not.toHaveBeenCalled()
  })

  describe('chain-based arrow direction', () => {
    function nodeWithType(id: string, type: string) {
      return { id, name: id, getPluginData: (key: string) => (key === 'type' ? type : '') }
    }

    it('reorders to event→query when user selects query first then event', async () => {
      const queryNode = nodeWithType('q-id', 'query')
      const eventNode = nodeWithType('e-id', 'event')
      figmaMock.currentPage.selection = [queryNode, eventNode]

      await handleConnectElements(undefined, { figma: figmaMock as unknown as typeof figma })

      const connector = (figmaMock.createConnector as ReturnType<typeof vi.fn>).mock.results[0].value
      expect(connector.connectorStart.endpointNodeId).toBe('e-id')
      expect(connector.connectorEnd.endpointNodeId).toBe('q-id')
    })

    it('reorders to command→event when user selects event first then command', async () => {
      const eventNode = nodeWithType('e-id', 'event')
      const commandNode = nodeWithType('c-id', 'command')
      figmaMock.currentPage.selection = [eventNode, commandNode]

      await handleConnectElements(undefined, { figma: figmaMock as unknown as typeof figma })

      const connector = (figmaMock.createConnector as ReturnType<typeof vi.fn>).mock.results[0].value
      expect(connector.connectorStart.endpointNodeId).toBe('c-id')
      expect(connector.connectorEnd.endpointNodeId).toBe('e-id')
    })

    it('preserves selection order when types are not chain neighbors (actor + command)', async () => {
      const actorNode = nodeWithType('a-id', 'actor')
      const commandNode = nodeWithType('c-id', 'command')
      figmaMock.currentPage.selection = [actorNode, commandNode]

      await handleConnectElements(undefined, { figma: figmaMock as unknown as typeof figma })

      const connector = (figmaMock.createConnector as ReturnType<typeof vi.fn>).mock.results[0].value
      expect(connector.connectorStart.endpointNodeId).toBe('a-id')
      expect(connector.connectorEnd.endpointNodeId).toBe('c-id')
    })
  })
})