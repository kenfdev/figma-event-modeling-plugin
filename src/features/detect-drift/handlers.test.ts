import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleSelectionForDrift, handleSyncDrift } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

function createMockShapeNode(
  id: string,
  type: string,
  options: {
    label?: string
    canvasText?: string
    locked?: boolean
    strokes?: Array<{ type: string; color: { r: number; g: number; b: number } }>
    hasOriginalStroke?: boolean
  } = {}
) {
  const label = options.label ?? 'MyElement'
  const canvasText = options.canvasText ?? label
  const strokes = options.strokes ?? [
    { type: 'SOLID', color: { r: 0, g: 0, b: 1 } },
  ]
  const hasOriginalStroke = options.hasOriginalStroke ?? false
  return {
    id,
    name: canvasText,
    locked: options.locked ?? false,
    text: { characters: canvasText, fills: [] },
    strokes: [...strokes],
    getPluginData: vi.fn((key: string) => {
      if (key === 'type') return type
      if (key === 'label') return label
      if (hasOriginalStroke) {
        if (key === 'originalStrokeR') return String(strokes[0]?.color.r ?? '')
        if (key === 'originalStrokeG') return String(strokes[0]?.color.g ?? '')
        if (key === 'originalStrokeB') return String(strokes[0]?.color.b ?? '')
      }
      return ''
    }),
    setPluginData: vi.fn(),
  }
}

describe('handleSelectionForDrift', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('sends drift-detected when canvas text differs from plugin data label', () => {
    const node = createMockShapeNode('node-1', 'command', {
      label: 'CreateOrder',
      canvasText: 'EditedOnCanvas',
    })
    figmaMock.currentPage.selection = [node]

    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'drift-detected',
      payload: { id: 'node-1', drifted: true },
    })
  })

  it('sends drift-detected with drifted=false when canvas text matches plugin data label', () => {
    const node = createMockShapeNode('node-1', 'command', {
      label: 'CreateOrder',
      canvasText: 'CreateOrder',
    })
    figmaMock.currentPage.selection = [node]

    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'drift-detected',
      payload: { id: 'node-1', drifted: false },
    })
  })

  it('changes stroke to red when drift is detected', () => {
    const node = createMockShapeNode('node-1', 'command', {
      label: 'CreateOrder',
      canvasText: 'EditedOnCanvas',
      strokes: [{ type: 'SOLID', color: { r: 0, g: 0.48, b: 0.82 } }],
    })
    figmaMock.currentPage.selection = [node]

    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(node.strokes).toEqual([
      { type: 'SOLID', color: { r: 1, g: 0, b: 0 } },
    ])
  })

  it('saves original stroke color in plugin data before changing to red', () => {
    const node = createMockShapeNode('node-1', 'command', {
      label: 'CreateOrder',
      canvasText: 'EditedOnCanvas',
      strokes: [{ type: 'SOLID', color: { r: 0, g: 0.48, b: 0.82 } }],
    })
    figmaMock.currentPage.selection = [node]

    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(node.setPluginData).toHaveBeenCalledWith(
      'originalStrokeR',
      String(0)
    )
    expect(node.setPluginData).toHaveBeenCalledWith(
      'originalStrokeG',
      String(0.48)
    )
    expect(node.setPluginData).toHaveBeenCalledWith(
      'originalStrokeB',
      String(0.82)
    )
  })

  it('does not change stroke when canvas text matches plugin data', () => {
    const originalStrokes = [
      { type: 'SOLID', color: { r: 0, g: 0.48, b: 0.82 } },
    ]
    const node = createMockShapeNode('node-1', 'command', {
      label: 'CreateOrder',
      canvasText: 'CreateOrder',
      strokes: originalStrokes,
    })
    figmaMock.currentPage.selection = [node]

    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(node.strokes).toEqual(originalStrokes)
  })

  it.each(['command', 'event', 'query', 'actor'] as const)(
    'detects drift for %s element type',
    (elementType) => {
      const node = createMockShapeNode('node-1', elementType, {
        label: 'Original',
        canvasText: 'Changed',
      })
      figmaMock.currentPage.selection = [node]

      handleSelectionForDrift({
        figma: figmaMock as unknown as typeof figma,
      })

      expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
        type: 'drift-detected',
        payload: { id: 'node-1', drifted: true },
      })
    }
  )

  it('does not check drift for non-core element types (lane)', () => {
    const node = createMockShapeNode('node-1', 'lane', {
      label: 'Original',
      canvasText: 'Changed',
    })
    figmaMock.currentPage.selection = [node]

    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'drift-detected' })
    )
  })

  it('does not check drift for non-plugin elements', () => {
    const node = {
      id: 'node-1',
      name: 'Plain Shape',
      locked: false,
      text: { characters: 'Something' },
      strokes: [],
      getPluginData: vi.fn(() => ''),
      setPluginData: vi.fn(),
    }
    figmaMock.currentPage.selection = [node]

    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'drift-detected' })
    )
  })

  it('does not send drift message when nothing is selected', () => {
    figmaMock.currentPage.selection = []

    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'drift-detected' })
    )
  })

  it('does not send drift message when multiple elements are selected', () => {
    const node1 = createMockShapeNode('node-1', 'command', {
      label: 'A',
      canvasText: 'B',
    })
    const node2 = createMockShapeNode('node-2', 'event', {
      label: 'C',
      canvasText: 'D',
    })
    figmaMock.currentPage.selection = [node1, node2]

    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'drift-detected' })
    )
  })

  it('does not overwrite original stroke color if already saved', () => {
    const pluginData: Record<string, string> = {
      type: 'command',
      label: 'CreateOrder',
      originalStrokeR: '0',
      originalStrokeG: '0.48',
      originalStrokeB: '0.82',
    }
    const node = {
      id: 'node-1',
      name: 'EditedOnCanvas',
      locked: false,
      text: { characters: 'EditedOnCanvas', fills: [] },
      strokes: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }],
      getPluginData: vi.fn((key: string) => pluginData[key] ?? ''),
      setPluginData: vi.fn((key: string, value: string) => {
        pluginData[key] = value
      }),
    }
    figmaMock.currentPage.selection = [node]

    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(node.setPluginData).not.toHaveBeenCalledWith('originalStrokeR', expect.anything())
    expect(node.setPluginData).not.toHaveBeenCalledWith('originalStrokeG', expect.anything())
    expect(node.setPluginData).not.toHaveBeenCalledWith('originalStrokeB', expect.anything())
  })

  it('restores stroke color when previously drifted element is re-selected without drift', () => {
    const node = createMockShapeNode('node-1', 'command', {
      label: 'CreateOrder',
      canvasText: 'EditedOnCanvas',
      strokes: [{ type: 'SOLID', color: { r: 0, g: 0.48, b: 0.82 } }],
    })
    figmaMock.currentPage.selection = [node]

    // First selection: drift detected, stroke turns red
    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })
    expect(node.strokes).toEqual([
      { type: 'SOLID', color: { r: 1, g: 0, b: 0 } },
    ])

    // Simulate canvas text being fixed and re-selection
    node.text.characters = 'CreateOrder'
    node.getPluginData = vi.fn((key: string) => {
      if (key === 'type') return 'command'
      if (key === 'label') return 'CreateOrder'
      if (key === 'originalStrokeR') return '0'
      if (key === 'originalStrokeG') return '0.48'
      if (key === 'originalStrokeB') return '0.82'
      return ''
    })

    handleSelectionForDrift({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(node.strokes).toEqual([
      { type: 'SOLID', color: { r: 0, g: 0.48, b: 0.82 } },
    ])
  })
})

describe('handleSyncDrift', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  function createSyncableNode(
    id: string,
    options: {
      type?: string
      label?: string
      canvasText?: string
      originalStrokeR?: string
      originalStrokeG?: string
      originalStrokeB?: string
    } = {}
  ) {
    const type = options.type ?? 'command'
    const label = options.label ?? 'CreateOrder'
    const canvasText = options.canvasText ?? 'EditedOnCanvas'
    const pluginData: Record<string, string> = {
      type,
      label,
      originalStrokeR: options.originalStrokeR ?? '0',
      originalStrokeG: options.originalStrokeG ?? '0.48',
      originalStrokeB: options.originalStrokeB ?? '0.82',
    }
    return {
      id,
      name: canvasText,
      locked: false,
      text: { characters: canvasText, fills: [] },
      strokes: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }],
      getPluginData: vi.fn((key: string) => pluginData[key] ?? ''),
      setPluginData: vi.fn((key: string, value: string) => {
        pluginData[key] = value
      }),
    }
  }

  it('restores canvas text to plugin data label', async () => {
    const node = createSyncableNode('node-1', {
      label: 'CreateOrder',
      canvasText: 'EditedOnCanvas',
    })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleSyncDrift({ id: 'node-1' }, { figma: figmaMock as unknown as typeof figma })

    expect(node.text.characters).toBe('CreateOrder')
  })

  it('restores original stroke color', async () => {
    const node = createSyncableNode('node-1', {
      originalStrokeR: '0',
      originalStrokeG: '0.48',
      originalStrokeB: '0.82',
    })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleSyncDrift({ id: 'node-1' }, { figma: figmaMock as unknown as typeof figma })

    expect(node.strokes).toEqual([
      { type: 'SOLID', color: { r: 0, g: 0.48, b: 0.82 } },
    ])
  })

  it('cleans up originalStroke plugin data after sync', async () => {
    const node = createSyncableNode('node-1')
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleSyncDrift({ id: 'node-1' }, { figma: figmaMock as unknown as typeof figma })

    expect(node.setPluginData).toHaveBeenCalledWith('originalStrokeR', '')
    expect(node.setPluginData).toHaveBeenCalledWith('originalStrokeG', '')
    expect(node.setPluginData).toHaveBeenCalledWith('originalStrokeB', '')
  })

  it('sends drift-detected with drifted=false after sync', async () => {
    const node = createSyncableNode('node-1')
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleSyncDrift({ id: 'node-1' }, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'drift-detected',
      payload: { id: 'node-1', drifted: false },
    })
  })

  it('does nothing if node is not found', async () => {
    figmaMock.getNodeByIdAsync.mockResolvedValue(null)

    await handleSyncDrift({ id: 'nonexistent' }, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled()
  })

  it('does nothing if node is not a core element type', async () => {
    const node = createSyncableNode('node-1', { type: 'lane' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleSyncDrift({ id: 'node-1' }, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled()
  })

  it('does not restore stroke if original stroke data is missing', async () => {
    const node = createSyncableNode('node-1', {
      originalStrokeR: '',
      originalStrokeG: '',
      originalStrokeB: '',
    })
    const originalStrokes = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]
    node.strokes = [...originalStrokes]
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleSyncDrift({ id: 'node-1' }, { figma: figmaMock as unknown as typeof figma })

    expect(node.strokes).toEqual(originalStrokes)
  })
})
