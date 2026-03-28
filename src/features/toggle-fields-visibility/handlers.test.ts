import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleToggleFieldsVisibility } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleToggleFieldsVisibility', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('sets fieldsVisible to "true" when currently unset (default hidden)', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => {
        if (key === 'fieldsVisible') return ''
        return ''
      }),
      resize: vi.fn(),
      text: { characters: 'Command', fills: [] },
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleToggleFieldsVisibility(
      { id: 'node-1' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('fieldsVisible', 'true')
  })

  it('sets fieldsVisible to "true" when currently "false"', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => {
        if (key === 'fieldsVisible') return 'false'
        return ''
      }),
      resize: vi.fn(),
      text: { characters: 'Command', fills: [] },
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleToggleFieldsVisibility(
      { id: 'node-1' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('fieldsVisible', 'true')
  })

  it('sets fieldsVisible to "false" when currently "true"', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => {
        if (key === 'fieldsVisible') return 'true'
        return ''
      }),
      resize: vi.fn(),
      text: { characters: 'Command', fills: [] },
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleToggleFieldsVisibility(
      { id: 'node-1' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('fieldsVisible', 'false')
  })

  it('does nothing when node is not found', async () => {
    figmaMock.getNodeByIdAsync.mockResolvedValue(null)

    await handleToggleFieldsVisibility(
      { id: 'nonexistent' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled()
  })

  it('does not modify customFields plugin data (retains field data when toggling)', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => {
        if (key === 'fieldsVisible') return 'false'
        if (key === 'customFields') return 'field1: value1'
        return ''
      }),
      resize: vi.fn(),
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

    await handleToggleFieldsVisibility(
      { id: 'node-1' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('fieldsVisible', 'true')
    expect(mockNode.setPluginData).not.toHaveBeenCalledWith(
      'customFields',
      expect.anything()
    )
  })

  describe('element resizing and text display', () => {
    function createMockNode(overrides: {
      fieldsVisible: string
      customFields?: string
      label?: string
    }) {
      return {
        id: 'node-1',
        setPluginData: vi.fn(),
        getPluginData: vi.fn((key: string) => {
          if (key === 'fieldsVisible') return overrides.fieldsVisible
          if (key === 'customFields') return overrides.customFields ?? ''
          if (key === 'label') return overrides.label ?? 'Command'
          return ''
        }),
        resize: vi.fn(),
        text: { characters: overrides.label ?? 'Command', fills: [] },
      }
    }

    it('expands element height when toggling fields visible', async () => {
      const mockNode = createMockNode({
        fieldsVisible: 'false',
        customFields: 'field1: string\nfield2: number',
      })
      figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(mockNode.resize).toHaveBeenCalledWith(176, expect.any(Number))
      const newHeight = mockNode.resize.mock.calls[0][1]
      expect(newHeight).toBeGreaterThan(80)
    })

    it('shrinks element back to base height when toggling fields hidden', async () => {
      const mockNode = createMockNode({
        fieldsVisible: 'true',
        label: 'Command',
      })
      figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(mockNode.resize).toHaveBeenCalledWith(176, 80)
    })

    it('uses base height when showing fields but customFields is empty', async () => {
      const mockNode = createMockNode({
        fieldsVisible: 'false',
        customFields: '',
      })
      figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(mockNode.resize).toHaveBeenCalledWith(176, 80)
    })

    it('calculates expanded height based on number of custom field lines', async () => {
      const oneLineMock = createMockNode({
        fieldsVisible: 'false',
        customFields: 'field1: string',
      })
      const threeLineMock = {
        ...createMockNode({
          fieldsVisible: 'false',
          customFields: 'field1: string\nfield2: number\nfield3: boolean',
        }),
        id: 'node-2',
      }

      figmaMock.getNodeByIdAsync.mockResolvedValue(oneLineMock)
      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )
      const oneLineHeight = oneLineMock.resize.mock.calls[0][1]

      figmaMock.getNodeByIdAsync.mockResolvedValue(threeLineMock)
      await handleToggleFieldsVisibility(
        { id: 'node-2' },
        { figma: figmaMock as unknown as typeof figma }
      )
      const threeLineHeight = threeLineMock.resize.mock.calls[0][1]

      expect(threeLineHeight).toBeGreaterThan(oneLineHeight)
    })

    it('keeps width at 176px regardless of toggle direction', async () => {
      const mockNode = createMockNode({
        fieldsVisible: 'false',
        customFields: 'field1: string',
      })
      figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(mockNode.resize).toHaveBeenCalledWith(176, expect.any(Number))
    })

    it('sets text to label + custom fields when showing fields', async () => {
      const mockNode = createMockNode({
        fieldsVisible: 'false',
        customFields: 'userId: string\namount: number',
        label: 'UpdateOrder',
      })
      figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(mockNode.text.characters).toContain('UpdateOrder')
      expect(mockNode.text.characters).toContain('userId: string')
      expect(mockNode.text.characters).toContain('amount: number')
    })

    it('restores text to label only when hiding fields', async () => {
      const mockNode = createMockNode({
        fieldsVisible: 'true',
        customFields: 'userId: string',
        label: 'UpdateOrder',
      })
      figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(mockNode.text.characters).toBe('UpdateOrder')
    })

    it('preserves cornerRadius after resizing', async () => {
      const mockNode = {
        ...createMockNode({
          fieldsVisible: 'false',
          customFields: 'field1: string',
        }),
        cornerRadius: 0,
      }
      figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(mockNode.cornerRadius).toBe(0)
    })

    it('loads font before modifying text', async () => {
      const mockNode = createMockNode({
        fieldsVisible: 'false',
        customFields: 'field1: string',
      })
      figmaMock.getNodeByIdAsync.mockResolvedValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(figmaMock.loadFontAsync).toHaveBeenCalledWith({
        family: 'Inter',
        style: 'Medium',
      })
    })
  })
})
