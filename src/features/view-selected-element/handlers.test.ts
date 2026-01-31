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
        notes: '',
        external: false,
        fieldsVisible: false,
        issueUrl: '',
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
        notes: '',
        external: false,
        fieldsVisible: false,
        issueUrl: '',
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
        notes: '',
        external: false,
        fieldsVisible: false,
        issueUrl: '',
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
        notes: '',
        external: false,
        fieldsVisible: false,
        issueUrl: '',
      },
    })
  })

  it('sends element data when selected node is a structural element (lane)', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Lane',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'lane'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: expect.objectContaining({
        id: 'node-1',
        type: 'lane',
        name: 'My Lane',
      }),
    })
  })

  it('sends element data when selected node is a structural element (chapter)', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Chapter',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'chapter'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: expect.objectContaining({
        id: 'node-1',
        type: 'chapter',
        name: 'My Chapter',
      }),
    })
  })

  it('sends element data when selected node is a structural element (processor)', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Processor',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'processor'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: expect.objectContaining({
        id: 'node-1',
        type: 'processor',
        name: 'My Processor',
      }),
    })
  })

  it('sends element data when selected node is a structural element (screen)', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Screen',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'screen'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: expect.objectContaining({
        id: 'node-1',
        type: 'screen',
        name: 'My Screen',
      }),
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
        notes: '',
        external: false,
        fieldsVisible: false,
        issueUrl: '',
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
        notes: '',
        external: false,
        fieldsVisible: false,
        issueUrl: '',
      },
    })
  })

  it('sends multiple-selected payload when only one of multiple selected nodes is a plugin element', () => {
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

  it('includes external=true when event element has external plugin data set to "true"', () => {
    const mockNode = {
      id: 'node-1',
      name: 'OrderPlaced',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'event'
        if (key === 'external') return 'true'
        if (key === 'customFields') return ''
        if (key === 'notes') return ''
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          id: 'node-1',
          type: 'event',
          external: true,
        }),
      })
    )
  })

  it('includes external=false when event element has external plugin data set to "false"', () => {
    const mockNode = {
      id: 'node-1',
      name: 'OrderPlaced',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'event'
        if (key === 'external') return 'false'
        if (key === 'customFields') return ''
        if (key === 'notes') return ''
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          id: 'node-1',
          type: 'event',
          external: false,
        }),
      })
    )
  })

  it('includes external=false when event element has no external plugin data', () => {
    const mockNode = {
      id: 'node-1',
      name: 'OrderPlaced',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'event'
        if (key === 'customFields') return ''
        if (key === 'notes') return ''
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          id: 'node-1',
          type: 'event',
          external: false,
        }),
      })
    )
  })

  it('includes fieldsVisible=true when plugin data is "true"', () => {
    const mockNode = {
      id: 'node-1',
      name: 'CreateOrder',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        if (key === 'fieldsVisible') return 'true'
        if (key === 'customFields') return ''
        if (key === 'notes') return ''
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          id: 'node-1',
          fieldsVisible: true,
        }),
      })
    )
  })

  it('includes issueUrl in payload when slice element has issueUrl stored', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Slice',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'slice'
        if (key === 'issueUrl') return 'https://github.com/issues/789'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          id: 'node-1',
          type: 'slice',
          issueUrl: 'https://github.com/issues/789',
        }),
      })
    )
  })

  it('includes empty issueUrl when slice element has no issueUrl stored', () => {
    const mockNode = {
      id: 'node-1',
      name: 'My Slice',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'slice'
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          id: 'node-1',
          type: 'slice',
          issueUrl: '',
        }),
      })
    )
  })

  it('includes fieldsVisible=false when plugin data is unset (default)', () => {
    const mockNode = {
      id: 'node-1',
      name: 'CreateOrder',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        if (key === 'customFields') return ''
        if (key === 'notes') return ''
        return ''
      }),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          id: 'node-1',
          fieldsVisible: false,
        }),
      })
    )
  })

  it('includes pluginData with all plugin data keys and values for a command element', () => {
    const data: Record<string, string> = {
      type: 'command',
      customFields: 'field1: value1',
      notes: 'some notes',
    }
    const mockNode = {
      id: 'node-1',
      name: 'CreateOrder',
      getPluginData: vi.fn((key: string) => data[key] || ''),
      getPluginDataKeys: vi.fn(() => Object.keys(data)),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          pluginData: {
            type: 'command',
            customFields: 'field1: value1',
            notes: 'some notes',
          },
        }),
      })
    )
  })

  it('includes pluginData for a structural element (lane)', () => {
    const data: Record<string, string> = {
      type: 'lane',
    }
    const mockNode = {
      id: 'node-1',
      name: 'My Lane',
      getPluginData: vi.fn((key: string) => data[key] || ''),
      getPluginDataKeys: vi.fn(() => Object.keys(data)),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          pluginData: {
            type: 'lane',
          },
        }),
      })
    )
  })

  it('includes pluginData for a section element (slice) with issueUrl', () => {
    const data: Record<string, string> = {
      type: 'slice',
      issueUrl: 'https://github.com/issues/123',
    }
    const mockNode = {
      id: 'node-1',
      name: 'My Slice',
      getPluginData: vi.fn((key: string) => data[key] || ''),
      getPluginDataKeys: vi.fn(() => Object.keys(data)),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          pluginData: {
            type: 'slice',
            issueUrl: 'https://github.com/issues/123',
          },
        }),
      })
    )
  })

  it('includes pluginData with all keys including external and fieldsVisible', () => {
    const data: Record<string, string> = {
      type: 'event',
      external: 'true',
      fieldsVisible: 'true',
      customFields: 'amount: number',
      notes: 'domain event',
    }
    const mockNode = {
      id: 'node-1',
      name: 'OrderPlaced',
      getPluginData: vi.fn((key: string) => data[key] || ''),
      getPluginDataKeys: vi.fn(() => Object.keys(data)),
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'selection-changed',
        payload: expect.objectContaining({
          pluginData: {
            type: 'event',
            external: 'true',
            fieldsVisible: 'true',
            customFields: 'amount: number',
            notes: 'domain event',
          },
        }),
      })
    )
  })

  it('does not include pluginData when getPluginDataKeys is not available on the node', () => {
    const mockNode = {
      id: 'node-1',
      name: 'CreateOrder',
      getPluginData: vi.fn((key: string) => {
        if (key === 'type') return 'command'
        return ''
      }),
      // Note: no getPluginDataKeys method
    }
    figmaMock.currentPage.selection = [mockNode]

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    const call = (figmaMock.ui.postMessage as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.type).toBe('selection-changed')
    expect(call.payload.id).toBe('node-1')
    expect(call.payload.type).toBe('command')
    expect(call.payload).not.toHaveProperty('pluginData')
  })

  it('does not include pluginData when no element is selected', () => {
    figmaMock.currentPage.selection = []

    handleSelectionChange({ figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'selection-changed',
      payload: null,
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
