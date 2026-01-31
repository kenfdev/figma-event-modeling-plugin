import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleCreateProcessor } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleCreateProcessor', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('creates an SVG node for the gear icon', async () => {
    await handleCreateProcessor(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.createNodeFromSvg).toHaveBeenCalled()
  })

  it('creates a text node for the label', async () => {
    await handleCreateProcessor(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.createText).toHaveBeenCalled()
  })

  it('loads font before setting label text', async () => {
    await handleCreateProcessor(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.loadFontAsync).toHaveBeenCalledWith({
      family: 'Inter',
      style: 'Medium',
    })
  })

  it('sets the default label text to "Processor"', async () => {
    const mockText = figmaMock.createText()
    figmaMock.createText.mockReturnValue(mockText)

    await handleCreateProcessor(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockText.characters).toBe('Processor')
  })

  it('groups the SVG icon and text label together', async () => {
    const mockSvg = figmaMock.createNodeFromSvg('')
    figmaMock.createNodeFromSvg.mockReturnValue(mockSvg)
    const mockText = figmaMock.createText()
    figmaMock.createText.mockReturnValue(mockText)

    await handleCreateProcessor(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.group).toHaveBeenCalledWith(
      [mockSvg, mockText],
      figmaMock.currentPage
    )
  })

  it('positions the group at viewport center', async () => {
    const mockGroup = figmaMock.group([], figmaMock.currentPage)
    figmaMock.group.mockReturnValue(mockGroup)
    // Simulate known bounding box after grouping
    mockGroup.width = 48
    mockGroup.height = 70

    figmaMock.viewport.center = { x: 500, y: 300 }

    await handleCreateProcessor(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockGroup.x).toBe(500 - mockGroup.width / 2)
    expect(mockGroup.y).toBe(300 - mockGroup.height / 2)
  })

  it('stores type "processor" in plugin data on the group', async () => {
    const mockGroup = figmaMock.group([], figmaMock.currentPage)
    figmaMock.group.mockReturnValue(mockGroup)

    await handleCreateProcessor(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockGroup.setPluginData).toHaveBeenCalledWith('type', 'processor')
  })

  it('stores label "Processor" in plugin data on the group', async () => {
    const mockGroup = figmaMock.group([], figmaMock.currentPage)
    figmaMock.group.mockReturnValue(mockGroup)

    await handleCreateProcessor(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockGroup.setPluginData).toHaveBeenCalledWith('label', 'Processor')
  })
})
