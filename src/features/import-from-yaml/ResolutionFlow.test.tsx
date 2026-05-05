import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResolutionFlow } from './ResolutionFlow'

describe('ResolutionFlow', () => {
  const defaultProps = {
    pending: [] as Array<{ queryName: string; eventName: string; kind: 'cross-slice' | 'no-match'; candidates: Array<{ nodeId: string; label: string; parentSliceName: string | null }> }>,
    onDone: vi.fn(),
    onFocus: vi.fn(),
  }

  beforeEach(() => {
    defaultProps.onDone.mockClear()
    defaultProps.onFocus.mockClear()
  })

  describe('empty pending array', () => {
    it('returns null when pending is empty', () => {
      const { container } = render(<ResolutionFlow {...defaultProps} pending={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('counter display', () => {
    it('shows "Event 1 of 2" for first item when starting', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
        { queryName: 'Q2', eventName: 'E2', kind: 'no-match', candidates: [] },
      ]} />)
      expect(screen.getByText(/Event 1 of 2/)).toBeInTheDocument()
    })

    it('advances to show "Event 2 of 2" after first answer', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
        { queryName: 'Q2', eventName: 'E2', kind: 'no-match', candidates: [] },
      ]} />)
      await user.click(screen.getByRole('button', { name: 'Skip' }))
      expect(screen.getByText(/Event 2 of 2/)).toBeInTheDocument()
    })
  })

  describe('cross-slice prompt', () => {
    it('shows query name and event name', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'GetRoadmapStatus', eventName: 'RoadmapCreated', kind: 'cross-slice', candidates: [] },
      ]} />)
      expect(screen.getByText(/GetRoadmapStatus/)).toBeInTheDocument()
      expect(screen.getByText(/RoadmapCreated/)).toBeInTheDocument()
    })

    it('shows each candidate with label and parent slice name', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'n1', label: 'RoadmapCreated', parentSliceName: 'Slice A' },
            { nodeId: 'n2', label: 'RoadmapCreated', parentSliceName: 'Slice B' },
          ],
        },
      ]} />)
      const candidates = screen.getAllByText(/RoadmapCreated/)
      expect(candidates).toHaveLength(2)
      expect(screen.getByText(/\(Slice A\)/)).toBeInTheDocument()
      expect(screen.getByText(/\(Slice B\)/)).toBeInTheDocument()
    })

    it('shows "(no slice)" when parentSliceName is null', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'n1', label: 'RoadmapCreated', parentSliceName: null },
          ],
        },
      ]} />)
      expect(screen.getByText('(no slice)')).toBeInTheDocument()
    })

    it('has Focus button for each candidate', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'n1', label: 'RoadmapCreated', parentSliceName: 'Slice A' },
          ],
        },
      ]} />)
      expect(screen.getByRole('button', { name: 'Focus' })).toBeInTheDocument()
    })

    it('calls onFocus with nodeId when Focus button is clicked', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'node-123', label: 'RoadmapCreated', parentSliceName: 'Slice A' },
          ],
        },
      ]} />)
      await user.click(screen.getByRole('button', { name: 'Focus' }))
      expect(defaultProps.onFocus).toHaveBeenCalledWith('node-123')
    })

    it('has a Confirm button disabled until a candidate is selected', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'n1', label: 'RoadmapCreated', parentSliceName: 'Slice A' },
          ],
        },
      ]} />)
      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton).toBeDisabled()
    })

    it('Confirm button is enabled after selecting a candidate', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'n1', label: 'RoadmapCreated', parentSliceName: 'Slice A' },
          ],
        },
      ]} />)
      await user.click(screen.getByLabelText('RoadmapCreated (Slice A)'))
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled()
    })

    it('calls onDone with connect answer and selected nodeId when Confirm is clicked', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'node-456', label: 'RoadmapCreated', parentSliceName: 'Slice A' },
          ],
        },
      ]} />)
      await user.click(screen.getByLabelText('RoadmapCreated (Slice A)'))
      await user.click(screen.getByRole('button', { name: 'Confirm' }))
      expect(defaultProps.onDone).toHaveBeenCalledWith([{ queryName: 'Q1', eventName: 'E1', resolution: 'connect', candidateNodeId: 'node-456' }])
    })
  })

  describe('no-match prompt', () => {
    it('shows event name', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'GetRoadmapStatus', eventName: 'NonExistentEvent', kind: 'no-match', candidates: [] },
      ]} />)
      expect(screen.getByText(/NonExistentEvent/)).toBeInTheDocument()
    })

    it('has Create button', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
      ]} />)
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
    })

    it('has Skip button', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
      ]} />)
      expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
    })

    it('calls onDone with create answer when Create is clicked', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
      ]} />)
      await user.click(screen.getByRole('button', { name: 'Create' }))
      expect(defaultProps.onDone).toHaveBeenCalledWith([{ queryName: 'Q1', eventName: 'E1', resolution: 'create' }])
    })

    it('calls onDone with skip answer when Skip is clicked', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
      ]} />)
      await user.click(screen.getByRole('button', { name: 'Skip' }))
      expect(defaultProps.onDone).toHaveBeenCalledWith([{ queryName: 'Q1', eventName: 'E1', resolution: 'skip' }])
    })
  })

  describe('keyboard accessibility', () => {
    it('Enter key triggers Confirm on cross-slice prompt', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'n1', label: 'E1', parentSliceName: 'Slice A' },
          ],
        },
      ]} />)
      await user.click(screen.getByLabelText('E1 (Slice A)'))
      await user.keyboard('{Enter}')
      expect(defaultProps.onDone).toHaveBeenCalledWith([{ queryName: 'Q1', eventName: 'E1', resolution: 'connect', candidateNodeId: 'n1' }])
    })

    it('Enter key triggers Create on no-match prompt', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
      ]} />)
      await user.tab()
      await user.keyboard('{Enter}')
      expect(defaultProps.onDone).toHaveBeenCalledWith([{ queryName: 'Q1', eventName: 'E1', resolution: 'create' }])
    })
  })

  describe('stale selection clearing', () => {
    it('selected candidate is cleared after skip', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'n1', label: 'E1', parentSliceName: 'Slice A' },
          ],
        },
        {
          queryName: 'Q2',
          eventName: 'E2',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'n2', label: 'E2', parentSliceName: 'Slice B' },
          ],
        },
      ]} />)
      await user.click(screen.getByLabelText('E1 (Slice A)'))
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled()
      await user.click(screen.getByRole('button', { name: 'Skip' }))
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
    })
  })

  describe('advancing through multiple pending items', () => {
    it('calls onDone after answering last item', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
        { queryName: 'Q2', eventName: 'E2', kind: 'no-match', candidates: [] },
      ]} />)
      await user.click(screen.getByRole('button', { name: 'Skip' }))
      expect(defaultProps.onDone).not.toHaveBeenCalled()
      expect(screen.getByText('Event 2 of 2')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Skip' }))
      expect(defaultProps.onDone).toHaveBeenCalledWith([
        { queryName: 'Q1', eventName: 'E1', resolution: 'skip' },
        { queryName: 'Q2', eventName: 'E2', resolution: 'skip' },
      ])
    })

    it('accumulates answers in correct order', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'n1', label: 'E1', parentSliceName: 'Slice A' },
          ],
        },
        { queryName: 'Q2', eventName: 'E2', kind: 'no-match', candidates: [] },
      ]} />)
      await user.click(screen.getByLabelText('E1 (Slice A)'))
      await user.click(screen.getByRole('button', { name: 'Confirm' }))
      await user.click(screen.getByRole('button', { name: 'Create' }))
      expect(defaultProps.onDone).toHaveBeenCalledWith([
        { queryName: 'Q1', eventName: 'E1', resolution: 'connect', candidateNodeId: 'n1' },
        { queryName: 'Q2', eventName: 'E2', resolution: 'create' },
      ])
    })
  })
})