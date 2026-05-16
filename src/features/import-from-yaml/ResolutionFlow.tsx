import { useState, useEffect } from 'react'

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

type SelectionId = string

const CREATE_OPTION: SelectionId = 'create'
const candidateOptionId = (nodeId: string): SelectionId => `candidate:${nodeId}`

function defaultSelectionFor(item: PendingResolution | undefined): SelectionId | null {
  if (!item) return null
  if (item.candidates.length === 0) return CREATE_OPTION
  return null
}

export function ResolutionFlow({ pending, onDone, onFocus }: ResolutionFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<ResolutionAnswer[]>([])
  const current = pending[currentIndex] as PendingResolution | undefined
  const [selectionId, setSelectionId] = useState<SelectionId | null>(() =>
    defaultSelectionFor(pending[0])
  )

  useEffect(() => {
    setSelectionId(defaultSelectionFor(current))
  }, [current])

  if (pending.length === 0 || !current) {
    return null
  }

  const isLast = currentIndex === pending.length - 1

  const advance = (answer: ResolutionAnswer) => {
    const newAnswers = [...answers, answer]
    if (isLast) {
      onDone(newAnswers)
    } else {
      setAnswers(newAnswers)
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleConfirm = () => {
    if (!selectionId) return
    if (selectionId === CREATE_OPTION) {
      advance({
        queryName: current.queryName,
        eventName: current.eventName,
        resolution: 'create',
      })
      return
    }
    const nodeId = selectionId.slice('candidate:'.length)
    advance({
      queryName: current.queryName,
      eventName: current.eventName,
      resolution: 'connect',
      candidateNodeId: nodeId,
    })
  }

  const handleSkip = () => {
    advance({
      queryName: current.queryName,
      eventName: current.eventName,
      resolution: 'skip',
    })
  }

  const promptNode =
    current.kind === 'cross-slice' ? (
      <>
        <strong>{current.queryName}</strong> references event <strong>{current.eventName}</strong>{' '}
        which exists in other slices:
      </>
    ) : (
      <>
        No event named <strong>{current.eventName}</strong> exists.
      </>
    )

  const preview = renderPreview(selectionId, current)

  return (
    <div className="resolution-container">
      <div className="resolution-counter">
        Event {currentIndex + 1} of {pending.length}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleConfirm()
        }}
      >
        <p className="resolution-prompt">{promptNode}</p>

        <div className="resolution-candidate-list">
          {current.candidates.map((candidate) => {
            const id = candidateOptionId(candidate.nodeId)
            const isSelected = selectionId === id
            const sliceLabel = candidate.parentSliceName ?? 'no slice'
            const rowClass = isSelected
              ? 'resolution-candidate-row resolution-candidate-row--selected'
              : 'resolution-candidate-row'
            return (
              <label key={candidate.nodeId} className={rowClass}>
                <input
                  type="radio"
                  name="resolution"
                  className="resolution-candidate-radio"
                  checked={isSelected}
                  onChange={() => setSelectionId(id)}
                  aria-label={`${candidate.label} (${sliceLabel})`}
                />
                <span className="resolution-candidate-text">
                  <span className="resolution-candidate-slice">{sliceLabel}</span>
                  <span className="resolution-candidate-label">{candidate.label}</span>
                </span>
                <button
                  type="button"
                  className="resolution-secondary-btn resolution-focus-btn"
                  onClick={() => onFocus(candidate.nodeId)}
                  aria-label={`Focus ${candidate.label} in ${sliceLabel}`}
                  title="Focus on canvas"
                >
                  <FocusIcon />
                </button>
              </label>
            )
          })}

          <label
            className={
              selectionId === CREATE_OPTION
                ? 'resolution-candidate-row resolution-candidate-row--create resolution-candidate-row--selected'
                : 'resolution-candidate-row resolution-candidate-row--create'
            }
          >
            <input
              type="radio"
              name="resolution"
              className="resolution-candidate-radio"
              checked={selectionId === CREATE_OPTION}
              onChange={() => setSelectionId(CREATE_OPTION)}
              aria-label={`Create new ${current.eventName} in this slice`}
            />
            <span className="resolution-candidate-text">
              <span className="resolution-candidate-slice">+ Create new in this slice</span>
              <span className="resolution-candidate-label">{current.eventName}</span>
            </span>
          </label>
        </div>

        <p className="resolution-preview" aria-live="polite">
          {preview ?? <span className="resolution-preview--placeholder">Pick an option above</span>}
        </p>

        <div className="resolution-button-group">
          <button
            type="submit"
            className="resolution-primary-btn"
            disabled={!selectionId}
          >
            Confirm
          </button>
          <button
            type="button"
            className="resolution-secondary-btn"
            onClick={handleSkip}
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  )
}

function renderPreview(selectionId: SelectionId | null, current: PendingResolution) {
  if (!selectionId) return null
  if (selectionId === CREATE_OPTION) {
    return (
      <>
        → Create new <strong>{current.eventName}</strong> event in this slice
      </>
    )
  }
  const nodeId = selectionId.slice('candidate:'.length)
  const candidate = current.candidates.find((c) => c.nodeId === nodeId)
  if (!candidate) return null
  const sliceLabel = candidate.parentSliceName ?? 'no slice'
  return (
    <>
      → Connect to <strong>{candidate.label}</strong> in <strong>{sliceLabel}</strong>
    </>
  )
}

function FocusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  )
}
