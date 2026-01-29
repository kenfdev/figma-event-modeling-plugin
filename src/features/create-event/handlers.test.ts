import { describe, it, expect, beforeEach } from 'vitest'
import { handleCreateEvent } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleCreateEvent', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('creates a shape with text using figma API', async () => {
    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.createShapeWithText).toHaveBeenCalled()
  })

  it('loads Inter Medium font before setting text', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.loadFontAsync).toHaveBeenCalledWith({
      family: 'Inter',
      style: 'Medium',
    })
  })

  it('sets the shape type to ROUNDED_RECTANGLE', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.shapeType).toBe('ROUNDED_RECTANGLE')
  })

  it('sets corner radius to 0', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.cornerRadius).toBe(0)
  })

  it('resizes the element to 176x80', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.resize).toHaveBeenCalledWith(176, 80)
  })

  it('sets fill color to #FF9E42 (orange, internal event)', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.fills).toEqual([
      { type: 'SOLID', color: { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 } },
    ])
  })

  it('sets stroke color to #EB7500', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.strokes).toEqual([
      { type: 'SOLID', color: { r: 0xeb / 255, g: 0x75 / 255, b: 0x00 / 255 } },
    ])
    expect(mockShape.strokeWeight).toBe(2)
  })

  it('sets the text label to "Event" with black color', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.text.characters).toBe('Event')
    expect(mockShape.text.fills).toEqual([
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
    ])
  })

  it('stores type "event" in plugin data', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.setPluginData).toHaveBeenCalledWith('type', 'event')
  })

  it('stores label "Event" in plugin data', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.setPluginData).toHaveBeenCalledWith('label', 'Event')
  })

  it('stores external "false" in plugin data (internal by default)', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.setPluginData).toHaveBeenCalledWith('external', 'false')
  })

  it('positions element at viewport center', async () => {
    figmaMock.viewport.center = { x: 500, y: 300 }
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    // Centered: x = 500 - 176/2 = 412, y = 300 - 80/2 = 260
    expect(mockShape.x).toBe(412)
    expect(mockShape.y).toBe(260)
  })

  it('appends the element to the current page', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(mockShape)
  })

  it('creates multiple elements on multiple calls', async () => {
    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })
    await handleCreateEvent(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(2)
    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledTimes(2)
  })
})
