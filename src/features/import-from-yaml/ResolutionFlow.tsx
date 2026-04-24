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
  | { kind: 'connect'; candidateNodeId: string }
  | { kind: 'create' }
  | { kind: 'skip' }

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
    advance({ kind: 'connect', candidateNodeId: selectedCandidateId })
  }

  const handleCreate = () => {
    advance({ kind: 'create' })
  }

  const handleSkip = () => {
    advance({ kind: 'skip' })
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
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
      <p style={{ marginBottom: '16px' }}>
        <strong>{queryName}</strong> references event <strong>{eventName}</strong> which exists in other slices:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {candidates.map(candidate => (
          <label
            key={candidate.nodeId}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <input
              type="radio"
              name="candidate"
              checked={selectedCandidateId === candidate.nodeId}
              onChange={() => onSelectCandidate(candidate.nodeId)}
              aria-label={`${candidate.label} (${candidate.parentSliceName ?? 'no slice'})`}
            />
            <span>{candidate.label}</span>
            <span style={{ color: '#888' }}>({candidate.parentSliceName ?? 'no slice'})</span>
            <button
              type="button"
              onClick={() => onFocus(candidate.nodeId)}
              style={{ marginLeft: 'auto', fontSize: '12px', padding: '2px 8px' }}
            >
              Focus
            </button>
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="submit"
          disabled={!selectedCandidateId}
        >
          Confirm
        </button>
        <button
          type="button"
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
      <p style={{ marginBottom: '16px' }}>
        No event named <strong>{eventName}</strong> exists. Create it in this slice?
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="submit"
        >
          Create
        </button>
        <button
          type="button"
          onClick={onSkip}
        >
          Skip
        </button>
      </div>
    </form>
  )
}