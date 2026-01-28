import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Panel } from './Panel'

describe('Platform Error Display', () => {
  let messageHandler: ((event: MessageEvent) => void) | null = null

  beforeEach(() => {
    // Capture the message handler registered by the component
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'message') {
        messageHandler = handler as (event: MessageEvent) => void
      }
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    messageHandler = null
    vi.restoreAllMocks()
  })

  const simulatePlatformMessage = (editorType: 'figma' | 'figjam') => {
    if (messageHandler) {
      act(() => {
        messageHandler({
          data: {
            pluginMessage: {
              type: 'platform-detected',
              payload: { editorType },
            },
          },
        } as MessageEvent)
      })
    }
  }

  describe('when running in Figma Design', () => {
    it('displays an error message explaining the plugin requires FigJam', () => {
      render(<Panel />)

      simulatePlatformMessage('figma')

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/this plugin only works in figjam/i)).toBeInTheDocument()
    })

    it('hides or disables the creation buttons', () => {
      render(<Panel />)

      simulatePlatformMessage('figma')

      // Core Shapes buttons should not be visible or should be disabled
      expect(screen.queryByRole('button', { name: 'Command' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Event' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Query' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Actor' })).not.toBeInTheDocument()

      // Structural buttons should not be visible
      expect(screen.queryByRole('button', { name: 'Lane' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Chapter' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Processor' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Screen' })).not.toBeInTheDocument()

      // Sections buttons should not be visible
      expect(screen.queryByRole('button', { name: 'Slice' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'GWT' })).not.toBeInTheDocument()
    })

    it('still displays the plugin title', () => {
      render(<Panel />)

      simulatePlatformMessage('figma')

      expect(screen.getByRole('heading', { name: 'Event Modeling' })).toBeInTheDocument()
    })
  })

  describe('when running in FigJam', () => {
    it('does not display an error message', () => {
      render(<Panel />)

      simulatePlatformMessage('figjam')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('displays all creation buttons', () => {
      render(<Panel />)

      simulatePlatformMessage('figjam')

      // Core Shapes buttons should be visible
      expect(screen.getByRole('button', { name: 'Command' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Event' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Query' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Actor' })).toBeInTheDocument()

      // Structural buttons should be visible
      expect(screen.getByRole('button', { name: 'Lane' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Chapter' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Processor' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Screen' })).toBeInTheDocument()

      // Sections buttons should be visible
      expect(screen.getByRole('button', { name: 'Slice' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'GWT' })).toBeInTheDocument()
    })
  })

  describe('before platform is detected', () => {
    it('shows a loading state or normal UI', () => {
      render(<Panel />)

      // Before any message, the component should show normal UI or loading
      // The buttons should be present (they may be disabled until element creation is implemented)
      expect(screen.getByRole('heading', { name: 'Event Modeling' })).toBeInTheDocument()
    })
  })
})
