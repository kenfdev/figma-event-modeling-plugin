import { vi } from 'vitest'

export interface FigmaMock {
  editorType: 'figjam' | 'figma'
  showUI: ReturnType<typeof vi.fn>
  closePlugin: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  ui: {
    postMessage: ReturnType<typeof vi.fn>
    onmessage: ((msg: unknown) => void) | null
  }
  currentPage: {
    appendChild: ReturnType<typeof vi.fn>
    children: unknown[]
    selection: unknown[]
  }
  viewport: {
    center: { x: number; y: number }
    zoom: number
  }
  createShapeWithText: ReturnType<typeof vi.fn>
  createSection: ReturnType<typeof vi.fn>
  createConnector: ReturnType<typeof vi.fn>
  loadFontAsync: ReturnType<typeof vi.fn>
  getNodeById: ReturnType<typeof vi.fn>
  notify: ReturnType<typeof vi.fn>
}

export function createFigmaMock(overrides?: Partial<FigmaMock>): FigmaMock {
  return {
    editorType: 'figjam',
    showUI: vi.fn(),
    closePlugin: vi.fn(),
    on: vi.fn(),
    ui: {
      postMessage: vi.fn(),
      onmessage: null,
    },
    currentPage: {
      appendChild: vi.fn(),
      children: [],
      selection: [],
    },
    viewport: {
      center: { x: 0, y: 0 },
      zoom: 1,
    },
    createShapeWithText: vi.fn(() => ({
      id: 'mock-shape-id',
      shapeType: 'ROUNDED_RECTANGLE',
      cornerRadius: 0,
      x: 0,
      y: 0,
      resize: vi.fn(),
      fills: [],
      strokes: [],
      strokeWeight: 1,
      text: { characters: '', fills: [] },
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    })),
    createSection: vi.fn(() => ({
      id: 'mock-section-id',
      name: '',
      x: 0,
      y: 0,
      resizeWithoutConstraints: vi.fn(),
      fills: [],
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    })),
    createConnector: vi.fn(() => ({
      id: 'mock-connector-id',
      connectorStart: { endpointNodeId: '', magnet: 'AUTO' },
      connectorEnd: { endpointNodeId: '', magnet: 'AUTO' },
    })),
    loadFontAsync: vi.fn(() => Promise.resolve()),
    getNodeById: vi.fn(),
    notify: vi.fn(),
    ...overrides,
  }
}

// Re-export for convenience
export function resetFigmaMock(): void {
  globalThis.figma = createFigmaMock()
}
