// Feature: navigate-connected-shapes
// Sandbox exports (message handlers) - import in src/main.ts only

export {
  computeConnectedNeighbors,
  handleConnectedNeighborsUpdate,
  registerConnectedNeighborsListener,
  handleNavigateToShape,
} from './handlers'
export type { ConnectedNeighborsPayload } from './handlers'
