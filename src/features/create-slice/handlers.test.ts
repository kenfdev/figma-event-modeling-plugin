import { describe, it, expect, beforeEach } from 'vitest'
import { handleCreateSlice } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleCreateSlice', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('creates a section using figma API', async () => {
    await handleCreateSlice(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.createSection).toHaveBeenCalled()
  })

  it('sets the section name to "Slice"', async () => {
    const mockSection = figmaMock.createSection()
    figmaMock.createSection.mockReturnValue(mockSection)

    await handleCreateSlice(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockSection.name).toBe('Slice')
  })

  it('stores type "slice" in plugin data', async () => {
    const mockSection = figmaMock.createSection()
    figmaMock.createSection.mockReturnValue(mockSection)

    await handleCreateSlice(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockSection.setPluginData).toHaveBeenCalledWith('type', 'slice')
  })

  it('stores label "Slice" in plugin data', async () => {
    const mockSection = figmaMock.createSection()
    figmaMock.createSection.mockReturnValue(mockSection)

    await handleCreateSlice(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockSection.setPluginData).toHaveBeenCalledWith('label', 'Slice')
  })

  it('resizes height to half viewport height when smaller than 3x default', async () => {
    const mockSection = figmaMock.createSection()
    figmaMock.createSection.mockReturnValue(mockSection)
    // Default section height is 40, so maxHeight = 120
    // Viewport height 200, half = 100, which is < 120
    figmaMock.viewport.bounds = { x: 0, y: 0, width: 1920, height: 200 }

    await handleCreateSlice(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockSection.resizeWithoutConstraints).toHaveBeenCalledWith(280, 100)
  })

  it('caps height at 3x default section height when viewport is large', async () => {
    const mockSection = figmaMock.createSection()
    figmaMock.createSection.mockReturnValue(mockSection)
    // Default section height is 40, so maxHeight = 120
    // Viewport height 1080, half = 540, which is > 120
    figmaMock.viewport.bounds = { x: 0, y: 0, width: 1920, height: 1080 }

    await handleCreateSlice(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockSection.resizeWithoutConstraints).toHaveBeenCalledWith(280, 120)
  })

  it('positions element centered at viewport center', async () => {
    figmaMock.viewport.center = { x: 500, y: 300 }
    const mockSection = figmaMock.createSection()
    figmaMock.createSection.mockReturnValue(mockSection)

    await handleCreateSlice(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockSection.x).toBe(500 - mockSection.width / 2)
    expect(mockSection.y).toBe(300 - mockSection.height / 2)
  })

  it('appends the section to the current page', async () => {
    const mockSection = figmaMock.createSection()
    figmaMock.createSection.mockReturnValue(mockSection)

    await handleCreateSlice(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(mockSection)
  })

  it('creates multiple sections on multiple calls', async () => {
    await handleCreateSlice(undefined, { figma: figmaMock as unknown as typeof figma })
    await handleCreateSlice(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.createSection).toHaveBeenCalledTimes(2)
    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledTimes(2)
  })
})
