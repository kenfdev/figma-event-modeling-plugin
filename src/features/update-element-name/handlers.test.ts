import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleUpdateElementName } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleUpdateElementName', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('updates the text characters on the canvas element', async () => {
    const mockNode = {
      id: 'node-1',
      name: 'Old Name',
      text: { characters: 'Old Name', fills: [] },
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        return ''
      }),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleUpdateElementName(
      { id: 'node-1', name: 'New Name' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.text.characters).toBe('New Name')
  })

  it('persists the name in plugin data', async () => {
    const mockNode = {
      id: 'node-1',
      name: 'Old Name',
      text: { characters: 'Old Name', fills: [] },
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        return ''
      }),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleUpdateElementName(
      { id: 'node-1', name: 'Updated' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('label', 'Updated')
  })

  it('allows empty names', async () => {
    const mockNode = {
      id: 'node-1',
      name: 'Some Name',
      text: { characters: 'Some Name', fills: [] },
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        return ''
      }),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleUpdateElementName(
      { id: 'node-1', name: '' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.text.characters).toBe('')
    expect(mockNode.setPluginData).toHaveBeenCalledWith('label', '')
  })

  it('does nothing when node is not found', async () => {
    figmaMock.getNodeById.mockReturnValue(null)

    await handleUpdateElementName(
      { id: 'nonexistent', name: 'New Name' },
      { figma: figmaMock as unknown as typeof figma }
    )

    // Should not throw and no postMessage calls
    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled()
  })

  it('loads font before updating text characters', async () => {
    const mockNode = {
      id: 'node-1',
      name: 'Old Name',
      text: { characters: 'Old Name', fills: [] },
      setPluginData: vi.fn(),
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        return ''
      }),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleUpdateElementName(
      { id: 'node-1', name: 'New Name' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.loadFontAsync).toHaveBeenCalledWith({
      family: 'Inter',
      style: 'Medium',
    })
  })
})
