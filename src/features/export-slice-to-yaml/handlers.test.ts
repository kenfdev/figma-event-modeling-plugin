import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleExportSliceToYaml, ORPHAN_EVENTS_NOTIFICATION } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'
import { serializeFields } from '../update-custom-fields/field-utils'

function createMockNode(
  pluginData: Record<string, string>,
  extra: Record<string, unknown> = {}
) {
  const data = { ...pluginData }
  return {
    id: (extra.id as string) ?? `node-${Math.random().toString(36).slice(2)}`,
    type: (extra.type as string) ?? 'SHAPE_WITH_TEXT',
    name: (extra.name as string) ?? '',
    text: extra.text ?? { characters: data.label ?? '' },
    children: (extra.children as unknown[]) ?? undefined,
    setPluginData: vi.fn((key: string, value: string) => {
      data[key] = value
    }),
    getPluginData: vi.fn((key: string) => data[key] || ''),
  }
}

function createMockSlice(name: string, children: unknown[] = []) {
  const data: Record<string, string> = { type: 'slice', label: name }
  return {
    id: 'slice-1',
    type: 'SECTION',
    name,
    children,
    setPluginData: vi.fn((key: string, value: string) => {
      data[key] = value
    }),
    getPluginData: vi.fn((key: string) => data[key] || ''),
  }
}

function createConnector(startId: string, endId: string) {
  return {
    type: 'CONNECTOR',
    connectorStart: { endpointNodeId: startId },
    connectorEnd: { endpointNodeId: endId },
  }
}

describe('handleExportSliceToYaml', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('uses payload id to look up the node when provided', async () => {
    const slice = createMockSlice('Payload Slice')
    figmaMock.getNodeByIdAsync.mockResolvedValue(slice)

    await handleExportSliceToYaml({ id: 'slice-42' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.getNodeByIdAsync).toHaveBeenCalledWith('slice-42')
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          yaml: expect.stringContaining('slice: Payload Slice'),
        }),
      })
    )
  })

  it('returns early without posting message when selection is empty', async () => {
    figmaMock.currentPage.selection = []

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled()
  })

  it('generates yaml with slice name and minimal screen block for empty slice', async () => {
    const slice = createMockSlice('My Slice')
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('slice: My Slice')
    expect(yamlStr).toContain('screen:')
    expect(yamlStr).toContain('type: user')
  })

  it('exports commands with name', async () => {
    const command = createMockNode({ type: 'command', label: 'PlaceOrder' })
    const slice = createMockSlice('OrderSlice', [command])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('commands:')
    expect(yamlStr).toContain('- name: PlaceOrder')
  })

  it('exports queries with name', async () => {
    const query = createMockNode({ type: 'query', label: 'GetOrder' })
    const slice = createMockSlice('OrderSlice', [query])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('queries:')
    expect(yamlStr).toContain('- name: GetOrder')
  })

  it('exports custom fields in block string format', async () => {
    const command = createMockNode({
      type: 'command',
      label: 'PlaceOrder',
      customFields: serializeFields([
        { name: 'orderId', type: 'string' },
        { name: 'amount', type: 'number' },
      ]),
    })
    const slice = createMockSlice('OrderSlice', [command])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('fields: |')
    expect(yamlStr).toContain('orderId: string')
    expect(yamlStr).toContain('amount: number')
  })

  it('exports notes for elements', async () => {
    const command = createMockNode({
      type: 'command',
      label: 'PlaceOrder',
      notes: 'Must validate stock',
    })
    const slice = createMockSlice('OrderSlice', [command])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('notes: Must validate stock')
  })

  it('exports GWT sections with given/when/then', async () => {
    const givenChild = createMockNode({ type: 'event', label: 'OrderPlaced' })
    const whenChild = createMockNode({ type: 'command', label: 'ProcessPayment' })
    const thenChild = createMockNode({ type: 'event', label: 'PaymentProcessed' })

    const givenSection = createMockNode(
      {},
      { type: 'SECTION', name: 'Given', children: [givenChild] }
    )
    const whenSection = createMockNode(
      {},
      { type: 'SECTION', name: 'When', children: [whenChild] }
    )
    const thenSection = createMockNode(
      {},
      { type: 'SECTION', name: 'Then', children: [thenChild] }
    )

    const gwt = createMockNode(
      { type: 'gwt' },
      {
        type: 'SECTION',
        name: 'Payment Flow',
        children: [givenSection, whenSection, thenSection],
      }
    )
    const slice = createMockSlice('OrderSlice', [gwt])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('gwt:')
    expect(yamlStr).toContain('- name: Payment Flow')
    expect(yamlStr).toContain('given:')
    expect(yamlStr).toContain('- name: OrderPlaced')
    expect(yamlStr).toContain('type: event')
    expect(yamlStr).toContain('when:')
    expect(yamlStr).toContain('- name: ProcessPayment')
    expect(yamlStr).toContain('type: command')
    expect(yamlStr).toContain('then:')
    expect(yamlStr).toContain('- name: PaymentProcessed')
  })

  it('exports GWT items with custom fields', async () => {
    const whenChild = createMockNode({
      type: 'command',
      label: 'ProcessPayment',
      customFields: serializeFields([
        { name: 'paymentId', type: 'string' },
      ]),
    })

    const whenSection = createMockNode(
      {},
      { type: 'SECTION', name: 'When', children: [whenChild] }
    )

    const gwt = createMockNode(
      { type: 'gwt' },
      {
        type: 'SECTION',
        name: 'Payment Flow',
        children: [whenSection],
      }
    )
    const slice = createMockSlice('OrderSlice', [gwt])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('when:')
    expect(yamlStr).toContain('- name: ProcessPayment')
    expect(yamlStr).toContain('type: command')
    expect(yamlStr).toContain('fields: |')
    expect(yamlStr).toContain('paymentId: string')
  })

  it('exports GWT description from sticky note', async () => {
    const givenSection = createMockNode(
      {},
      { type: 'SECTION', name: 'Given', children: [] }
    )
    const stickyNote = createMockNode(
      {},
      {
        type: 'STICKY',
        name: 'Roadmaps with exact same title are not allowed',
        text: { characters: 'Roadmaps with exact same title are not allowed' },
      }
    )

    const gwt = createMockNode(
      { type: 'gwt' },
      {
        type: 'SECTION',
        name: 'Duplicate Title',
        children: [givenSection, stickyNote],
      }
    )
    const slice = createMockSlice('TestSlice', [gwt])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('description: Roadmaps with exact same title are not allowed')
  })

  it('exports empty slice with screen block and no element collections', async () => {
    const slice = createMockSlice('EmptySlice')
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('slice: EmptySlice')
    expect(yamlStr).toContain('screen:')
    expect(yamlStr).toContain('type: user')
    expect(yamlStr).not.toContain('commands:')
    expect(yamlStr).not.toContain('queries:')
  })

  it('omits optional keys when empty', async () => {
    const command = createMockNode({ type: 'command', label: 'SimpleCommand' })
    const slice = createMockSlice('OrderSlice', [command])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).not.toContain('notes:')
    expect(yamlStr).not.toContain('fields:')
    expect(yamlStr).not.toContain('produces:')
  })

  it('does not emit top-level events; events with no producing command are dropped and reported', async () => {
    const event = createMockNode(
      { type: 'event', label: 'OrphanEvent' },
      { id: 'ev1' }
    )
    const slice = createMockSlice('TestSlice', [event])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).not.toMatch(/^events:/m)
    expect(yamlStr).not.toContain('OrphanEvent')
    expect(figmaMock.notify).toHaveBeenCalledWith(ORPHAN_EVENTS_NOTIFICATION)
  })

  it('does not notify when every event is produced by a command', async () => {
    const cmd = createMockNode(
      { type: 'command', label: 'PlaceOrder' },
      { id: 'cmd1' }
    )
    const event = createMockNode(
      { type: 'event', label: 'OrderPlaced' },
      { id: 'ev1' }
    )
    const slice = createMockSlice('TestSlice', [cmd, event])
    figmaMock.currentPage.selection = [slice]
    figmaMock.currentPage.findAll.mockImplementation(
      (predicate: (n: { type: string }) => boolean) =>
        [createConnector('cmd1', 'ev1')].filter((c) => predicate(c))
    )

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.notify).not.toHaveBeenCalled()
  })

  it('strips the external marker from events on export', async () => {
    const cmd = createMockNode(
      { type: 'command', label: 'PlaceOrder' },
      { id: 'cmd1' }
    )
    const event = createMockNode(
      { type: 'event', label: 'OrderPlaced', external: 'true' },
      { id: 'ev1' }
    )
    const slice = createMockSlice('TestSlice', [cmd, event])
    figmaMock.currentPage.selection = [slice]
    figmaMock.currentPage.findAll.mockImplementation(
      (predicate: (n: { type: string }) => boolean) =>
        [createConnector('cmd1', 'ev1')].filter((c) => predicate(c))
    )

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).not.toContain('external:')
    expect(yamlStr).toContain('produces:')
    expect(yamlStr).toContain('- OrderPlaced')
  })

  it('emits screen block with reads/executes from connectors', async () => {
    const screen = createMockNode(
      { type: 'screen', label: 'OrderScreen' },
      { id: 'scr1' }
    )
    const cmd = createMockNode(
      { type: 'command', label: 'PlaceOrder' },
      { id: 'cmd1' }
    )
    const query = createMockNode(
      { type: 'query', label: 'GetOrder' },
      { id: 'q1' }
    )
    const slice = createMockSlice('OrderSlice', [screen, cmd, query])
    figmaMock.currentPage.selection = [slice]
    figmaMock.currentPage.findAll.mockImplementation(
      (predicate: (n: { type: string }) => boolean) =>
        [
          createConnector('scr1', 'cmd1'),
          createConnector('q1', 'scr1'),
        ].filter((c) => predicate(c))
    )

    await handleExportSliceToYaml({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('screen:')
    expect(yamlStr).toContain('type: user')
    expect(yamlStr).toContain('name: OrderScreen')
    expect(yamlStr).toContain('reads:')
    expect(yamlStr).toContain('- GetOrder')
    expect(yamlStr).toContain('executes:')
    expect(yamlStr).toContain('- PlaceOrder')
  })
})
