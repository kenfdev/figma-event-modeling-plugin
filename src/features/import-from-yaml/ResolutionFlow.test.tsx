import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResolutionFlow } from './ResolutionFlow'

describe('ResolutionFlow', () => {
  const defaultProps = {
    pending: [] as Array<{
      queryName: string
      eventName: string
      kind: 'cross-slice' | 'no-match'
      candidates: Array<{ nodeId: string; label: string; parentSliceName: string | null }>
    }>,
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
      expect(screen.getAllByText(/RoadmapCreated/).length).toBeGreaterThan(0)
    })

    it('shows each candidate with slice name as primary and label as secondary', () => {
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
      expect(screen.getByText('Slice A')).toBeInTheDocument()
      expect(screen.getByText('Slice B')).toBeInTheDocument()
      const labels = screen.getAllByText('RoadmapCreated')
      expect(labels.length).toBeGreaterThanOrEqual(2)
    })

    it('shows "no slice" when parentSliceName is null', () => {
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
      expect(screen.getByText('no slice')).toBeInTheDocument()
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
      expect(screen.getByRole('button', { name: /Focus RoadmapCreated in Slice A/i })).toBeInTheDocument()
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
      await user.click(screen.getByRole('button', { name: /Focus RoadmapCreated in Slice A/i }))
      expect(defaultProps.onFocus).toHaveBeenCalledWith('node-123')
    })

    it('Confirm is disabled until an option is selected when candidates exist', () => {
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
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
    })

    it('Confirm is enabled after selecting a candidate', async () => {
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

    it('emits connect answer when a candidate is selected and confirmed', async () => {
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

    it('always offers a "Create new in this slice" option even when candidates exist', () => {
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
      expect(screen.getByLabelText('Create new E1 in this slice')).toBeInTheDocument()
    })

    it('emits create answer when "Create new" option is selected and confirmed', async () => {
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
      await user.click(screen.getByLabelText('Create new E1 in this slice'))
      await user.click(screen.getByRole('button', { name: 'Confirm' }))
      expect(defaultProps.onDone).toHaveBeenCalledWith([{ queryName: 'Q1', eventName: 'E1', resolution: 'create' }])
    })
  })

  describe('no-match prompt', () => {
    it('shows event name', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'GetRoadmapStatus', eventName: 'NonExistentEvent', kind: 'no-match', candidates: [] },
      ]} />)
      expect(screen.getAllByText(/NonExistentEvent/).length).toBeGreaterThan(0)
    })

    it('auto-selects the create option so Confirm is immediately enabled', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
      ]} />)
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled()
      expect(screen.getByLabelText('Create new E1 in this slice')).toBeChecked()
    })

    it('has a Skip button', () => {
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
      ]} />)
      expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
    })

    it('emits create answer when Confirm is clicked', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
      ]} />)
      await user.click(screen.getByRole('button', { name: 'Confirm' }))
      expect(defaultProps.onDone).toHaveBeenCalledWith([{ queryName: 'Q1', eventName: 'E1', resolution: 'create' }])
    })

    it('emits skip answer when Skip is clicked', async () => {
      const user = userEvent.setup()
      render(<ResolutionFlow {...defaultProps} pending={[
        { queryName: 'Q1', eventName: 'E1', kind: 'no-match', candidates: [] },
      ]} />)
      await user.click(screen.getByRole('button', { name: 'Skip' }))
      expect(defaultProps.onDone).toHaveBeenCalledWith([{ queryName: 'Q1', eventName: 'E1', resolution: 'skip' }])
    })
  })

  describe('preview', () => {
    it('shows placeholder text when nothing is selected', () => {
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
      expect(screen.getByText(/Pick an option above/i)).toBeInTheDocument()
    })

    it('shows connect preview when a candidate is selected', async () => {
      const user = userEvent.setup()
      const { container } = render(<ResolutionFlow {...defaultProps} pending={[
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
      const preview = container.querySelector('.resolution-preview')
      expect(preview?.textContent).toMatch(/Connect to/i)
    })

    it('shows create preview when the create option is selected', async () => {
      const user = userEvent.setup()
      const { container } = render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'n1', label: 'E1', parentSliceName: 'Slice A' },
          ],
        },
      ]} />)
      await user.click(screen.getByLabelText('Create new E1 in this slice'))
      const preview = container.querySelector('.resolution-preview')
      expect(preview?.textContent).toMatch(/→\s*Create new/i)
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

    it('Enter key submits the auto-selected create option on no-match prompt', async () => {
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
    it('selected candidate is cleared after skip when next item has candidates', async () => {
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

  describe('styling', () => {
    it('Confirm button uses primary button class', () => {
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
      expect(screen.getByRole('button', { name: 'Confirm' })).toHaveClass('resolution-primary-btn')
    })

    it('Skip button uses secondary button class', () => {
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
      expect(screen.getByRole('button', { name: 'Skip' })).toHaveClass('resolution-secondary-btn')
    })

    it('candidate row gets selected modifier class when chosen', async () => {
      const user = userEvent.setup()
      const { container } = render(<ResolutionFlow {...defaultProps} pending={[
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
      const selectedRow = container.querySelector('.resolution-candidate-row--selected')
      expect(selectedRow).not.toBeNull()
    })

    it('create option uses the create modifier class', () => {
      const { container } = render(<ResolutionFlow {...defaultProps} pending={[
        {
          queryName: 'Q1',
          eventName: 'E1',
          kind: 'cross-slice',
          candidates: [
            { nodeId: 'n1', label: 'E1', parentSliceName: 'Slice A' },
          ],
        },
      ]} />)
      expect(container.querySelector('.resolution-candidate-row--create')).not.toBeNull()
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
      await user.click(screen.getByRole('button', { name: 'Confirm' }))
      expect(defaultProps.onDone).toHaveBeenCalledWith([
        { queryName: 'Q1', eventName: 'E1', resolution: 'connect', candidateNodeId: 'n1' },
        { queryName: 'Q2', eventName: 'E2', resolution: 'create' },
      ])
    })
  })
})
