import { describe, it, expect, beforeEach } from 'vitest'
import { handleCreateScreen } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleCreateScreen', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('creates a shape with text using figma API', async () => {
    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.createShapeWithText).toHaveBeenCalled()
  })

  it('loads Inter Medium font before setting text', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.loadFontAsync).toHaveBeenCalledWith({
      family: 'Inter',
      style: 'Medium',
    })
  })

  it('sets the shape type to SQUARE', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.shapeType).toBe('SQUARE')
  })

  it('resizes the element to 200x160', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.resize).toHaveBeenCalledWith(200, 160)
  })

  it('sets corner radius to 4', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.cornerRadius).toBe(4)
  })

  it('sets fill color to gray #E6E6E6', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.fills).toEqual([
      { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } },
    ])
  })

  it('sets the text label to "Screen" with gray color', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.text.characters).toBe('Screen')
    expect(mockShape.text.fills).toEqual([
      { type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } },
    ])
  })

  it('stores type "screen" in plugin data', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.setPluginData).toHaveBeenCalledWith('type', 'screen')
  })

  it('stores label "Screen" in plugin data', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.setPluginData).toHaveBeenCalledWith('label', 'Screen')
  })

  it('positions element at viewport center', async () => {
    figmaMock.viewport.center = { x: 500, y: 300 }
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    // Centered: x = 500 - 200/2 = 400, y = 300 - 160/2 = 220
    expect(mockShape.x).toBe(400)
    expect(mockShape.y).toBe(220)
  })

  it('appends the element to the current page', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(mockShape)
  })

  it('does not lock the created element', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.locked).not.toBe(true)
  })

  it('creates multiple elements on multiple calls', async () => {
    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })
    await handleCreateScreen(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(2)
    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledTimes(2)
  })
})