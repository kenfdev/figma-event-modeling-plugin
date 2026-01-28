import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

// Import the initialization function
import { initializePlugin } from './init'

describe('Plugin Initialization', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  describe('Platform handling', () => {
    it('shows UI when in Figma Design (error displayed in UI)', () => {
      figmaMock.editorType = 'figma'

      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.showUI).toHaveBeenCalled()
      expect(figmaMock.closePlugin).not.toHaveBeenCalled()
    })

    it('shows UI when in FigJam', () => {
      figmaMock.editorType = 'figjam'

      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.showUI).toHaveBeenCalled()
      expect(figmaMock.closePlugin).not.toHaveBeenCalled()
    })
  })

  describe('UI Panel setup', () => {
    it('shows UI with correct dimensions', () => {
      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.showUI).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          width: 300,
          height: 400,
        })
      )
    })

    it('shows UI with title', () => {
      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.showUI).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Event Modeling',
        })
      )
    })

    it('shows UI with themeColors for consistent styling', () => {
      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.showUI).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          themeColors: true,
        })
      )
    })
  })

  describe('Message handler setup', () => {
    it('sets up message handler for UI messages', () => {
      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.ui.onmessage).not.toBeNull()
    })

    it('message handler processes close message', () => {
      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      // Simulate a message from UI
      if (figmaMock.ui.onmessage) {
        figmaMock.ui.onmessage({ type: 'close' })
      }

      expect(figmaMock.closePlugin).toHaveBeenCalled()
    })
  })

  describe('Platform detection', () => {
    it('sends platform-detected message to UI after showUI when in FigJam', () => {
      figmaMock.editorType = 'figjam'

      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
        type: 'platform-detected',
        payload: { editorType: 'figjam' },
      })
    })

    it('sends platform-detected message with figma when in Figma Design', () => {
      figmaMock.editorType = 'figma'

      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
        type: 'platform-detected',
        payload: { editorType: 'figma' },
      })
    })

    it('sends platform-detected message after showUI is called', () => {
      figmaMock.editorType = 'figjam'
      let showUICallOrder = 0
      let postMessageCallOrder = 0
      let callCounter = 0

      figmaMock.showUI = vi.fn(() => {
        showUICallOrder = ++callCounter
      })
      figmaMock.ui.postMessage = vi.fn(() => {
        postMessageCallOrder = ++callCounter
      })

      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      expect(showUICallOrder).toBeLessThan(postMessageCallOrder)
    })
  })
})
