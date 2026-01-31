import { describe, it, expect, beforeEach } from 'vitest'
import { handleCreateChapter } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleCreateChapter', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('creates a connector using figma API', async () => {
    await handleCreateChapter(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.createConnector).toHaveBeenCalled()
  })

  it('sets connector start and end to create a 200px wide connector', async () => {
    const mockConnector = figmaMock.createConnector()
    figmaMock.createConnector.mockReturnValue(mockConnector)

    figmaMock.viewport.center = { x: 500, y: 300 }

    await handleCreateChapter(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    // Connector should span 200px horizontally, centered at viewport
    expect(mockConnector.connectorStart).toEqual({
      position: { x: 400, y: 300 },
    })
    expect(mockConnector.connectorEnd).toEqual({
      position: { x: 600, y: 300 },
    })
  })

  it('sets the default label to "Chapter"', async () => {
    const mockConnector = figmaMock.createConnector()
    figmaMock.createConnector.mockReturnValue(mockConnector)

    await handleCreateChapter(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockConnector.text.characters).toBe('Chapter')
  })

  it('loads font before setting text', async () => {
    const mockConnector = figmaMock.createConnector()
    figmaMock.createConnector.mockReturnValue(mockConnector)

    await handleCreateChapter(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.loadFontAsync).toHaveBeenCalledWith({
      family: 'Inter',
      style: 'Medium',
    })
  })

  it('sets connector text color to cyan', async () => {
    const mockConnector = figmaMock.createConnector()
    figmaMock.createConnector.mockReturnValue(mockConnector)

    await handleCreateChapter(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockConnector.text.fills).toEqual([
      { type: 'SOLID', color: { r: 0, g: 1, b: 1 } },
    ])
  })

  it('sets connector stroke color to cyan', async () => {
    const mockConnector = figmaMock.createConnector()
    figmaMock.createConnector.mockReturnValue(mockConnector)

    await handleCreateChapter(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockConnector.strokes).toEqual([
      { type: 'SOLID', color: { r: 0, g: 1, b: 1 } },
    ])
  })

  it('stores type "chapter" in plugin data', async () => {
    const mockConnector = figmaMock.createConnector()
    figmaMock.createConnector.mockReturnValue(mockConnector)

    await handleCreateChapter(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockConnector.setPluginData).toHaveBeenCalledWith('type', 'chapter')
  })

  it('stores label "Chapter" in plugin data', async () => {
    const mockConnector = figmaMock.createConnector()
    figmaMock.createConnector.mockReturnValue(mockConnector)

    await handleCreateChapter(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockConnector.setPluginData).toHaveBeenCalledWith('label', 'Chapter')
  })

  it('appends the connector to the current page', async () => {
    const mockConnector = figmaMock.createConnector()
    figmaMock.createConnector.mockReturnValue(mockConnector)

    await handleCreateChapter(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(
      mockConnector
    )
  })
})
