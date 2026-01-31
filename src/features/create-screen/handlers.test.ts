import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleCreateScreen } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleCreateScreen', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('creates a rectangle for the gray placeholder', async () => {
    await handleCreateScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.createRectangle).toHaveBeenCalled()
  })

  it('fills the rectangle with gray color', async () => {
    const mockRect = figmaMock.createRectangle()
    figmaMock.createRectangle.mockReturnValue(mockRect)

    await handleCreateScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockRect.fills).toEqual([
      expect.objectContaining({ type: 'SOLID' }),
    ])
  })

  it('creates an SVG node for the window icon', async () => {
    await handleCreateScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.createNodeFromSvg).toHaveBeenCalled()
  })

  it('creates a text node for the label', async () => {
    await handleCreateScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.createText).toHaveBeenCalled()
  })

  it('loads font before setting label text', async () => {
    await handleCreateScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.loadFontAsync).toHaveBeenCalledWith({
      family: 'Inter',
      style: 'Medium',
    })
  })

  it('sets the default label text to "Screen"', async () => {
    const mockText = figmaMock.createText()
    figmaMock.createText.mockReturnValue(mockText)

    await handleCreateScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockText.characters).toBe('Screen')
  })

  it('groups the rectangle, icon, and label together', async () => {
    const mockRect = figmaMock.createRectangle()
    figmaMock.createRectangle.mockReturnValue(mockRect)
    const mockSvg = figmaMock.createNodeFromSvg('')
    figmaMock.createNodeFromSvg.mockReturnValue(mockSvg)
    const mockText = figmaMock.createText()
    figmaMock.createText.mockReturnValue(mockText)

    await handleCreateScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.group).toHaveBeenCalledWith(
      [mockRect, mockSvg, mockText],
      figmaMock.currentPage
    )
  })

  it('positions the group at viewport center', async () => {
    const mockGroup = figmaMock.group([], figmaMock.currentPage)
    figmaMock.group.mockReturnValue(mockGroup)
    mockGroup.width = 200
    mockGroup.height = 160

    figmaMock.viewport.center = { x: 500, y: 300 }

    await handleCreateScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockGroup.x).toBe(500 - mockGroup.width / 2)
    expect(mockGroup.y).toBe(300 - mockGroup.height / 2)
  })

  it('stores type "screen" in plugin data on the group', async () => {
    const mockGroup = figmaMock.group([], figmaMock.currentPage)
    figmaMock.group.mockReturnValue(mockGroup)

    await handleCreateScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockGroup.setPluginData).toHaveBeenCalledWith('type', 'screen')
  })

  it('stores label "Screen" in plugin data on the group', async () => {
    const mockGroup = figmaMock.group([], figmaMock.currentPage)
    figmaMock.group.mockReturnValue(mockGroup)

    await handleCreateScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockGroup.setPluginData).toHaveBeenCalledWith('label', 'Screen')
  })
})
