import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ElementEditor } from '../view-selected-element/ElementEditor'
import type { ElementType } from '../../shared/types/plugin'

describe('Export to Markdown button click', () => {
  const postMessageSpy = vi.fn()

  beforeEach(() => {
    postMessageSpy.mockClear()
    vi.stubGlobal('parent', { postMessage: postMessageSpy })
  })

  it('sends export-slice-to-markdown message with slice id when clicked', async () => {
    const user = userEvent.setup()
    render(
      <ElementEditor
        selectedElement={{
          id: 'slice-42',
          type: 'slice' as ElementType,
          name: 'My Slice',
        }}
      />
    )
    const button = screen.getByRole('button', { name: /export to markdown/i })

    await user.click(button)

    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        pluginMessage: {
          type: 'export-slice-to-markdown',
          payload: { id: 'slice-42' },
        },
      },
      '*'
    )
  })
})

describe('Export to Markdown clipboard and toast', () => {
  let messageHandler: (event: MessageEvent) => void

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(() => Promise.resolve()) },
    })
    vi.spyOn(window, 'addEventListener').mockImplementation(((type: string, handler: EventListener) => {
      if (type === 'message') {
        messageHandler = handler as (event: MessageEvent) => void
      }
    }) as typeof window.addEventListener)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('copies markdown to clipboard when result message is received', async () => {
    const { Panel } = await import('../open-plugin-panel/Panel')
    render(<Panel />)

    await act(async () => {
      messageHandler(new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'export-slice-to-markdown-result',
            payload: { markdown: '# My Slice\n' },
          },
        },
      }))
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('# My Slice\n')
  })

  it('shows toast notification after copying to clipboard', async () => {
    const { Panel } = await import('../open-plugin-panel/Panel')
    render(<Panel />)

    await act(async () => {
      messageHandler(new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'export-slice-to-markdown-result',
            payload: { markdown: '# My Slice\n' },
          },
        },
      }))
    })

    expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument()
  })

  it('auto-dismisses toast after 3 seconds', async () => {
    vi.useFakeTimers()
    const { Panel } = await import('../open-plugin-panel/Panel')
    render(<Panel />)

    await act(async () => {
      messageHandler(new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'export-slice-to-markdown-result',
            payload: { markdown: '# My Slice\n' },
          },
        },
      }))
    })

    expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByText('Copied to clipboard!')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows error toast when clipboard write fails', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(() => Promise.reject(new Error('denied'))) },
    })
    const { Panel } = await import('../open-plugin-panel/Panel')
    render(<Panel />)

    await act(async () => {
      messageHandler(new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'export-slice-to-markdown-result',
            payload: { markdown: '# My Slice\n' },
          },
        },
      }))
    })

    expect(screen.getByText('Failed to copy to clipboard')).toBeInTheDocument()
  })
})
