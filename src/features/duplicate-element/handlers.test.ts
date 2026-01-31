import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleDuplicateElement } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

function createMockNode(pluginData: Record<string, string> = {}) {
  const data = { ...pluginData }
  const clonedData = { ...pluginData }
  const clonedNode = {
    id: 'cloned-node-id',
    x: 0,
    y: 0,
    setPluginData: vi.fn((key: string, value: string) => {
      clonedData[key] = value
    }),
    getPluginData: vi.fn((key: string) => clonedData[key] || ''),
    getPluginDataKeys: vi.fn(() => Object.keys(clonedData)),
  }
  return {
    node: {
      id: 'original-node-id',
      x: 100,
      y: 200,
      setPluginData: vi.fn((key: string, value: string) => {
        data[key] = value
      }),
      getPluginData: vi.fn((key: string) => data[key] || ''),
      getPluginDataKeys: vi.fn(() => Object.keys(data)),
      clone: vi.fn(() => clonedNode),
    },
    clonedNode,
  }
}

describe('handleDuplicateElement', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('does nothing when node is not found', async () => {
    figmaMock.getNodeById.mockReturnValue(null)

    await handleDuplicateElement(
      { id: 'nonexistent' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.currentPage.appendChild).not.toHaveBeenCalled()
  })

  it('clones the selected node', async () => {
    const { node } = createMockNode({ type: 'command', label: 'MyCommand' })
    figmaMock.getNodeById.mockReturnValue(node)

    await handleDuplicateElement(
      { id: 'original-node-id' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(node.clone).toHaveBeenCalled()
  })

  it('copies all plugin data keys to the cloned node', async () => {
    const { node, clonedNode } = createMockNode({
      type: 'command',
      label: 'MyCommand',
      customFields: 'field1\nfield2',
      notes: 'some notes',
      fieldsVisible: 'true',
    })
    figmaMock.getNodeById.mockReturnValue(node)

    await handleDuplicateElement(
      { id: 'original-node-id' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(clonedNode.setPluginData).toHaveBeenCalledWith('type', 'command')
    expect(clonedNode.setPluginData).toHaveBeenCalledWith('label', 'MyCommand')
    expect(clonedNode.setPluginData).toHaveBeenCalledWith(
      'customFields',
      'field1\nfield2'
    )
    expect(clonedNode.setPluginData).toHaveBeenCalledWith('notes', 'some notes')
    expect(clonedNode.setPluginData).toHaveBeenCalledWith(
      'fieldsVisible',
      'true'
    )
  })

  it('copies external flag for event elements', async () => {
    const { node, clonedNode } = createMockNode({
      type: 'event',
      label: 'MyEvent',
      external: 'true',
    })
    figmaMock.getNodeById.mockReturnValue(node)

    await handleDuplicateElement(
      { id: 'original-node-id' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(clonedNode.setPluginData).toHaveBeenCalledWith('external', 'true')
  })

  it('offsets the cloned node from the original position', async () => {
    const { node, clonedNode } = createMockNode({
      type: 'command',
      label: 'Cmd',
    })
    node.x = 100
    node.y = 200
    figmaMock.getNodeById.mockReturnValue(node)

    await handleDuplicateElement(
      { id: 'original-node-id' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(clonedNode.x).toBeGreaterThan(100)
    expect(clonedNode.y).toBeGreaterThan(200)
  })

  it('appends the cloned node to the current page', async () => {
    const { node, clonedNode } = createMockNode({
      type: 'query',
      label: 'MyQuery',
    })
    figmaMock.getNodeById.mockReturnValue(node)

    await handleDuplicateElement(
      { id: 'original-node-id' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(clonedNode)
  })

  it('selects the cloned node after creation', async () => {
    const { node, clonedNode } = createMockNode({
      type: 'command',
      label: 'Cmd',
    })
    figmaMock.getNodeById.mockReturnValue(node)

    await handleDuplicateElement(
      { id: 'original-node-id' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.currentPage.selection).toEqual([clonedNode])
  })
})
