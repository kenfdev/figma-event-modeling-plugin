import { vi } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof vi.fn<(...args: any[]) => any>>

export interface FigmaMock {
  editorType: 'figjam' | 'figma'
  showUI: MockFn
  closePlugin: MockFn
  on: MockFn
  ui: {
    postMessage: MockFn
    resize: MockFn
    onmessage: ((msg: unknown) => void) | null
  }
  currentPage: {
    appendChild: MockFn
    children: unknown[]
    selection: unknown[]
    findAll: MockFn
  }
  viewport: {
    center: { x: number; y: number }
    zoom: number
    bounds: { x: number; y: number; width: number; height: number }
    scrollAndZoomIntoView: MockFn
  }
  createShapeWithText: MockFn
  createSection: MockFn
  createSticky: MockFn
  createConnector: MockFn
  createRectangle: MockFn
  createNodeFromSvg: MockFn
  createText: MockFn
  group: MockFn
  loadFontAsync: MockFn
  getNodeById: MockFn
  getNodeByIdAsync: MockFn
  loadAllPagesAsync: MockFn
  notify: MockFn
  openExternal: MockFn
  clientStorage: {
    getAsync: MockFn
    setAsync: MockFn
  }
}

export function createFigmaMock(overrides?: Partial<FigmaMock>): FigmaMock {
  return {
    editorType: 'figjam',
    showUI: vi.fn(),
    closePlugin: vi.fn(),
    on: vi.fn(),
    ui: {
      postMessage: vi.fn(),
      resize: vi.fn(),
      onmessage: null,
    },
    currentPage: {
      appendChild: vi.fn(),
      children: [],
      selection: [],
      findAll: vi.fn(() => []),
    },
    viewport: {
      center: { x: 0, y: 0 },
      zoom: 1,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      scrollAndZoomIntoView: vi.fn(),
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
      width: 280,
      height: 40,
      resizeWithoutConstraints: vi.fn(),
      fills: [],
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    })),
    createSticky: vi.fn(() => ({
      id: 'mock-sticky-id',
      x: 0,
      y: 0,
      text: { characters: '' },
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    })),
    createConnector: vi.fn(() => ({
      id: 'mock-connector-id',
      connectorStart: { endpointNodeId: '', magnet: 'AUTO' },
      connectorEnd: { endpointNodeId: '', magnet: 'AUTO' },
      text: { characters: '', fills: [] },
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    })),
    createRectangle: vi.fn(() => ({
      id: 'mock-rect-id',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      fills: [],
      cornerRadius: 0,
      resize: vi.fn(),
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    })),
    createNodeFromSvg: vi.fn(() => ({
      id: 'mock-svg-id',
      x: 0,
      y: 0,
      width: 48,
      height: 48,
      resize: vi.fn(),
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    })),
    createText: vi.fn(() => ({
      id: 'mock-text-id',
      characters: '',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      fontSize: 12,
      fills: [],
      resize: vi.fn(),
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    })),
    group: vi.fn(() => ({
      id: 'mock-group-id',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      setPluginData: vi.fn(),
      getPluginData: vi.fn(() => ''),
    })),
    loadFontAsync: vi.fn(() => Promise.resolve()),
    getNodeById: vi.fn(),
    getNodeByIdAsync: vi.fn(() => Promise.resolve(null)),
    loadAllPagesAsync: vi.fn(() => Promise.resolve()),
    notify: vi.fn(),
    openExternal: vi.fn(() => Promise.resolve()),
    clientStorage: {
      getAsync: vi.fn(),
      setAsync: vi.fn(),
    },
    ...overrides,
  }
}

// Re-export for convenience
export function resetFigmaMock(): void {
  ;(globalThis as any).figma = createFigmaMock()
}
