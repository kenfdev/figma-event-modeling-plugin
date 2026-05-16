import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConnectedNeighbors } from './ConnectedNeighbors'
import type { NeighborItem } from '../../shared/types/plugin'

function postFromSandbox(payload: {
  sourceId: string | null
  incoming: NeighborItem[]
  outgoing: NeighborItem[]
}): void {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { pluginMessage: { type: 'connected-neighbors', payload } },
      })
    )
  })
}

describe('ConnectedNeighbors', () => {
  let postMessageSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    postMessageSpy = vi
      .spyOn(parent, 'postMessage')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    postMessageSpy.mockRestore()
  })

  it('renders nothing when no neighbors have been received', () => {
    const { container } = render(<ConnectedNeighbors />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when both incoming and outgoing are empty', () => {
    const { container } = render(<ConnectedNeighbors />)
    postFromSandbox({ sourceId: 'a', incoming: [], outgoing: [] })
    expect(container.firstChild).toBeNull()
  })

  it('renders only Incoming heading when only incoming neighbors exist', () => {
    render(<ConnectedNeighbors />)
    postFromSandbox({
      sourceId: 'a',
      incoming: [{ id: 'n1', name: 'Upstream', elementType: 'command' }],
      outgoing: [],
    })

    expect(screen.getByText('Incoming')).toBeTruthy()
    expect(screen.queryByText('Outgoing')).toBeNull()
    expect(screen.getByText('Upstream')).toBeTruthy()
  })

  it('renders only Outgoing heading when only outgoing neighbors exist', () => {
    render(<ConnectedNeighbors />)
    postFromSandbox({
      sourceId: 'a',
      incoming: [],
      outgoing: [{ id: 'n2', name: 'Downstream', elementType: 'event' }],
    })

    expect(screen.queryByText('Incoming')).toBeNull()
    expect(screen.getByText('Outgoing')).toBeTruthy()
    expect(screen.getByText('Downstream')).toBeTruthy()
  })

  it('renders both groups when neighbors flow in and out', () => {
    render(<ConnectedNeighbors />)
    postFromSandbox({
      sourceId: 'a',
      incoming: [{ id: 'n1', name: 'Upstream', elementType: 'query' }],
      outgoing: [{ id: 'n2', name: 'Downstream', elementType: 'actor' }],
    })

    expect(screen.getByText('Incoming')).toBeTruthy()
    expect(screen.getByText('Outgoing')).toBeTruthy()
  })

  it('posts navigate-to-shape message when a neighbor row is clicked', async () => {
    const user = userEvent.setup()
    render(<ConnectedNeighbors />)
    postFromSandbox({
      sourceId: 'a',
      incoming: [],
      outgoing: [{ id: 'target-1', name: 'Target', elementType: 'event' }],
    })

    await user.click(screen.getByText('Target'))

    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        pluginMessage: {
          type: 'navigate-to-shape',
          payload: { id: 'target-1' },
        },
      },
      '*'
    )
  })

  it('hides itself again when sandbox reports an empty payload after showing neighbors', () => {
    const { container } = render(<ConnectedNeighbors />)
    postFromSandbox({
      sourceId: 'a',
      incoming: [{ id: 'n1', name: 'Upstream', elementType: 'command' }],
      outgoing: [],
    })
    expect(container.firstChild).not.toBeNull()

    postFromSandbox({ sourceId: null, incoming: [], outgoing: [] })
    expect(container.firstChild).toBeNull()
  })

  it('renders native neighbors with their name', () => {
    render(<ConnectedNeighbors />)
    postFromSandbox({
      sourceId: 'a',
      incoming: [{ id: 'sticky-1', name: 'Note', elementType: 'native' }],
      outgoing: [],
    })

    expect(screen.getByText('Note')).toBeTruthy()
  })

  it('falls back to "(Unnamed)" placeholder when a neighbor has an empty name', () => {
    render(<ConnectedNeighbors />)
    postFromSandbox({
      sourceId: 'a',
      incoming: [{ id: 'n1', name: '   ', elementType: 'native' }],
      outgoing: [],
    })

    expect(screen.getByText('(Unnamed)')).toBeTruthy()
  })

  it('ignores unrelated sandbox messages', () => {
    const { container } = render(<ConnectedNeighbors />)
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { pluginMessage: { type: 'selection-changed', payload: null } },
        })
      )
    })
    expect(container.firstChild).toBeNull()
  })
})
