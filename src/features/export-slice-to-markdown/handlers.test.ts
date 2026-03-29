import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleExportSliceToMarkdown } from './handlers'
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

describe('handleExportSliceToMarkdown', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('uses payload id to look up the node when provided', async () => {
    const slice = createMockSlice('Payload Slice')
    figmaMock.getNodeByIdAsync.mockResolvedValue(slice)

    await handleExportSliceToMarkdown({ id: 'slice-42' }, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.getNodeByIdAsync).toHaveBeenCalledWith('slice-42')
    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          markdown: '# Payload Slice\n',
        }),
      })
    )
  })

  it('returns early without posting message when selection is empty', async () => {
    figmaMock.currentPage.selection = []

    await handleExportSliceToMarkdown({}, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).not.toHaveBeenCalled()
  })

  it('generates heading from slice name for empty slice', async () => {
    const slice = createMockSlice('My Slice')
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'export-slice-to-markdown-result',
        payload: expect.objectContaining({
          markdown: '# My Slice\n',
        }),
      })
    )
  })

  it('groups commands under ## Commands heading', async () => {
    const command = createMockNode({ type: 'command', label: 'PlaceOrder' })
    const slice = createMockSlice('OrderSlice', [command])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const md: string = call.payload.markdown
    expect(md).toContain('## Commands')
    expect(md).toContain('- PlaceOrder')
  })

  it('groups events under ## Events heading', async () => {
    const event = createMockNode({ type: 'event', label: 'OrderPlaced' })
    const slice = createMockSlice('OrderSlice', [event])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const md: string = call.payload.markdown
    expect(md).toContain('## Events')
    expect(md).toContain('- OrderPlaced')
  })

  it('groups queries under ## Queries heading', async () => {
    const query = createMockNode({ type: 'query', label: 'GetOrder' })
    const slice = createMockSlice('OrderSlice', [query])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const md: string = call.payload.markdown
    expect(md).toContain('## Queries')
    expect(md).toContain('- GetOrder')
  })

  it('includes custom fields for elements', async () => {
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

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const md: string = call.payload.markdown
    expect(md).toContain('- PlaceOrder')
    expect(md).toContain('  - orderId: string')
    expect(md).toContain('  - amount: number')
  })

  it('includes notes for elements', async () => {
    const command = createMockNode({
      type: 'command',
      label: 'PlaceOrder',
      notes: 'Must validate stock',
    })
    const slice = createMockSlice('OrderSlice', [command])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const md: string = call.payload.markdown
    expect(md).toContain('  - Notes: Must validate stock')
  })

  it('renders GWT sections with Given/When/Then sub-sections', async () => {
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

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const md: string = call.payload.markdown
    expect(md).toContain('## GWT: Payment Flow')
    expect(md).toContain('### Given')
    expect(md).toContain('- OrderPlaced')
    expect(md).toContain('### When')
    expect(md).toContain('- ProcessPayment')
    expect(md).toContain('### Then')
    expect(md).toContain('- PaymentProcessed')
  })

  it('includes notes from GWT section that are outside Given/When/Then', async () => {
    const givenChild = createMockNode({ type: 'event', label: 'RoadmapCreated' })
    const whenChild = createMockNode({ type: 'command', label: 'CreateRoadmap' })
    const thenChild = createMockNode({ type: 'event', label: 'Error Case' })

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
        children: [givenSection, whenSection, thenSection, stickyNote],
      }
    )
    const slice = createMockSlice('TestSlice', [gwt])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const md: string = call.payload.markdown
    expect(md).toContain('## GWT: Duplicate Title')
    expect(md).toContain('Roadmaps with exact same title are not allowed')
    expect(md).not.toContain('- Roadmaps with exact same title')
    // Notes should appear before Given/When/Then
    const noteIdx = md.indexOf('Roadmaps with exact same title')
    const givenIdx = md.indexOf('### Given')
    expect(noteIdx).toBeLessThan(givenIdx)
  })

  it('separates multiple GWT-level notes with ---', async () => {
    const givenSection = createMockNode(
      {},
      { type: 'SECTION', name: 'Given', children: [] }
    )
    const note1 = createMockNode(
      {},
      { type: 'STICKY', name: 'First note', text: { characters: 'First note' } }
    )
    const note2 = createMockNode(
      {},
      { type: 'STICKY', name: 'Second note', text: { characters: 'Second note' } }
    )

    const gwt = createMockNode(
      { type: 'gwt' },
      {
        type: 'SECTION',
        name: 'Multi Note GWT',
        children: [givenSection, note1, note2],
      }
    )
    const slice = createMockSlice('TestSlice', [gwt])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const md: string = call.payload.markdown
    expect(md).toContain('First note\n\n---\n\nSecond note')
  })

  it('does not include Given/When/Then children as GWT-level notes', async () => {
    const givenChild = createMockNode({ type: 'event', label: 'SomeEvent' })
    const givenSection = createMockNode(
      {},
      { type: 'SECTION', name: 'Given', children: [givenChild] }
    )

    const gwt = createMockNode(
      { type: 'gwt' },
      {
        type: 'SECTION',
        name: 'Test GWT',
        children: [givenSection],
      }
    )
    const slice = createMockSlice('TestSlice', [gwt])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const md: string = call.payload.markdown
    // Should not have "- Given" as a note
    expect(md).not.toMatch(/^- Given$/m)
  })

  it('ignores unknown elements (no Other section)', async () => {
    const unknownNode = createMockNode(
      {},
      { type: 'RECTANGLE', name: 'SomeRect' }
    )
    const slice = createMockSlice('MixedSlice', [unknownNode])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const md: string = call.payload.markdown
    expect(md).not.toContain('## Other')
  })

  it('orders sections: Commands, Events, Queries, then GWT', async () => {
    const query = createMockNode({ type: 'query', label: 'GetOrder' })
    const event = createMockNode({ type: 'event', label: 'OrderPlaced' })
    const command = createMockNode({ type: 'command', label: 'PlaceOrder' })
    const gwt = createMockNode(
      { type: 'gwt' },
      { type: 'SECTION', name: 'Flow', children: [] }
    )
    const slice = createMockSlice('OrderSlice', [
      query,
      event,
      command,
      gwt,
    ])
    figmaMock.currentPage.selection = [slice]

    await handleExportSliceToMarkdown(undefined as any, {
      figma: figmaMock as unknown as typeof figma,
    })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const md: string = call.payload.markdown
    const commandsIdx = md.indexOf('## Commands')
    const eventsIdx = md.indexOf('## Events')
    const queriesIdx = md.indexOf('## Queries')
    const gwtIdx = md.indexOf('## GWT: Flow')
    expect(commandsIdx).toBeLessThan(eventsIdx)
    expect(eventsIdx).toBeLessThan(queriesIdx)
    expect(queriesIdx).toBeLessThan(gwtIdx)
  })
})
