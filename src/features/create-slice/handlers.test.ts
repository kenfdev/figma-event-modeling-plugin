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

  it('positions element at viewport center', async () => {
    figmaMock.viewport.center = { x: 500, y: 300 }
    const mockSection = figmaMock.createSection()
    figmaMock.createSection.mockReturnValue(mockSection)

    await handleCreateSlice(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockSection.x).toBeDefined()
    expect(mockSection.y).toBeDefined()
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
