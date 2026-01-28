import { describe, it, expect, beforeEach } from 'vitest'
import { handleCreateCommand } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleCreateCommand', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('creates a shape with text using figma API', async () => {
    await handleCreateCommand(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.createShapeWithText).toHaveBeenCalled()
  })

  it('loads Inter Medium font before setting text', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateCommand(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.loadFontAsync).toHaveBeenCalledWith({
      family: 'Inter',
      style: 'Medium',
    })
  })

  it('sets the shape type to ROUNDED_RECTANGLE', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateCommand(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.shapeType).toBe('ROUNDED_RECTANGLE')
  })

  it('resizes the element to 200x120', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateCommand(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.resize).toHaveBeenCalledWith(200, 120)
  })

  it('sets fill color to blue (#4A90D9)', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateCommand(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.fills).toEqual([
      { type: 'SOLID', color: { r: 74 / 255, g: 144 / 255, b: 217 / 255 } },
    ])
  })

  it('sets the text label to "Command"', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateCommand(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.text.characters).toBe('Command')
  })

  it('stores type "command" in plugin data', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateCommand(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(mockShape.setPluginData).toHaveBeenCalledWith('type', 'command')
  })

  it('positions element at viewport center', async () => {
    figmaMock.viewport.center = { x: 500, y: 300 }
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateCommand(undefined, { figma: figmaMock as unknown as typeof figma })

    // Centered: x = 500 - 200/2 = 400, y = 300 - 120/2 = 240
    expect(mockShape.x).toBe(400)
    expect(mockShape.y).toBe(240)
  })

  it('appends the element to the current page', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateCommand(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(mockShape)
  })

  it('creates multiple elements on multiple calls', async () => {
    await handleCreateCommand(undefined, { figma: figmaMock as unknown as typeof figma })
    await handleCreateCommand(undefined, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(2)
    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledTimes(2)
  })
})
