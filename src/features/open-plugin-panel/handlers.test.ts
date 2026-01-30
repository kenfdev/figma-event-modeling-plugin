import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMessageRouter, registerHandler } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('Message Handlers', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  describe('createMessageRouter', () => {
    it('routes close message to closePlugin', () => {
      const router = createMessageRouter({ figma: figmaMock as unknown as typeof figma })

      router({ type: 'close' })

      expect(figmaMock.closePlugin).toHaveBeenCalled()
    })

    it('routes resize-panel message to figma.ui.resize with rounded values', () => {
      const router = createMessageRouter({ figma: figmaMock as unknown as typeof figma })

      router({ type: 'resize-panel', payload: { width: 350.7, height: 600.3 } })

      expect(figmaMock.ui.resize).toHaveBeenCalledWith(351, 600)
    })

    it('logs unknown message types', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const router = createMessageRouter({ figma: figmaMock as unknown as typeof figma })

      router({ type: 'unknown-type' })

      expect(consoleSpy).toHaveBeenCalledWith('Unknown message type:', 'unknown-type')
      consoleSpy.mockRestore()
    })
  })

  describe('registerHandler', () => {
    it('allows registering custom handlers', () => {
      const customHandler = vi.fn()
      registerHandler('custom-action', customHandler)

      const router = createMessageRouter({ figma: figmaMock as unknown as typeof figma })
      router({ type: 'custom-action', payload: { data: 'test' } })

      expect(customHandler).toHaveBeenCalledWith(
        { data: 'test' },
        { figma: figmaMock }
      )
    })
  })
})
