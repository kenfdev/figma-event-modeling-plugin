import { describe, it, expect, beforeEach } from 'vitest'
import { handleCreateLane } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleCreateLane', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
    // Add viewport bounds for lane width calculation
    ;(figmaMock.viewport as Record<string, unknown>).bounds = {
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
    }
  })

  it('creates a shape with text using figma API', async () => {
    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.createShapeWithText).toHaveBeenCalled()
  })

  it('sets the shape type to SQUARE', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockShape.shapeType).toBe('SQUARE')
  })

  it('resizes to half viewport width and 120px height', async () => {
    ;(figmaMock.viewport as Record<string, unknown>).bounds = {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    }
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockShape.resize).toHaveBeenCalledWith(400, 120)
  })

  it('uses full half viewport width without capping', async () => {
    ;(figmaMock.viewport as Record<string, unknown>).bounds = {
      x: 0,
      y: 0,
      width: 2000,
      height: 800,
    }
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockShape.resize).toHaveBeenCalledWith(1000, 120)
  })

  it('loads font before setting text characters', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.loadFontAsync).toHaveBeenCalledWith({
      family: 'Inter',
      style: 'Medium',
    })
  })

  it('stores empty label in plugin data', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockShape.setPluginData).toHaveBeenCalledWith('label', '')
  })

  it('sets gray fill with 5% opacity', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockShape.fills).toEqual([
      {
        type: 'SOLID',
        color: { r: 0.85, g: 0.85, b: 0.85 },
        opacity: 0.05,
      },
    ])
  })

  it('has no label by default (empty text)', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockShape.text.characters).toBe('')
  })

  it('stores type "lane" in plugin data', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(mockShape.setPluginData).toHaveBeenCalledWith('type', 'lane')
  })

  it('positions element at viewport center', async () => {
    figmaMock.viewport.center = { x: 500, y: 300 }
    ;(figmaMock.viewport as Record<string, unknown>).bounds = {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    }
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    // Half viewport = 400, Centered: x = 500 - 400/2 = 300, y = 300 - 120/2 = 240
    expect(mockShape.x).toBe(300)
    expect(mockShape.y).toBe(240)
  })

  it('appends the element to the current page', async () => {
    const mockShape = figmaMock.createShapeWithText()
    figmaMock.createShapeWithText.mockReturnValue(mockShape)

    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(mockShape)
  })

  it('creates multiple elements on multiple calls', async () => {
    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })
    await handleCreateLane(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(2)
    expect(figmaMock.currentPage.appendChild).toHaveBeenCalledTimes(2)
  })
})
