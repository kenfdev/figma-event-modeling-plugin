import { describe, it, expect, vi } from 'vitest'
import { formatSliceAsYaml, type SliceNode, type FormatYamlContext } from './format'
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

function createCtx(connectors: unknown[] = []): FormatYamlContext {
  return {
    currentPage: {
      findAll: vi.fn((predicate: (node: { type: string }) => boolean) =>
        connectors.filter((c) => predicate(c as { type: string }))
      ),
    },
  }
}

describe('formatSliceAsYaml', () => {
  it('emits a screen block with type:user for an empty slice', () => {
    const slice = createMockSlice('EmptySlice')
    const { yaml: yamlStr, orphanEvents } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      createCtx()
    )
    expect(yamlStr).toContain('slice: EmptySlice')
    expect(yamlStr).toContain('screen:')
    expect(yamlStr).toContain('type: user')
    expect(yamlStr).not.toContain('events:')
    expect(yamlStr).not.toContain('commands:')
    expect(orphanEvents).toEqual([])
  })

  it('does NOT emit a top-level events collection', () => {
    const event = createMockNode({ type: 'event', label: 'OrderPlaced' }, { id: 'e1' })
    const slice = createMockSlice('OrderSlice', [event])
    const { yaml: yamlStr } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      createCtx()
    )
    expect(yamlStr).not.toMatch(/^events:/m)
  })

  it('derives commands[].produces from command->event connectors', () => {
    const command = createMockNode(
      { type: 'command', label: 'PlaceOrder' },
      { id: 'cmd1' }
    )
    const event = createMockNode(
      { type: 'event', label: 'OrderPlaced' },
      { id: 'ev1' }
    )
    const slice = createMockSlice('OrderSlice', [command, event])
    const ctx = createCtx([createConnector('cmd1', 'ev1')])

    const { yaml: yamlStr, orphanEvents } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      ctx
    )
    expect(yamlStr).toContain('- name: PlaceOrder')
    expect(yamlStr).toContain('produces:')
    expect(yamlStr).toContain('- OrderPlaced')
    expect(orphanEvents).toEqual([])
  })

  it('derives queries[].from_events from event->query connectors', () => {
    const event = createMockNode(
      { type: 'event', label: 'OrderPlaced' },
      { id: 'ev1' }
    )
    const cmd = createMockNode(
      { type: 'command', label: 'PlaceOrder' },
      { id: 'cmd1' }
    )
    const query = createMockNode(
      { type: 'query', label: 'GetOrder' },
      { id: 'q1' }
    )
    const slice = createMockSlice('OrderSlice', [cmd, event, query])
    const ctx = createCtx([
      createConnector('cmd1', 'ev1'),
      createConnector('ev1', 'q1'),
    ])

    const { yaml: yamlStr } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      ctx
    )
    expect(yamlStr).toContain('- name: GetOrder')
    expect(yamlStr).toContain('from_events:')
    expect(yamlStr).toContain('- OrderPlaced')
  })

  it('emits screen block from screen shape with reads/executes from connectors', () => {
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
    const ctx = createCtx([
      createConnector('scr1', 'cmd1'),
      createConnector('q1', 'scr1'),
    ])

    const { yaml: yamlStr } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      ctx
    )
    expect(yamlStr).toContain('screen:')
    expect(yamlStr).toContain('type: user')
    expect(yamlStr).toContain('name: OrderScreen')
    expect(yamlStr).toContain('reads:')
    expect(yamlStr).toContain('- GetOrder')
    expect(yamlStr).toContain('executes:')
    expect(yamlStr).toContain('- PlaceOrder')
  })

  it('emits screen block with type:system for processor element', () => {
    const processor = createMockNode(
      { type: 'processor', label: 'BackgroundJob' },
      { id: 'p1' }
    )
    const slice = createMockSlice('JobSlice', [processor])
    const { yaml: yamlStr } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      createCtx()
    )
    expect(yamlStr).toContain('type: system')
    expect(yamlStr).toContain('name: BackgroundJob')
  })

  it('treats image marked as Screen identically to Screen shape', () => {
    const imageAsScreen = createMockNode(
      { type: 'screen', label: 'PhotoScreen' },
      { id: 'img1', type: 'RECTANGLE' }
    )
    const cmd = createMockNode(
      { type: 'command', label: 'TakePhoto' },
      { id: 'cmd1' }
    )
    const slice = createMockSlice('PhotoSlice', [imageAsScreen, cmd])
    const ctx = createCtx([createConnector('img1', 'cmd1')])

    const { yaml: yamlStr } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      ctx
    )
    expect(yamlStr).toContain('type: user')
    expect(yamlStr).toContain('name: PhotoScreen')
    expect(yamlStr).toContain('executes:')
    expect(yamlStr).toContain('- TakePhoto')
  })

  it('reports orphan events that have no producing command', () => {
    const event = createMockNode(
      { type: 'event', label: 'StrayEvent' },
      { id: 'ev1' }
    )
    const slice = createMockSlice('OrderSlice', [event])
    const { yaml: yamlStr, orphanEvents } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      createCtx()
    )
    expect(orphanEvents).toContain('StrayEvent')
    expect(yamlStr).not.toContain('StrayEvent')
  })

  it('reports an orphan event even when its label collides with a produced event', () => {
    const cmd = createMockNode(
      { type: 'command', label: 'PlaceOrder' },
      { id: 'cmd1' }
    )
    const producedEvent = createMockNode(
      { type: 'event', label: 'OrderPlaced' },
      { id: 'ev1' }
    )
    const orphanWithSameName = createMockNode(
      { type: 'event', label: 'OrderPlaced' },
      { id: 'ev2' }
    )
    const slice = createMockSlice('OrderSlice', [
      cmd,
      producedEvent,
      orphanWithSameName,
    ])
    const ctx = createCtx([createConnector('cmd1', 'ev1')])

    const { orphanEvents } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      ctx
    )
    expect(orphanEvents).toEqual(['OrderPlaced'])
  })

  it('reports no orphans when every event is produced by a command', () => {
    const cmd = createMockNode(
      { type: 'command', label: 'PlaceOrder' },
      { id: 'cmd1' }
    )
    const event = createMockNode(
      { type: 'event', label: 'OrderPlaced' },
      { id: 'ev1' }
    )
    const slice = createMockSlice('OrderSlice', [cmd, event])
    const ctx = createCtx([createConnector('cmd1', 'ev1')])

    const { orphanEvents } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      ctx
    )
    expect(orphanEvents).toEqual([])
  })

  it('strips the external marker from events (no top-level events, no external key)', () => {
    const cmd = createMockNode(
      { type: 'command', label: 'PlaceOrder' },
      { id: 'cmd1' }
    )
    const event = createMockNode(
      { type: 'event', label: 'OrderPlaced', external: 'true' },
      { id: 'ev1' }
    )
    const slice = createMockSlice('OrderSlice', [cmd, event])
    const ctx = createCtx([createConnector('cmd1', 'ev1')])

    const { yaml: yamlStr } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      ctx
    )
    expect(yamlStr).not.toContain('external:')
  })

  it('sorts produces, from_events, reads, executes alphabetically', () => {
    const screen = createMockNode(
      { type: 'screen', label: 'S' },
      { id: 'scr1' }
    )
    const cmdZ = createMockNode(
      { type: 'command', label: 'ZebraCmd' },
      { id: 'cmdZ' }
    )
    const cmdA = createMockNode(
      { type: 'command', label: 'AlphaCmd' },
      { id: 'cmdA' }
    )
    const eventZ = createMockNode(
      { type: 'event', label: 'ZebraEvent' },
      { id: 'evZ' }
    )
    const eventA = createMockNode(
      { type: 'event', label: 'AlphaEvent' },
      { id: 'evA' }
    )
    const queryZ = createMockNode(
      { type: 'query', label: 'ZebraQry' },
      { id: 'qZ' }
    )
    const queryA = createMockNode(
      { type: 'query', label: 'AlphaQry' },
      { id: 'qA' }
    )
    const slice = createMockSlice('S', [
      screen,
      cmdZ,
      cmdA,
      eventZ,
      eventA,
      queryZ,
      queryA,
    ])
    const ctx = createCtx([
      createConnector('cmdA', 'evZ'),
      createConnector('cmdA', 'evA'),
      createConnector('evZ', 'qA'),
      createConnector('evA', 'qA'),
      createConnector('scr1', 'cmdZ'),
      createConnector('scr1', 'cmdA'),
      createConnector('qZ', 'scr1'),
      createConnector('qA', 'scr1'),
    ])
    const { yaml: yamlStr } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      ctx
    )
    expect(yamlStr.indexOf('AlphaEvent')).toBeLessThan(yamlStr.indexOf('ZebraEvent'))
    expect(yamlStr.indexOf('AlphaCmd')).toBeLessThan(
      yamlStr.indexOf('ZebraCmd', yamlStr.indexOf('executes:'))
    )
    expect(yamlStr.indexOf('AlphaQry')).toBeLessThan(
      yamlStr.indexOf('ZebraQry', yamlStr.indexOf('reads:'))
    )
  })

  it('formats a slice with 1 command, 1 event linked by connector, and 1 GWT section', () => {
    const command = createMockNode(
      { type: 'command', label: 'PlaceOrder' },
      { id: 'cmd1' }
    )
    const event = createMockNode(
      { type: 'event', label: 'OrderPlaced' },
      { id: 'ev1' }
    )

    const givenChild = createMockNode({ type: 'event', label: 'OrderExists' })
    const whenChild = createMockNode({ type: 'command', label: 'PlaceOrderCmd' })
    const thenChild = createMockNode({ type: 'event', label: 'OrderConfirmed' })

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
      { type: 'SECTION', name: 'Order Flow', children: [givenSection, whenSection, thenSection] }
    )

    const slice = createMockSlice('OrderSlice', [command, event, gwt])
    const ctx = createCtx([createConnector('cmd1', 'ev1')])
    const { yaml: yamlStr } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      ctx
    )

    expect(yamlStr).toContain('slice: OrderSlice')
    expect(yamlStr).toContain('commands:')
    expect(yamlStr).toContain('- name: PlaceOrder')
    expect(yamlStr).toContain('produces:')
    expect(yamlStr).toContain('- OrderPlaced')
    expect(yamlStr).toContain('gwt:')
    expect(yamlStr).toContain('- name: Order Flow')
    expect(yamlStr).toContain('given:')
    expect(yamlStr).toContain('- name: OrderExists')
    expect(yamlStr).toContain('when:')
    expect(yamlStr).toContain('- name: PlaceOrderCmd')
    expect(yamlStr).toContain('then:')
    expect(yamlStr).toContain('- name: OrderConfirmed')
  })

  it('formats a slice with custom fields on elements', () => {
    const command = createMockNode({
      type: 'command',
      label: 'PlaceOrder',
      customFields: serializeFields([
        { name: 'orderId', type: 'string' },
        { name: 'amount', type: 'number' },
      ]),
    })
    const slice = createMockSlice('OrderSlice', [command])
    const { yaml: yamlStr } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      createCtx()
    )
    expect(yamlStr).toContain('fields: |')
    expect(yamlStr).toContain('orderId: string')
    expect(yamlStr).toContain('amount: number')
  })

  it('omits optional keys when empty', () => {
    const command = createMockNode({ type: 'command', label: 'SimpleCommand' })
    const slice = createMockSlice('OrderSlice', [command])
    const { yaml: yamlStr } = formatSliceAsYaml(
      slice as unknown as SliceNode,
      createCtx()
    )
    expect(yamlStr).not.toContain('notes:')
    expect(yamlStr).not.toContain('fields:')
    expect(yamlStr).not.toContain('produces:')
  })

  it('produces byte-identical YAML for the same model on repeated calls', () => {
    const buildSlice = () => {
      const cmd = createMockNode(
        { type: 'command', label: 'PlaceOrder' },
        { id: 'cmd1' }
      )
      const event = createMockNode(
        { type: 'event', label: 'OrderPlaced' },
        { id: 'ev1' }
      )
      return createMockSlice('OrderSlice', [cmd, event])
    }
    const ctx = createCtx([createConnector('cmd1', 'ev1')])
    const a = formatSliceAsYaml(buildSlice() as unknown as SliceNode, ctx).yaml
    const b = formatSliceAsYaml(buildSlice() as unknown as SliceNode, ctx).yaml
    expect(a).toBe(b)
  })
})
