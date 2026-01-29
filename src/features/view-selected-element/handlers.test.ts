import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  handleSelectionChange,
  registerSelectionChangeListener,
} from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'

describe('handleSelectionChange', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('sends null payload when nothing is selected', () => {
    figmaMock.currentPage.selection = []

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: null,
    })
  })

  it('sends null payload when selected node has no plugin data', () => {
    const mockNode = {
      id: 'node-1',
      name: 'Some Shape',
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: null,
    })
  })

  it('sends element data when selected node is a plugin element (command)', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Command',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: {
        id: 'node-1',
        type: 'command',
        name: 'My Command',
        customFields: '',
      },
    })
  })

  it('sends element data when selected node is a plugin element (event)', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Event',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'event'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: {
        id: 'node-1',
        type: 'event',
        name: 'My Event',
        customFields: '',
      },
    })
  })

  it('sends element data when selected node is a plugin element (query)', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Query',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'query'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: {
        id: 'node-1',
        type: 'query',
        name: 'My Query',
        customFields: '',
      },
    })
  })

  it('sends element data when selected node is a plugin element (actor)', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Actor',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'actor'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: {
        id: 'node-1',
        type: 'actor',
        name: 'My Actor',
        customFields: '',
      },
    })
  })

  it('sends multiple-selected payload when multiple plugin elements are selected', () => {
    const mockNode1 = {
      id: 'node-1',
      name: 'First Command',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        return ''
      }),
    }
    const mockNode2 = {
      id: 'node-2',
      name: 'Second Event',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'event'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode1, mockNode2]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: { multiple: true },
    })
  })

  it('includes customFields in payload when element has custom fields stored', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Command',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        if (key === 'customFields') return 'field1: value1\nfield2: value2'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: {
        id: 'node-1',
        type: 'command',
        name: 'My Command',
        customFields: 'field1: value1\nfield2: value2',
      },
    })
  })

  it('sends empty string for customFields when no custom fields are stored', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Command',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: {
        id: 'node-1',
        type: 'command',
        name: 'My Command',
        customFields: '',
      },
    })
  })

  it('sends single element data when only one of multiple selected nodes is a plugin element', () => {
    const pluginNode = {
      id: 'node-1',
      name: 'My Command',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        return ''
      }),
    }
    const nonPluginNode = {
      id: 'node-2',
      name: 'Plain Shape',
      getPluginData: vi.fn(() => ''),
    }
    figmaMock.currentPage.selection = [pluginNode, nonPluginNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: { multiple: true },
    })
  })
})

describe('registerSelectionChangeListener', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('registers a selectionchange event listener', () => {
    registerSelectionChangeListener({
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.on).toHaveBeenCalledWith(
      'selectionchange',
      expect.any(Function)
    )
  })

  it('calls handleSelectionChange when selection changes', () => {
    let selectionChangeCallback: (() => void) | null = null
    figmaMock.on = vi.fn((event: string, callback: () => void) => {
      if (event === 'selectionchange') {
        selectionChangeCallback = callback
      }
    })

    registerSelectionChangeListener({
      figma: figmaMock as unknown as typeof figma,
    })

    // Simulate selection change
    figmaMock.currentPage.selection = []
    selectionChangeCallback!()

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: null,
    })
  })
})
