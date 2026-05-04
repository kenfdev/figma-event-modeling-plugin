import { describe, it, expect, vi } from 'vitest'
import { formatSliceAsYaml, type SliceNode } from './format'
import { serializeFields } from '../update-custom-fields/field-utils'

function createMockNode(
  pluginData: Record<string, string>,
  extra: Record<string, unknown> = {}
) {
  const data = { ...pluginData }
  return {
    id: `node-${Math.random().toString(36).slice(2)}`,
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

function createMockSlice(
  name: string,
  children: unknown[] = []
) {
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

describe('formatSliceAsYaml', () => {
  it('formats a slice with 1 command, 1 event, and 1 GWT section', () => {
    const command = createMockNode({ type: 'command', label: 'PlaceOrder' })
    const event = createMockNode({ type: 'event', label: 'OrderPlaced' })

    const givenChild = createMockNode({ type: 'event', label: 'OrderExists' })
    const whenChild = createMockNode({ type: 'command', label: 'PlaceOrderCmd' })
    const thenChild = createMockNode({ type: 'event', label: 'OrderConfirmed' })

    const givenSection = createMockNode({}, { type: 'SECTION', name: 'Given', children: [givenChild] })
    const whenSection = createMockNode({}, { type: 'SECTION', name: 'When', children: [whenChild] })
    const thenSection = createMockNode({}, { type: 'SECTION', name: 'Then', children: [thenChild] })

    const gwt = createMockNode(
      { type: 'gwt' },
      { type: 'SECTION', name: 'Order Flow', children: [givenSection, whenSection, thenSection] }
    )

    const slice = createMockSlice('OrderSlice', [command, event, gwt])

    const yamlStr = formatSliceAsYaml(slice as unknown as SliceNode)

    expect(yamlStr).toContain('slice: OrderSlice')
    expect(yamlStr).toContain('commands:')
    expect(yamlStr).toContain('- name: PlaceOrder')
    expect(yamlStr).toContain('events:')
    expect(yamlStr).toContain('- name: OrderPlaced')
    expect(yamlStr).toContain('gwt:')
    expect(yamlStr).toContain('- name: Order Flow')
    expect(yamlStr).toContain('given:')
    expect(yamlStr).toContain('- name: OrderExists')
    expect(yamlStr).toContain('when:')
    expect(yamlStr).toContain('- name: PlaceOrderCmd')
    expect(yamlStr).toContain('then:')
    expect(yamlStr).toContain('- name: OrderConfirmed')
  })

  it('formats an empty slice with only the slice name', () => {
    const slice = createMockSlice('EmptySlice')
    const yamlStr = formatSliceAsYaml(slice as unknown as SliceNode)
    expect(yamlStr).toContain('slice: EmptySlice')
    expect(yamlStr).not.toContain('commands:')
    expect(yamlStr).not.toContain('events:')
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
    const yamlStr = formatSliceAsYaml(slice as unknown as SliceNode)
    expect(yamlStr).toContain('fields: |')
    expect(yamlStr).toContain('orderId: string')
    expect(yamlStr).toContain('amount: number')
  })

  it('formats external flag for events', () => {
    const event = createMockNode({ type: 'event', label: 'OrderPlaced', external: 'true' })
    const slice = createMockSlice('OrderSlice', [event])
    const yamlStr = formatSliceAsYaml(slice as unknown as SliceNode)
    expect(yamlStr).toContain('external: true')
  })

  it('omits optional keys when empty', () => {
    const command = createMockNode({ type: 'command', label: 'SimpleCommand' })
    const slice = createMockSlice('OrderSlice', [command])
    const yamlStr = formatSliceAsYaml(slice as unknown as SliceNode)
    expect(yamlStr).not.toContain('notes:')
    expect(yamlStr).not.toContain('fields:')
  })
})