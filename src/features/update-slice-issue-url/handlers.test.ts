import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleUpdateSliceIssueUrl } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleUpdateSliceIssueUrl', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('stores issueUrl in plugin data', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
      children: [],
      appendChild: vi.fn(),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleUpdateSliceIssueUrl(
      { id: 'node-1', issueUrl: 'https://github.com/issues/123' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith(
      'issueUrl',
      'https://github.com/issues/123'
    )
  })

  it('allows empty issueUrl (clears the link)', async () => {
    const mockNode = {
      id: 'node-1',
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
      children: [],
      appendChild: vi.fn(),
    }
    figmaMock.getNodeById.mockReturnValue(mockNode)

    await handleUpdateSliceIssueUrl(
      { id: 'node-1', issueUrl: '' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(mockNode.setPluginData).toHaveBeenCalledWith('issueUrl', '')
  })

  it('does nothing when node is not found', async () => {
    figmaMock.getNodeById.mockReturnValue(null)

    await handleUpdateSliceIssueUrl(
      { id: 'nonexistent', issueUrl: 'https://github.com/issues/123' },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled()
  })

  describe('issue marker icon', () => {
    it('adds a marker text node when issueUrl is set and no marker exists', async () => {
      const mockNode = {
        id: 'node-1',
        setPluginData: vi.fn(),
        getPluginData: vi.fn(() => ''),
        children: [],
        appendChild: vi.fn(),
      }
      figmaMock.getNodeById.mockReturnValue(mockNode)

      await handleUpdateSliceIssueUrl(
        { id: 'node-1', issueUrl: 'https://github.com/issues/123' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(figmaMock.loadFontAsync).toHaveBeenCalled()
      expect(figmaMock.createText).toHaveBeenCalled()
      const mockTextNode = figmaMock.createText.mock.results[0].value
      expect(mockTextNode.setPluginData).toHaveBeenCalledWith('isIssueMarker', 'true')
      expect(mockNode.appendChild).toHaveBeenCalledWith(mockTextNode)
    })

    it('does not add a duplicate marker when one already exists', async () => {
      const existingMarker = {
        id: 'existing-marker',
        getPluginData: vi.fn((key: string) =>
          key === 'isIssueMarker' ? 'true' : ''
        ),
        setPluginData: vi.fn(),
        remove: vi.fn(),
      }
      const mockNode = {
        id: 'node-1',
        setPluginData: vi.fn(),
        getPluginData: vi.fn(() => ''),
        children: [existingMarker],
        appendChild: vi.fn(),
      }
      figmaMock.getNodeById.mockReturnValue(mockNode)

      await handleUpdateSliceIssueUrl(
        { id: 'node-1', issueUrl: 'https://github.com/issues/456' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(figmaMock.createText).not.toHaveBeenCalled()
      expect(mockNode.appendChild).not.toHaveBeenCalled()
    })

    it('removes the marker when issueUrl is cleared', async () => {
      const existingMarker = {
        id: 'existing-marker',
        getPluginData: vi.fn((key: string) =>
          key === 'isIssueMarker' ? 'true' : ''
        ),
        setPluginData: vi.fn(),
        remove: vi.fn(),
      }
      const mockNode = {
        id: 'node-1',
        setPluginData: vi.fn(),
        getPluginData: vi.fn(() => ''),
        children: [existingMarker],
        appendChild: vi.fn(),
      }
      figmaMock.getNodeById.mockReturnValue(mockNode)

      await handleUpdateSliceIssueUrl(
        { id: 'node-1', issueUrl: '' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(existingMarker.remove).toHaveBeenCalled()
    })

    it('does nothing when clearing issueUrl and no marker exists', async () => {
      const mockNode = {
        id: 'node-1',
        setPluginData: vi.fn(),
        getPluginData: vi.fn(() => ''),
        children: [],
        appendChild: vi.fn(),
      }
      figmaMock.getNodeById.mockReturnValue(mockNode)

      await handleUpdateSliceIssueUrl(
        { id: 'node-1', issueUrl: '' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(figmaMock.createText).not.toHaveBeenCalled()
    })

    it('positions the marker icon at the corner of the section', async () => {
      const mockNode = {
        id: 'node-1',
        setPluginData: vi.fn(),
        getPluginData: vi.fn(() => ''),
        children: [],
        appendChild: vi.fn(),
      }
      figmaMock.getNodeById.mockReturnValue(mockNode)

      await handleUpdateSliceIssueUrl(
        { id: 'node-1', issueUrl: 'https://github.com/issues/123' },
        { figma: figmaMock as unknown as typeof figma }
      )

      const mockTextNode = figmaMock.createText.mock.results[0].value
      expect(mockTextNode.x).toBe(8)
      expect(mockTextNode.y).toBe(8)
    })
  })
})
