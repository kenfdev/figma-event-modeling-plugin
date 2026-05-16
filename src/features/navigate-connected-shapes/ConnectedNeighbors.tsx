import { useEffect, useState } from 'react'
import type { NeighborItem } from '../../shared/types/plugin'

const TYPE_COLORS: Record<string, string> = {
  command: '#3DADFF',
  event: '#FF9E42',
  query: '#7ED321',
  actor: '#50E3C2',
  lane: '#C0C0C0',
  chapter: '#00BCD4',
  processor: '#333333',
  screen: '#808080',
  slice: '#FFFFFF',
  gwt: '#FFFFFF',
  native: '#999999',
}

const TYPE_LABELS: Record<string, string> = {
  command: 'Command',
  event: 'Event',
  query: 'Query',
  actor: 'Actor',
  lane: 'Lane',
  chapter: 'Chapter',
  processor: 'Processor',
  screen: 'Screen',
  slice: 'Slice',
  gwt: 'GWT',
  native: 'Native',
}

interface ConnectedNeighborsState {
  incoming: NeighborItem[]
  outgoing: NeighborItem[]
}

const EMPTY_STATE: ConnectedNeighborsState = { incoming: [], outgoing: [] }

function navigateToShape(id: string): void {
  parent.postMessage(
    { pluginMessage: { type: 'navigate-to-shape', payload: { id } } },
    '*'
  )
}

function NeighborRow({ neighbor }: { neighbor: NeighborItem }) {
  const color = TYPE_COLORS[neighbor.elementType] ?? TYPE_COLORS.native
  const typeLabel = TYPE_LABELS[neighbor.elementType] ?? 'Native'
  const displayName = neighbor.name.trim() === '' ? '(Unnamed)' : neighbor.name
  return (
    <button
      type="button"
      className="neighbor-row"
      onClick={() => navigateToShape(neighbor.id)}
      title={`${typeLabel}: ${displayName}`}
    >
      <span
        className="neighbor-badge"
        style={{ backgroundColor: color }}
        aria-label={typeLabel}
      />
      <span className="neighbor-name">{displayName}</span>
    </button>
  )
}

export function ConnectedNeighbors() {
  const [state, setState] = useState<ConnectedNeighborsState>(EMPTY_STATE)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data?.pluginMessage
      if (message?.type === 'connected-neighbors') {
        const payload = message.payload
        setState({
          incoming: Array.isArray(payload?.incoming) ? payload.incoming : [],
          outgoing: Array.isArray(payload?.outgoing) ? payload.outgoing : [],
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (state.incoming.length === 0 && state.outgoing.length === 0) {
    return null
  }

  return (
    <section
      className="connected-neighbors"
      aria-label="Connected Neighbors"
    >
      {state.incoming.length > 0 && (
        <div className="connected-neighbors-section">
          <h3 className="connected-neighbors-heading">Incoming</h3>
          <div className="connected-neighbors-list">
            {state.incoming.map((n) => (
              <NeighborRow key={`in-${n.id}`} neighbor={n} />
            ))}
          </div>
        </div>
      )}
      {state.outgoing.length > 0 && (
        <div className="connected-neighbors-section">
          <h3 className="connected-neighbors-heading">Outgoing</h3>
          <div className="connected-neighbors-list">
            {state.outgoing.map((n) => (
              <NeighborRow key={`out-${n.id}`} neighbor={n} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
