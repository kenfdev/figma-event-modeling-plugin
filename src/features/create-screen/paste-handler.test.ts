import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleImagePasteIntoScreen } from './paste-handler'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleImagePasteIntoScreen', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('does nothing when document change has no created nodes', async () => {
    await handleImagePasteIntoScreen(
      { documentChanges: [{ type: 'PROPERTY_CHANGE', id: '1', properties: [] }] },
      { figma: figmaMock as unknown as typeof figma }
    )

    // No resize or move operations expected
    expect(figmaMock.getNodeByIdAsync).not.toHaveBeenCalled()
  })

  it('does nothing when created node is not an image fill node', async () => {
    const rectNode = {
      id: 'pasted-node',
      type: 'RECTANGLE',
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }],
      resize: vi.fn(),
      parent: null,
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(rectNode)

    await handleImagePasteIntoScreen(
      { documentChanges: [{ type: 'CREATE', id: 'pasted-node' }] },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(rectNode.resize).not.toHaveBeenCalled()
  })

  it('does nothing when image node is not overlapping a screen element', async () => {
    const imageNode = {
      id: 'pasted-image',
      type: 'RECTANGLE',
      x: 1000,
      y: 1000,
      width: 300,
      height: 200,
      fills: [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: 'abc' }],
      resize: vi.fn(),
      parent: figmaMock.currentPage,
    }
    figmaMock.getNodeByIdAsync.mockResolvedValue(imageNode)

    // No screen groups on the page
    figmaMock.currentPage.children = []

    await handleImagePasteIntoScreen(
      { documentChanges: [{ type: 'CREATE', id: 'pasted-image' }] },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(imageNode.resize).not.toHaveBeenCalled()
  })

  it('resizes image to fit screen bounds when pasted overlapping a screen', async () => {
    const screenRect = {
      id: 'screen-rect',
      type: 'RECTANGLE',
      x: 0,
      y: 0,
      width: 200,
      height: 160,
    }
    const screenGroup = {
      id: 'screen-group',
      type: 'GROUP',
      x: 50,
      y: 50,
      width: 200,
      height: 180,
      getPluginData: vi.fn((key: string) => (key === 'type' ? 'screen' : '')),
      children: [screenRect],
    }

    const imageNode = {
      id: 'pasted-image',
      type: 'RECTANGLE',
      x: 60,
      y: 60,
      width: 400,
      height: 300,
      fills: [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: 'abc' }],
      resize: vi.fn(),
      parent: figmaMock.currentPage,
    }

    figmaMock.getNodeByIdAsync.mockResolvedValue(imageNode)
    figmaMock.currentPage.children = [screenGroup, imageNode]

    await handleImagePasteIntoScreen(
      { documentChanges: [{ type: 'CREATE', id: 'pasted-image' }] },
      { figma: figmaMock as unknown as typeof figma }
    )

    // Should resize to screen placeholder dimensions (200x160)
    expect(imageNode.resize).toHaveBeenCalledWith(200, 160)
  })

  it('repositions image to align with the screen placeholder rectangle', async () => {
    const screenRect = {
      id: 'screen-rect',
      type: 'RECTANGLE',
      x: 0,
      y: 0,
      width: 200,
      height: 160,
    }
    const screenGroup = {
      id: 'screen-group',
      type: 'GROUP',
      x: 50,
      y: 50,
      width: 200,
      height: 180,
      getPluginData: vi.fn((key: string) => (key === 'type' ? 'screen' : '')),
      children: [screenRect],
    }

    const imageNode = {
      id: 'pasted-image',
      type: 'RECTANGLE',
      x: 80,
      y: 80,
      width: 400,
      height: 300,
      fills: [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: 'abc' }],
      resize: vi.fn(),
      parent: figmaMock.currentPage,
    }

    figmaMock.getNodeByIdAsync.mockResolvedValue(imageNode)
    figmaMock.currentPage.children = [screenGroup, imageNode]

    await handleImagePasteIntoScreen(
      { documentChanges: [{ type: 'CREATE', id: 'pasted-image' }] },
      { figma: figmaMock as unknown as typeof figma }
    )

    // Image should be positioned at the screen group's position (where the rect is)
    expect(imageNode.x).toBe(50)
    expect(imageNode.y).toBe(50)
  })

  it('sets image scale mode to FILL for proper cropping', async () => {
    const screenRect = {
      id: 'screen-rect',
      type: 'RECTANGLE',
      x: 0,
      y: 0,
      width: 200,
      height: 160,
    }
    const screenGroup = {
      id: 'screen-group',
      type: 'GROUP',
      x: 50,
      y: 50,
      width: 200,
      height: 180,
      getPluginData: vi.fn((key: string) => (key === 'type' ? 'screen' : '')),
      children: [screenRect],
    }

    const imageFill = { type: 'IMAGE', scaleMode: 'FIT', imageHash: 'abc' }
    const imageNode = {
      id: 'pasted-image',
      type: 'RECTANGLE',
      x: 60,
      y: 60,
      width: 400,
      height: 300,
      fills: [imageFill],
      resize: vi.fn(),
      parent: figmaMock.currentPage,
    }

    figmaMock.getNodeByIdAsync.mockResolvedValue(imageNode)
    figmaMock.currentPage.children = [screenGroup, imageNode]

    await handleImagePasteIntoScreen(
      { documentChanges: [{ type: 'CREATE', id: 'pasted-image' }] },
      { figma: figmaMock as unknown as typeof figma }
    )

    expect(imageNode.fills).toEqual([
      expect.objectContaining({ type: 'IMAGE', scaleMode: 'FILL' }),
    ])
  })
})
