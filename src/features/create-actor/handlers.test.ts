import { describe, it, expect, beforeEach } from 'vitest'
import { handleCreateActor } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleCreateActor', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('creates a shape with text using figma API', async () => {
    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.createShapeWithText).toHaveBeenCalled()
  })

  it('loads Inter Medium font before setting text', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.loadFontAsync).toHaveBeenCalledWith({
      family: 'Inter',
      style: 'Medium',
    })
  })

  it('sets the shape type to ROUNDED_RECTANGLE', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.shapeType).toBe('ROUNDED_RECTANGLE')
  })

  it('resizes the element to 176x80', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.resize).toHaveBeenCalledWith(176, 80)
  })

  it('sets corner radius to 0', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.cornerRadius).toBe(0)
  })

  it('sets fill color to #50E3C2 (teal)', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.fills).toEqual([
      { type: 'SOLID', color: { r: 0x50 / 255, g: 0xe3 / 255, b: 0xc2 / 255 } },
    ])
  })

  it('sets stroke color to #3BB89E (darker teal)', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.strokes).toEqual([
      { type: 'SOLID', color: { r: 0x3b / 255, g: 0xb8 / 255, b: 0x9e / 255 } },
    ])
    expect(mockShape.strokeWeight).toBe(2)
  })

  it('sets the text label to "Actor" with black color', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.text.characters).toBe('Actor')
    expect(mockShape.text.fills).toEqual([
      { type: 'SOLID', color: { r: 1, g: 1, b: 1 } },
    ])
  })

  it('stores type "actor" in plugin data', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.setPluginData).toHaveBeenCalledWith('type', 'actor')
  })

  it('stores label "Actor" in plugin data', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.setPluginData).toHaveBeenCalledWith('label', 'Actor')
  })

  it('positions element at viewport center', async () => {
    figmaMock.viewport.center = { x: 500, y: 300 }
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    // Centered: x = 500 - 176/2 = 412, y = 300 - 80/2 = 260
    expect(mockShape.x).toBe(412)
    expect(mockShape.y).toBe(260)
  })

  it('appends the element to the current page', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(mockShape)
  })

  it('does not lock the created element', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.locked).not.toBe(true)
  })

  it('creates multiple elements on multiple calls', async () => {
    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })
    await handleCreateActor(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(2)
    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledTimes(2)
  })
})
