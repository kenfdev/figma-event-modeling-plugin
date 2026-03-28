import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleChangeElementType } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleChangeElementType', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  function createMockNode(overrides: {
    type: string
    external?: string
    label?: string
    customFields?: string
    notes?: string
  }) {
    return {
      id: 'node-1',
      name: overrides.label ?? 'Element',
      fills: [
        { type: 'SOLID' as const, color: { r: 0, g: 0, b: 0 } },
      ],
      strokes: [
        { type: 'SOLID' as const, color: { r: 0, g: 0, b: 0 } },
      ],
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return overrides.type
        if (key === 'external') return overrides.external ?? ''
        if (key === 'label') return overrides.label ?? 'Element'
        if (key === 'customFields') return overrides.customFields ?? ''
        if (key === 'notes') return overrides.notes ?? ''
        return ''
      }),
      resize: vi.fn(),
      text: { characters: overrides.label ?? 'Element', fills: [] },
    }
  }

  it('updates type plugin data to the new type', async () => {
    const mockNode = createMockNode({ type: 'command' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleChangeElementType(
      { id: 'node-1', newType: 'event' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('type', 'event')
  })

  it('updates fill and stroke colors to command colors', async () => {
    const mockNode = createMockNode({ type: 'event' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleChangeElementType(
      { id: 'node-1', newType: 'command' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.fills).toEqual([
      { type: 'SOLID', color: { r: 0x3d / 255, g: 0xad / 255, b: 0xff / 255 } },
    ])
    expect(mockNode.strokes).toEqual([
      { type: 'SOLID', color: { r: 0x00 / 255, g: 0x7a / 255, b: 0xd2 / 255 } },
    ])
  })

  it('updates fill and stroke colors to event colors', async () => {
    const mockNode = createMockNode({ type: 'command' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleChangeElementType(
      { id: 'node-1', newType: 'event' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.fills).toEqual([
      { type: 'SOLID', color: { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 } },
    ])
    expect(mockNode.strokes).toEqual([
      { type: 'SOLID', color: { r: 0xeb / 255, g: 0x75 / 255, b: 0x00 / 255 } },
    ])
  })

  it('updates fill and stroke colors to query colors', async () => {
    const mockNode = createMockNode({ type: 'command' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleChangeElementType(
      { id: 'node-1', newType: 'query' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.fills).toEqual([
      { type: 'SOLID', color: { r: 0x7e / 255, g: 0xd3 / 255, b: 0x21 / 255 } },
    ])
    expect(mockNode.strokes).toEqual([
      { type: 'SOLID', color: { r: 0x5b / 255, g: 0xa5 / 255, b: 0x18 / 255 } },
    ])
  })

  it('clears external flag when converting from event to command', async () => {
    const mockNode = createMockNode({ type: 'event', external: 'true' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleChangeElementType(
      { id: 'node-1', newType: 'command' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('external', '')
  })

  it('clears external flag when converting from event to query', async () => {
    const mockNode = createMockNode({ type: 'event', external: 'true' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleChangeElementType(
      { id: 'node-1', newType: 'query' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('external', '')
  })

  it('does not clear external flag when converting from command to event', async () => {
    const mockNode = createMockNode({ type: 'command' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleChangeElementType(
      { id: 'node-1', newType: 'event' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).not.toHaveBeenCalledWith('external', '')
  })

  it('does nothing when node is not found', async () => {
    figmaMock.getNodeByIdAsync.mockResolvedValue(null)

    await handleChangeElementType(
      { id: 'nonexistent', newType: 'command' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled()
  })

  it('preserves element name, custom fields, and notes (does not overwrite them)', async () => {
    const mockNode = createMockNode({
      type: 'command',
      label: 'PlaceOrder',
      customFields: 'orderId: string',
      notes: 'some notes',
    })
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleChangeElementType(
      { id: 'node-1', newType: 'event' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('type', 'event')
    expect(mockNode.setPluginData).not.toHaveBeenCalledWith('label', expect.anything())
    expect(mockNode.setPluginData).not.toHaveBeenCalledWith('customFields', expect.anything())
    expect(mockNode.setPluginData).not.toHaveBeenCalledWith('notes', expect.anything())
  })

  it('does not change element size', async () => {
    const mockNode = createMockNode({ type: 'command' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleChangeElementType(
      { id: 'node-1', newType: 'event' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.resize).not.toHaveBeenCalled()
  })

  it('re-emits selection data after updating the element', async () => {
    const mockNode = createMockNode({
      type: 'command',
      label: 'PlaceOrder',
      customFields: 'orderId: string',
      notes: 'important note',
    })
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)
    figmaMock.currentPage.selection = [mockNode as unknown as SceneNode]

    await handleChangeElementType(
      { id: 'node-1', newType: 'event' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          id: 'node-1',
          type: 'event',
        }),
      })
    )
  })
})
