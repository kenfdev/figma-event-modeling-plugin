import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleUpdateNotes } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleUpdateNotes', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('stores notes text in plugin data', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleUpdateNotes(
      { id: 'node-1', notes: 'Some important notes\nWith multiple lines' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith(
      'notes',
      'Some important notes\nWith multiple lines'
    )
  })

  it('allows empty notes', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleUpdateNotes(
      { id: 'node-1', notes: '' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('notes', '')
  })

  it('does nothing when node is not found', async () => {
    figmaMock.getNodeById.mockReturnValue(null)

    await handleUpdateNotes(
      { id: 'nonexistent', notes: 'some text' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled()
  })
})
