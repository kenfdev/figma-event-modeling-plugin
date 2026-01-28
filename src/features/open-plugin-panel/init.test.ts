import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

// Import the initialization function
import { initializePlugin } from './init'

describe('Plugin Initialization', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  describe('FigJam-only restriction', () => {
    it('closes plugin with error message when not in FigJam', () => {
      figmaMock.editorType = 'figma'

      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.closePlugin).toHaveBeenCalledWith(
        'This plugin only works in FigJam files.'
      )
      expect(figmaMock.showUI).not.toHaveBeenCalled()
    })

    it('continues initialization when in FigJam', () => {
      figmaMock.editorType = 'figjam'

      initializePlugin({ figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.closePlugin).not.toHaveBeenCalled()
      expect(figmaMock.showUI).toHaveBeenCalled()
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
})
