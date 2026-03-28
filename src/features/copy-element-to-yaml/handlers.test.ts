import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleCopyElementToYaml } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'
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

describe('handleCopyElementToYaml', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('outputs name from label plugin data', async () => {
    const node = createMockNode({ type: 'command', label: 'PlaceOrder' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('name: PlaceOrder')
    expect(yamlStr).toContain('type: command')
  })

  it('outputs type from plugin data type', async () => {
    const node = createMockNode({ type: 'event', label: 'OrderPlaced' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('type: event')
  })

  it('serializes fields as list of name:type objects', async () => {
    const node = createMockNode({
      type: 'command',
      label: 'PlaceOrder',
      customFields: serializeFields([
        { name: 'userId', type: 'string' },
        { name: 'amount', type: 'number' },
      ]),
    })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('fields:')
    expect(yamlStr).toContain('- userId: string')
    expect(yamlStr).toContain('- amount: number')
  })

  it('includes notes when present', async () => {
    const node = createMockNode({
      type: 'command',
      label: 'PlaceOrder',
      notes: 'Must validate stock',
    })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('notes: Must validate stock')
  })

  it('includes external: true on external events', async () => {
    const node = createMockNode({
      type: 'event',
      label: 'OrderPlaced',
      external: 'true',
    })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('external: true')
  })

  it('omits fields key when customFields is empty', async () => {
    const node = createMockNode({ type: 'command', label: 'SimpleCommand' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).not.toContain('fields:')
  })

  it('omits notes key when notes is empty', async () => {
    const node = createMockNode({ type: 'command', label: 'SimpleCommand' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).not.toContain('notes:')
  })

  it('outputs GWT section with given/when/then arrays', async () => {
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
    figmaMock.getNodeByIdAsync.mockResolvedValue(gwt)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('name: Payment Flow')
    expect(yamlStr).toContain('given:')
    expect(yamlStr).toContain('- name: OrderPlaced')
    expect(yamlStr).toContain('type: event')
    expect(yamlStr).toContain('when:')
    expect(yamlStr).toContain('- name: ProcessPayment')
    expect(yamlStr).toContain('type: command')
    expect(yamlStr).toContain('then:')
    expect(yamlStr).toContain('- name: PaymentProcessed')
    expect(yamlStr).toContain('type: event')
  })

  it('GWT items include fields when present', async () => {
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
    figmaMock.getNodeByIdAsync.mockResolvedValue(gwt)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('when:')
    expect(yamlStr).toContain('- name: ProcessPayment')
    expect(yamlStr).toContain('type: command')
    expect(yamlStr).toContain('fields:')
    expect(yamlStr).toContain('- paymentId: string')
  })

  it('posts error when node not found', async () => {
    figmaMock.getNodeByIdAsync.mockResolvedValue(null)

    await handleCopyElementToYaml({ id: 'nonexistent' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'copy-element-to-yaml-error',
      payload: { message: 'Element not found' },
    })
  })

  it('posts error for unsupported element types', async () => {
    const node = createMockNode({ type: 'lane', label: 'MyLane' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'copy-element-to-yaml-error',
      payload: { message: 'Unsupported element type: lane' },
    })
  })

  it('handles query elements correctly', async () => {
    const node = createMockNode({ type: 'query', label: 'GetOrder' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('name: GetOrder')
    expect(yamlStr).toContain('type: query')
  })

  it('handles actor elements correctly', async () => {
    const node = createMockNode({ type: 'actor', label: 'User' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('name: User')
    expect(yamlStr).toContain('type: actor')
  })

  it('does not include external: false for non-external events', async () => {
    const node = createMockNode({ type: 'event', label: 'OrderPlaced' })
    figmaMock.getNodeByIdAsync.mockResolvedValue(node)

    await handleCopyElementToYaml({ id: 'node-1' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).not.toContain('external:')
  })
})