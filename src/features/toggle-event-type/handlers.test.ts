import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleToggleEventType } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleToggleEventType', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('sets external plugin data to "true" when toggled to external', async () => {
    const mockNode = {
      id: 'node-1',
      fills: [{ type: 'SOLID', color: { r: 1, g: 0.62, b: 0.26 } }],
      strokes: [{ type: 'SOLID', color: { r: 0xeb / 255, g: 0x75 / 255, b: 0x00 / 255 } }],
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleToggleEventType(
      { id: 'node-1', external: true },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('external', 'true')
  })

  it('sets external plugin data to "false" when toggled to internal', async () => {
    const mockNode = {
      id: 'node-1',
      fills: [{ type: 'SOLID', color: { r: 0.61, g: 0.35, b: 0.71 } }],
      strokes: [{ type: 'SOLID', color: { r: 0x7d / 255, g: 0x3c / 255, b: 0x98 / 255 } }],
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleToggleEventType(
      { id: 'node-1', external: false },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('external', 'false')
  })

  it('changes fill color to purple (#9B59B6) when toggled to external', async () => {
    const mockNode = {
      id: 'node-1',
      fills: [{ type: 'SOLID', color: { r: 1, g: 0.62, b: 0.26 } }],
      strokes: [{ type: 'SOLID', color: { r: 0xeb / 255, g: 0x75 / 255, b: 0x00 / 255 } }],
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleToggleEventType(
      { id: 'node-1', external: true },
      { figma: figmaMock as unknown as typeof figma }
    )

    const fill = mockNode.fills[0]
    expect(fill.color.r).toBeCloseTo(0x9b / 255, 2)
    expect(fill.color.g).toBeCloseTo(0x59 / 255, 2)
    expect(fill.color.b).toBeCloseTo(0xb6 / 255, 2)
  })

  it('changes fill color to orange (#FF9E42) when toggled to internal', async () => {
    const mockNode = {
      id: 'node-1',
      fills: [{ type: 'SOLID', color: { r: 0.61, g: 0.35, b: 0.71 } }],
      strokes: [{ type: 'SOLID', color: { r: 0x7d / 255, g: 0x3c / 255, b: 0x98 / 255 } }],
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleToggleEventType(
      { id: 'node-1', external: false },
      { figma: figmaMock as unknown as typeof figma }
    )

    const fill = mockNode.fills[0]
    expect(fill.color.r).toBeCloseTo(0xff / 255, 2)
    expect(fill.color.g).toBeCloseTo(0x9e / 255, 2)
    expect(fill.color.b).toBeCloseTo(0x42 / 255, 2)
  })

  it('changes stroke color to purple (#7D3C98) when toggled to external', async () => {
    const mockNode = {
      id: 'node-1',
      fills: [{ type: 'SOLID', color: { r: 1, g: 0.62, b: 0.26 } }],
      strokes: [{ type: 'SOLID', color: { r: 0xeb / 255, g: 0x75 / 255, b: 0x00 / 255 } }],
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleToggleEventType(
      { id: 'node-1', external: true },
      { figma: figmaMock as unknown as typeof figma }
    )

    const stroke = mockNode.strokes[0]
    expect(stroke.color.r).toBeCloseTo(0x7d / 255, 2)
    expect(stroke.color.g).toBeCloseTo(0x3c / 255, 2)
    expect(stroke.color.b).toBeCloseTo(0x98 / 255, 2)
  })

  it('changes stroke color to orange (#EB7500) when toggled to internal', async () => {
    const mockNode = {
      id: 'node-1',
      fills: [{ type: 'SOLID', color: { r: 0.61, g: 0.35, b: 0.71 } }],
      strokes: [{ type: 'SOLID', color: { r: 0x7d / 255, g: 0x3c / 255, b: 0x98 / 255 } }],
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleToggleEventType(
      { id: 'node-1', external: false },
      { figma: figmaMock as unknown as typeof figma }
    )

    const stroke = mockNode.strokes[0]
    expect(stroke.color.r).toBeCloseTo(0xeb / 255, 2)
    expect(stroke.color.g).toBeCloseTo(0x75 / 255, 2)
    expect(stroke.color.b).toBeCloseTo(0x00 / 255, 2)
  })

  it('does nothing when node is not found', async () => {
    figmaMock.getNodeById.mockReturnValue(null)

    await handleToggleEventType(
      { id: 'nonexistent', external: true },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled()
  })
})
