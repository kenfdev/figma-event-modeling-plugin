import { useState } from 'react'

export interface CandidateEvent {
  nodeId: string
  label: string
  parentSliceName: string | null
}

export interface PendingResolution {
  queryName: string
  eventName: string
  kind: 'cross-slice' | 'no-match'
  candidates: CandidateEvent[]
}

export type ResolutionAnswer =
  | { queryName: string; eventName: string; resolution: 'connect'; candidateNodeId: string }
  | { queryName: string; eventName: string; resolution: 'create' }
  | { queryName: string; eventName: string; resolution: 'skip' }

interface ResolutionFlowProps {
  pending: PendingResolution[]
  onDone: (answers: ResolutionAnswer[]) => void
  onFocus: (nodeId: string) => void
}

export function ResolutionFlow({ pending, onDone, onFocus }: ResolutionFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<ResolutionAnswer[]>([])
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)

  if (pending.length === 0) {
    return null
  }

  const current = pending[currentIndex]
  const isLast = currentIndex === pending.length - 1

  const advance = (answer: ResolutionAnswer) => {
    const newAnswers = [...answers, answer]
    if (isLast) {
      onDone(newAnswers)
    } else {
      setAnswers(newAnswers)
      setCurrentIndex(currentIndex + 1)
      setSelectedCandidateId(null)
    }
  }

  const handleConfirm = () => {
    if (!selectedCandidateId) return
    advance({
      queryName: current.queryName,
      eventName: current.eventName,
      resolution: 'connect',
      candidateNodeId: selectedCandidateId,
    })
  }

  const handleCreate = () => {
    advance({ queryName: current.queryName, eventName: current.eventName, resolution: 'create' })
  }

  const handleSkip = () => {
    advance({ queryName: current.queryName, eventName: current.eventName, resolution: 'skip' })
  }

  return (
    <div className="resolution-container">
      <div className="resolution-counter">
        Event {currentIndex + 1} of {pending.length}
      </div>

      {current.kind === 'cross-slice' ? (
        <CrossSlicePrompt
          queryName={current.queryName}
          eventName={current.eventName}
          candidates={current.candidates}
          selectedCandidateId={selectedCandidateId}
          onSelectCandidate={setSelectedCandidateId}
          onConfirm={handleConfirm}
          onSkip={handleSkip}
          onFocus={onFocus}
        />
      ) : (
        <NoMatchPrompt
          eventName={current.eventName}
          onCreate={handleCreate}
          onSkip={handleSkip}
        />
      )}
    </div>
  )
}

interface CrossSlicePromptProps {
  queryName: string
  eventName: string
  candidates: CandidateEvent[]
  selectedCandidateId: string | null
  onSelectCandidate: (id: string) => void
  onConfirm: () => void
  onSkip: () => void
  onFocus: (nodeId: string) => void
}

function CrossSlicePrompt({
  queryName,
  eventName,
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  onConfirm,
  onSkip,
  onFocus,
}: CrossSlicePromptProps) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
      <p className="resolution-prompt">
        <strong>{queryName}</strong> references event <strong>{eventName}</strong> which exists in other slices:
      </p>
      <div className="resolution-candidate-list">
        {candidates.map(candidate => {
          const isSelected = selectedCandidateId === candidate.nodeId
          const rowClass = isSelected
            ? 'resolution-candidate-row resolution-candidate-row--selected'
            : 'resolution-candidate-row'
          return (
            <label key={candidate.nodeId} className={rowClass}>
              <input
                type="radio"
                name="candidate"
                className="resolution-candidate-radio"
                checked={isSelected}
                onChange={() => onSelectCandidate(candidate.nodeId)}
                aria-label={`${candidate.label} (${candidate.parentSliceName ?? 'no slice'})`}
              />
              <span className="resolution-candidate-label">{candidate.label}</span>
              <span className="resolution-candidate-slice">({candidate.parentSliceName ?? 'no slice'})</span>
              <button
                type="button"
                className="resolution-secondary-btn resolution-focus-btn"
                onClick={() => onFocus(candidate.nodeId)}
              >
                Focus
              </button>
            </label>
          )
        })}
      </div>
      <div className="resolution-button-group">
        <button
          type="submit"
          className="resolution-primary-btn"
          disabled={!selectedCandidateId}
        >
          Confirm
        </button>
        <button
          type="button"
          className="resolution-secondary-btn"
          onClick={onSkip}
        >
          Skip
        </button>
      </div>
    </form>
  )
}

interface NoMatchPromptProps {
  eventName: string
  onCreate: () => void
  onSkip: () => void
}

function NoMatchPrompt({ eventName, onCreate, onSkip }: NoMatchPromptProps) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onCreate(); }}>
      <p className="resolution-prompt">
        No event named <strong>{eventName}</strong> exists. Create it in this slice?
      </p>
      <div className="resolution-button-group">
        <button
          type="submit"
          className="resolution-primary-btn"
        >
          Create
        </button>
        <button
          type="button"
          className="resolution-secondary-btn"
          onClick={onSkip}
        >
          Skip
        </button>
      </div>
    </form>
  )
}
