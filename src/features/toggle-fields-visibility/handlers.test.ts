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
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

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
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

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
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleToggleFieldsVisibility(
      { id: 'node-1' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('fieldsVisible', 'false')
  })

  it('does nothing when node is not found', async () => {
    figmaMock.getNodeById.mockReturnValue(null)

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
    figmaMock.getNodeById.mockReturnValue(mockNode)

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

  describe('element resizing', () => {
    it('expands element height when toggling fields visible', async () => {
      const mockNode = {
        id: 'node-1',
        setPluginData: vi.fn(),
        getPluginData: vi.fn((key: string) => {
          if (key === 'fieldsVisible') return 'false'
          if (key === 'customFields') return 'field1: string\nfield2: number'
          return ''
        }),
        resize: vi.fn(),
      }
      figmaMock.getNodeById.mockReturnValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(mockNode.resize).toHaveBeenCalledWith(176, expect.any(Number))
      const newHeight = mockNode.resize.mock.calls[0][1]
      expect(newHeight).toBeGreaterThan(80)
    })

    it('shrinks element back to base height when toggling fields hidden', async () => {
      const mockNode = {
        id: 'node-1',
        setPluginData: vi.fn(),
        getPluginData: vi.fn((key: string) => {
          if (key === 'fieldsVisible') return 'true'
          return ''
        }),
        resize: vi.fn(),
      }
      figmaMock.getNodeById.mockReturnValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(mockNode.resize).toHaveBeenCalledWith(176, 80)
    })

    it('uses base height when showing fields but customFields is empty', async () => {
      const mockNode = {
        id: 'node-1',
        setPluginData: vi.fn(),
        getPluginData: vi.fn((key: string) => {
          if (key === 'fieldsVisible') return 'false'
          if (key === 'customFields') return ''
          return ''
        }),
        resize: vi.fn(),
      }
      figmaMock.getNodeById.mockReturnValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(mockNode.resize).toHaveBeenCalledWith(176, 80)
    })

    it('calculates expanded height based on number of custom field lines', async () => {
      const oneLineMock = {
        id: 'node-1',
        setPluginData: vi.fn(),
        getPluginData: vi.fn((key: string) => {
          if (key === 'fieldsVisible') return 'false'
          if (key === 'customFields') return 'field1: string'
          return ''
        }),
        resize: vi.fn(),
      }

      const threeLineMock = {
        id: 'node-2',
        setPluginData: vi.fn(),
        getPluginData: vi.fn((key: string) => {
          if (key === 'fieldsVisible') return 'false'
          if (key === 'customFields') return 'field1: string\nfield2: number\nfield3: boolean'
          return ''
        }),
        resize: vi.fn(),
      }

      figmaMock.getNodeById.mockReturnValue(oneLineMock)
      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )
      const oneLineHeight = oneLineMock.resize.mock.calls[0][1]

      figmaMock.getNodeById.mockReturnValue(threeLineMock)
      await handleToggleFieldsVisibility(
        { id: 'node-2' },
        { figma: figmaMock as unknown as typeof figma }
      )
      const threeLineHeight = threeLineMock.resize.mock.calls[0][1]

      expect(threeLineHeight).toBeGreaterThan(oneLineHeight)
    })

    it('keeps width at 176px regardless of toggle direction', async () => {
      const mockNode = {
        id: 'node-1',
        setPluginData: vi.fn(),
        getPluginData: vi.fn((key: string) => {
          if (key === 'fieldsVisible') return 'false'
          if (key === 'customFields') return 'field1: string'
          return ''
        }),
        resize: vi.fn(),
      }
      figmaMock.getNodeById.mockReturnValue(mockNode)

      await handleToggleFieldsVisibility(
        { id: 'node-1' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(mockNode.resize).toHaveBeenCalledWith(176, expect.any(Number))
    })
  })
})
