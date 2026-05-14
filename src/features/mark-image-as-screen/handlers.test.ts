import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  handleMarkImagesAsScreen,
  handleRevertScreenImages,
  hasImageFill,
  MARK_AS_SCREEN_SUCCESS,
  REVERT_SCREEN_SUCCESS,
  MARK_AS_SCREEN_ERROR,
  REVERT_SCREEN_ERROR,
  ORIGINAL_STROKES_KEY,
  ORIGINAL_STROKE_WEIGHT_KEY,
  ORIGINAL_STROKE_ALIGN_KEY,
} from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

interface MockImageNodeOptions {
  id?: string
  name?: string
  hasImage?: boolean
  pluginData?: Record<string, string>
  strokes?: Paint[]
  strokeWeight?: number
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER'
}

function createMockImageNode(opts: MockImageNodeOptions = {}) {
  const data: Record<string, string> = { ...(opts.pluginData ?? {}) }
  const fills: Paint[] = opts.hasImage === false
    ? [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } } as SolidPaint]
    : [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: 'abc' } as unknown as Paint]

  const node = {
    id: opts.id ?? 'image-1',
    name: opts.name ?? 'Pasted Image',
    type: 'RECTANGLE',
    fills,
    strokes: opts.strokes ?? [],
    strokeWeight: opts.strokeWeight ?? 0,
    strokeAlign: opts.strokeAlign ?? 'INSIDE',
    getPluginData: vi.fn((key: string) => data[key] ?? ''),
    setPluginData: vi.fn((key: string, value: string) => {
      if (value === '') {
        delete data[key]
      } else {
        data[key] = value
      }
    }),
  }

  return { node, data }
}

describe('hasImageFill', () => {
  it('returns true when node has image fill', () => {
    const { node } = createMockImageNode()
    expect(hasImageFill(node as unknown as SceneNode)).toBe(true)
  })

  it('returns false when node has only solid fill', () => {
    const { node } = createMockImageNode({ hasImage: false })
    expect(hasImageFill(node as unknown as SceneNode)).toBe(false)
  })

  it('returns false when node has no fills property', () => {
    const node = { id: 'no-fill-1', name: 'Connector', type: 'CONNECTOR' }
    expect(hasImageFill(node as unknown as SceneNode)).toBe(false)
  })
})

describe('handleMarkImagesAsScreen', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('marks a plain image as a screen', () => {
    const { node, data } = createMockImageNode()
    figmaMock.currentPage.selection = [node]

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(data.type).toBe('screen')
    expect(data.label).toBe('Pasted Image')
  })

  it('applies a visible border with stroke weight 3', () => {
    const { node } = createMockImageNode()
    figmaMock.currentPage.selection = [node]

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(node.strokes).toEqual([
      { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } },
    ])
    expect(node.strokeWeight).toBe(3)
    expect(node.strokeAlign).toBe('INSIDE')
  })

  it('saves original stroke state in plugin data before applying border', () => {
    const originalStrokes: Paint[] = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 1 } } as SolidPaint,
    ]
    const { node, data } = createMockImageNode({
      strokes: originalStrokes,
      strokeWeight: 2,
      strokeAlign: 'OUTSIDE',
    })
    figmaMock.currentPage.selection = [node]

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(data[ORIGINAL_STROKES_KEY]).toBe(JSON.stringify(originalStrokes))
    expect(data[ORIGINAL_STROKE_WEIGHT_KEY]).toBe('2')
    expect(data[ORIGINAL_STROKE_ALIGN_KEY]).toBe('OUTSIDE')
  })

  it('skips already-marked images (idempotent)', () => {
    const { node, data } = createMockImageNode({
      pluginData: { type: 'screen', label: 'Existing', [ORIGINAL_STROKES_KEY]: '[]' },
    })
    figmaMock.currentPage.selection = [node]

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    // Label not overwritten, stroke state not re-saved
    expect(data.label).toBe('Existing')
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: MARK_AS_SCREEN_SUCCESS,
      payload: { count: 0 },
    })
  })

  it('skips non-image nodes', () => {
    const { node, data } = createMockImageNode({ hasImage: false })
    figmaMock.currentPage.selection = [node]

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(data.type).toBeUndefined()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: MARK_AS_SCREEN_SUCCESS,
      payload: { count: 0 },
    })
  })

  it('processes only eligible items in a mixed selection', () => {
    const image1 = createMockImageNode({ id: 'img-1', name: 'Image 1' })
    const image2 = createMockImageNode({ id: 'img-2', name: 'Image 2' })
    const nonImage = createMockImageNode({ id: 'shape-1', hasImage: false })
    const alreadyScreen = createMockImageNode({
      id: 'screen-1',
      pluginData: { type: 'screen' },
    })

    figmaMock.currentPage.selection = [
      image1.node,
      nonImage.node,
      image2.node,
      alreadyScreen.node,
    ]

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(image1.data.type).toBe('screen')
    expect(image2.data.type).toBe('screen')
    expect(nonImage.data.type).toBeUndefined()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: MARK_AS_SCREEN_SUCCESS,
      payload: { count: 2 },
    })
  })

  it('posts exactly one success message followed by a selection-changed refresh', () => {
    const { node } = createMockImageNode()
    figmaMock.currentPage.selection = [node]

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledTimes(2)
    expect(figmaMock.ui.postMessage).toHaveBeenNthCalledWith(1, {
      type: MARK_AS_SCREEN_SUCCESS,
      payload: { count: 1 },
    })
    const secondCall = figmaMock.ui.postMessage.mock.calls[1][0]
    expect(secondCall).toMatchObject({ type: 'selection-changed' })
  })

  it('posts an error message when the handler throws unexpectedly', () => {
    const exploding = {
      get fills(): Paint[] {
        throw new Error('boom')
      },
    }
    figmaMock.currentPage.selection = [exploding]

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    const calls = figmaMock.ui.postMessage.mock.calls
    const lastCall = calls[calls.length - 1][0] as {
      type: string
      payload: { message: string }
    }
    expect(lastCall.type).toBe(MARK_AS_SCREEN_ERROR)
    expect(lastCall.payload.message).toContain('boom')
  })

  it('does not overwrite previously-saved original strokes when re-marking is attempted on a non-screen image with leftover key', () => {
    const { node, data } = createMockImageNode({
      pluginData: { [ORIGINAL_STROKES_KEY]: '[{"existing":true}]' },
      strokes: [
        { type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } } as SolidPaint,
      ],
    })
    figmaMock.currentPage.selection = [node]

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(data[ORIGINAL_STROKES_KEY]).toBe('[{"existing":true}]')
  })

  it('posts success with count 0 when selection is empty', () => {
    figmaMock.currentPage.selection = []

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: MARK_AS_SCREEN_SUCCESS,
      payload: { count: 0 },
    })
  })

  it('uses "Screen" as label fallback when node has no name', () => {
    const { node, data } = createMockImageNode({ name: '' })
    figmaMock.currentPage.selection = [node]

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(data.label).toBe('Screen')
  })
})

describe('handleRevertScreenImages', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('reverts a screen-marked image back to plain image', () => {
    const { node, data } = createMockImageNode({
      pluginData: {
        type: 'screen',
        label: 'Screen Label',
        [ORIGINAL_STROKES_KEY]: '[]',
        [ORIGINAL_STROKE_WEIGHT_KEY]: '0',
        [ORIGINAL_STROKE_ALIGN_KEY]: 'INSIDE',
      },
      strokes: [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } } as SolidPaint],
      strokeWeight: 3,
    })
    figmaMock.currentPage.selection = [node]

    handleRevertScreenImages(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(data.type).toBeUndefined()
    expect(data.label).toBeUndefined()
    expect(node.strokes).toEqual([])
    expect(node.strokeWeight).toBe(0)
  })

  it('restores original strokes from saved plugin data', () => {
    const originalStrokes: Paint[] = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 1 } } as SolidPaint,
    ]
    const { node } = createMockImageNode({
      pluginData: {
        type: 'screen',
        [ORIGINAL_STROKES_KEY]: JSON.stringify(originalStrokes),
        [ORIGINAL_STROKE_WEIGHT_KEY]: '2',
        [ORIGINAL_STROKE_ALIGN_KEY]: 'OUTSIDE',
      },
      strokes: [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } } as SolidPaint],
      strokeWeight: 3,
    })
    figmaMock.currentPage.selection = [node]

    handleRevertScreenImages(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(node.strokes).toEqual(originalStrokes)
    expect(node.strokeWeight).toBe(2)
    expect(node.strokeAlign).toBe('OUTSIDE')
  })

  it('deletes saved stroke plugin data keys after restore', () => {
    const { node, data } = createMockImageNode({
      pluginData: {
        type: 'screen',
        [ORIGINAL_STROKES_KEY]: '[]',
        [ORIGINAL_STROKE_WEIGHT_KEY]: '0',
        [ORIGINAL_STROKE_ALIGN_KEY]: 'INSIDE',
      },
    })
    figmaMock.currentPage.selection = [node]

    handleRevertScreenImages(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(data[ORIGINAL_STROKES_KEY]).toBeUndefined()
    expect(data[ORIGINAL_STROKE_WEIGHT_KEY]).toBeUndefined()
    expect(data[ORIGINAL_STROKE_ALIGN_KEY]).toBeUndefined()
  })

  it('is a no-op on a plain image (not marked)', () => {
    const { node, data } = createMockImageNode()
    figmaMock.currentPage.selection = [node]

    handleRevertScreenImages(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(data.type).toBeUndefined()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: REVERT_SCREEN_SUCCESS,
      payload: { count: 0 },
    })
  })

  it('skips non-image nodes that are screen-marked (e.g. created Screen shapes)', () => {
    const { node, data } = createMockImageNode({
      hasImage: false,
      pluginData: { type: 'screen' },
    })
    figmaMock.currentPage.selection = [node]

    handleRevertScreenImages(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    // Non-image screens (created via create-screen) must not be reverted.
    expect(data.type).toBe('screen')
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: REVERT_SCREEN_SUCCESS,
      payload: { count: 0 },
    })
  })

  it('processes only eligible items in a mixed selection', () => {
    const screen1 = createMockImageNode({
      id: 'img-1',
      pluginData: { type: 'screen', [ORIGINAL_STROKES_KEY]: '[]' },
    })
    const plainImage = createMockImageNode({ id: 'img-2' })
    const screen2 = createMockImageNode({
      id: 'img-3',
      pluginData: { type: 'screen', [ORIGINAL_STROKES_KEY]: '[]' },
    })
    figmaMock.currentPage.selection = [
      screen1.node,
      plainImage.node,
      screen2.node,
    ]

    handleRevertScreenImages(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(screen1.data.type).toBeUndefined()
    expect(screen2.data.type).toBeUndefined()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: REVERT_SCREEN_SUCCESS,
      payload: { count: 2 },
    })
  })

  it('posts exactly one success message followed by a selection-changed refresh', () => {
    const { node } = createMockImageNode({
      pluginData: { type: 'screen', [ORIGINAL_STROKES_KEY]: '[]' },
    })
    figmaMock.currentPage.selection = [node]

    handleRevertScreenImages(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledTimes(2)
    expect(figmaMock.ui.postMessage).toHaveBeenNthCalledWith(1, {
      type: REVERT_SCREEN_SUCCESS,
      payload: { count: 1 },
    })
    const secondCall = figmaMock.ui.postMessage.mock.calls[1][0]
    expect(secondCall).toMatchObject({ type: 'selection-changed' })
  })

  it('does not throw and reverts with safe defaults when saved JSON is malformed', () => {
    const { node, data } = createMockImageNode({
      pluginData: {
        type: 'screen',
        [ORIGINAL_STROKES_KEY]: '{not valid json',
        [ORIGINAL_STROKE_WEIGHT_KEY]: 'NaN-ish',
        [ORIGINAL_STROKE_ALIGN_KEY]: 'BOGUS',
      },
      strokes: [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } } as SolidPaint],
      strokeWeight: 3,
    })
    figmaMock.currentPage.selection = [node]

    expect(() =>
      handleRevertScreenImages(undefined, {
        figma: figmaMock as unknown as typeof figma,
      })
    ).not.toThrow()

    expect(node.strokes).toEqual([])
    expect(node.strokeWeight).toBe(0)
    expect(node.strokeAlign).toBe('INSIDE')
    expect(data.type).toBeUndefined()
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: REVERT_SCREEN_SUCCESS,
      payload: { count: 1 },
    })
  })

  it('posts an error message when the handler throws unexpectedly', () => {
    const exploding = {
      get fills(): Paint[] {
        throw new Error('boom')
      },
    }
    figmaMock.currentPage.selection = [exploding]

    handleRevertScreenImages(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    const calls = figmaMock.ui.postMessage.mock.calls
    const lastCall = calls[calls.length - 1][0] as {
      type: string
      payload: { message: string }
    }
    expect(lastCall.type).toBe(REVERT_SCREEN_ERROR)
    expect(lastCall.payload.message).toContain('boom')
  })

  it('falls back to empty strokes when no saved state exists', () => {
    const { node } = createMockImageNode({
      pluginData: { type: 'screen' },
      strokes: [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } } as SolidPaint],
      strokeWeight: 3,
    })
    figmaMock.currentPage.selection = [node]

    handleRevertScreenImages(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(node.strokes).toEqual([])
    expect(node.strokeWeight).toBe(0)
  })
})

describe('mark then revert round trip', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('mark then revert restores the original strokes', () => {
    const originalStrokes: Paint[] = [
      { type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } } as SolidPaint,
    ]
    const { node } = createMockImageNode({
      strokes: originalStrokes,
      strokeWeight: 1,
      strokeAlign: 'CENTER',
    })
    figmaMock.currentPage.selection = [node]

    handleMarkImagesAsScreen(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })
    handleRevertScreenImages(undefined, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(node.strokes).toEqual(originalStrokes)
    expect(node.strokeWeight).toBe(1)
    expect(node.strokeAlign).toBe('CENTER')
  })
})
