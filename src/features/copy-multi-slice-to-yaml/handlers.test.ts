import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleCopyMultiSliceToYaml } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'
import { formatSliceAsYaml, type SliceNode } from '../export-slice-to-yaml/format'

function createMockSlice(name: string, extra: Record<string, unknown> = {}) {
  const data: Record<string, string> = { type: 'slice', label: name }
  return {
    id: `slice-${Math.random().toString(36).slice(2)}`,
    type: 'SECTION',
    name,
    x: (extra.x as number) ?? 0,
    children: (extra.children as unknown[]) ?? [],
    setPluginData: vi.fn((key: string, value: string) => {
      data[key] = value
    }),
    getPluginData: vi.fn((key: string) => data[key] || ''),
  }
}

function createMockNode(pluginData: Record<string, string>, extra: Record<string, unknown> = {}) {
  const data = { ...pluginData }
  return {
    id: `node-${Math.random().toString(36).slice(2)}`,
    type: (extra.type as string) ?? 'SHAPE_WITH_TEXT',
    name: (extra.name as string) ?? '',
    x: (extra.x as number) ?? 0,
    text: extra.text ?? { characters: data.label ?? '' },
    children: (extra.children as unknown[]) ?? undefined,
    setPluginData: vi.fn((key: string, value: string) => {
      data[key] = value
    }),
    getPluginData: vi.fn((key: string) => data[key] || ''),
  }
}

describe('handleCopyMultiSliceToYaml', () => {
  let figmaMock: FigmaMock

  beforeEach(() => {
    figmaMock = createFigmaMock()
  })

  it('3 slices L-to-R produces YAML with --- separators in correct order', async () => {
    const slice1 = createMockSlice('Slice1', { x: 0 })
    const slice2 = createMockSlice('Slice2', { x: 200 })
    const slice3 = createMockSlice('Slice3', { x: 400 })

    const sectionNode = {
      id: 'section-1',
      type: 'SECTION',
      name: 'Wrapper',
      children: [slice1, slice2, slice3],
    }

    figmaMock.getNodeByIdAsync.mockResolvedValue(sectionNode)

    await handleCopyMultiSliceToYaml({ id: 'section-1' }, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'copy-multi-slice-to-yaml-result',
        payload: expect.objectContaining({
          yaml: expect.stringContaining('slice: Slice1'),
        }),
      })
    )

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    const parts = yamlStr.split('\n---\n')
    expect(parts[0]).toContain('slice: Slice1')
    expect(parts[1]).toContain('slice: Slice2')
    expect(parts[2]).toContain('slice: Slice3')
  })

  it('3 slices R-to-L are sorted to L-to-R in output', async () => {
    const slice1 = createMockSlice('Slice1', { x: 400 })
    const slice2 = createMockSlice('Slice2', { x: 200 })
    const slice3 = createMockSlice('Slice3', { x: 0 })

    const sectionNode = {
      id: 'section-1',
      type: 'SECTION',
      name: 'Wrapper',
      children: [slice1, slice2, slice3],
    }

    figmaMock.getNodeByIdAsync.mockResolvedValue(sectionNode)

    await handleCopyMultiSliceToYaml({ id: 'section-1' }, { figma: figmaMock as unknown as typeof figma })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    const parts = yamlStr.split('\n---\n')
    expect(parts[0]).toContain('slice: Slice3')
    expect(parts[1]).toContain('slice: Slice2')
    expect(parts[2]).toContain('slice: Slice1')
  })

  it('1 slice produces YAML without --- separator', async () => {
    const slice1 = createMockSlice('SingleSlice', { x: 0 })

    const sectionNode = {
      id: 'section-1',
      type: 'SECTION',
      name: 'Wrapper',
      children: [slice1],
    }

    figmaMock.getNodeByIdAsync.mockResolvedValue(sectionNode)

    await handleCopyMultiSliceToYaml({ id: 'section-1' }, { figma: figmaMock as unknown as typeof figma })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    expect(yamlStr).toContain('slice: SingleSlice')
    expect(yamlStr).not.toContain('\n---\n')
  })

  it('0 slices posts error', async () => {
    const sectionNode = {
      id: 'section-1',
      type: 'SECTION',
      name: 'Empty Wrapper',
      children: [],
    }

    figmaMock.getNodeByIdAsync.mockResolvedValue(sectionNode)

    await handleCopyMultiSliceToYaml({ id: 'section-1' }, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'copy-multi-slice-to-yaml-error',
      payload: { message: 'No slices found' },
    })
  })

  it('mixed children (2 slices + sticky + GWT + lane) only includes slices', async () => {
    const slice1 = createMockSlice('Slice1', { x: 0 })
    const slice2 = createMockSlice('Slice2', { x: 200 })
    const sticky = { id: 'sticky-1', type: 'STICKY', name: 'Note', x: 100, getPluginData: vi.fn(() => '') }
    const gwtChild = createMockNode({ type: 'gwt' }, { type: 'SECTION', name: 'GWT', x: 300 })
    const laneChild = createMockNode({ type: 'lane' }, { type: 'SHAPE_WITH_TEXT', name: 'Lane', x: 400 })

    const sectionNode = {
      id: 'section-1',
      type: 'SECTION',
      name: 'Wrapper',
      children: [sticky, slice1, laneChild, slice2, gwtChild],
    }

    figmaMock.getNodeByIdAsync.mockResolvedValue(sectionNode)

    await handleCopyMultiSliceToYaml({ id: 'section-1' }, { figma: figmaMock as unknown as typeof figma })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    const parts = yamlStr.split('\n---\n')
    expect(parts.length).toBe(2)
    expect(parts[0]).toContain('slice: Slice1')
    expect(parts[1]).toContain('slice: Slice2')
  })

  it('stale node id (null from getNodeByIdAsync) posts error', async () => {
    figmaMock.getNodeByIdAsync.mockResolvedValue(null)

    await handleCopyMultiSliceToYaml({ id: 'stale-id' }, { figma: figmaMock as unknown as typeof figma })

    expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
      type: 'copy-multi-slice-to-yaml-error',
      payload: { message: 'Node not found' },
    })
  })

  it('each slice YAML matches formatSliceAsYaml in isolation', async () => {
    const command1 = createMockNode({ type: 'command', label: 'Cmd1' })
    const slice1 = createMockSlice('Slice1', { x: 0, children: [command1] })

    const event2 = createMockNode({ type: 'event', label: 'Evt2' })
    const slice2 = createMockSlice('Slice2', { x: 200, children: [event2] })

    const sectionNode = {
      id: 'section-1',
      type: 'SECTION',
      name: 'Wrapper',
      children: [slice1, slice2],
    }

    figmaMock.getNodeByIdAsync.mockResolvedValue(sectionNode)

    await handleCopyMultiSliceToYaml({ id: 'section-1' }, { figma: figmaMock as unknown as typeof figma })

    const call = figmaMock.ui.postMessage.mock.calls[0][0]
    const yamlStr: string = call.payload.yaml
    const parts = yamlStr.split('\n---\n')

    const isolated1 = formatSliceAsYaml(slice1 as unknown as SliceNode).trim()
    const isolated2 = formatSliceAsYaml(slice2 as unknown as SliceNode).trim()

    expect(parts[0].trim()).toBe(isolated1)
    expect(parts[1].trim()).toBe(isolated2)
  })

  describe('ids[] payload variant', () => {
    it('3 slices left-to-right produces YAML with correct order', async () => {
      const slice1 = createMockSlice('Slice1', { x: 0 })
      const slice2 = createMockSlice('Slice2', { x: 200 })
      const slice3 = createMockSlice('Slice3', { x: 400 })

      figmaMock.getNodeByIdAsync
        .mockResolvedValueOnce(slice1)
        .mockResolvedValueOnce(slice2)
        .mockResolvedValueOnce(slice3)

      await handleCopyMultiSliceToYaml(
        { ids: ['slice-1', 'slice-2', 'slice-3'] },
        { figma: figmaMock as unknown as typeof figma }
      )

      const call = figmaMock.ui.postMessage.mock.calls[0][0]
      const yamlStr: string = call.payload.yaml
      const parts = yamlStr.split('\n---\n')
      expect(parts[0]).toContain('slice: Slice1')
      expect(parts[1]).toContain('slice: Slice2')
      expect(parts[2]).toContain('slice: Slice3')
    })

    it('3 slices in reverse id order are sorted by x position', async () => {
      const slice1 = createMockSlice('Slice1', { x: 400 })
      const slice2 = createMockSlice('Slice2', { x: 200 })
      const slice3 = createMockSlice('Slice3', { x: 0 })

      figmaMock.getNodeByIdAsync
        .mockResolvedValueOnce(slice1)
        .mockResolvedValueOnce(slice2)
        .mockResolvedValueOnce(slice3)

      await handleCopyMultiSliceToYaml(
        { ids: ['slice-1', 'slice-2', 'slice-3'] },
        { figma: figmaMock as unknown as typeof figma }
      )

      const call = figmaMock.ui.postMessage.mock.calls[0][0]
      const yamlStr: string = call.payload.yaml
      const parts = yamlStr.split('\n---\n')
      expect(parts[0]).toContain('slice: Slice3')
      expect(parts[1]).toContain('slice: Slice2')
      expect(parts[2]).toContain('slice: Slice1')
    })

    it('2 slices produces exactly one --- separator', async () => {
      const slice1 = createMockSlice('Slice1', { x: 0 })
      const slice2 = createMockSlice('Slice2', { x: 200 })

      figmaMock.getNodeByIdAsync
        .mockResolvedValueOnce(slice1)
        .mockResolvedValueOnce(slice2)

      await handleCopyMultiSliceToYaml(
        { ids: ['slice-1', 'slice-2'] },
        { figma: figmaMock as unknown as typeof figma }
      )

      const call = figmaMock.ui.postMessage.mock.calls[0][0]
      const yamlStr: string = call.payload.yaml
      expect(yamlStr.match(/\n---\n/g) || []).toHaveLength(1)
    })

    it('one id resolves to null posts Node not found error', async () => {
      figmaMock.getNodeByIdAsync
        .mockResolvedValueOnce(createMockSlice('Slice1', { x: 0 }))
        .mockResolvedValue(null)

      await handleCopyMultiSliceToYaml(
        { ids: ['slice-1', 'stale-id'] },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
        type: 'copy-multi-slice-to-yaml-error',
        payload: { message: 'Node not found' },
      })
    })

    it('one id resolves to non-SECTION node posts error', async () => {
      const nonSectionNode = {
        id: 'shape-1',
        type: 'SHAPE_WITH_TEXT',
        name: 'Shape',
        getPluginData: vi.fn(() => 'command'),
      }

      figmaMock.getNodeByIdAsync
        .mockResolvedValueOnce(createMockSlice('Slice1', { x: 0 }))
        .mockResolvedValueOnce(nonSectionNode)

      await handleCopyMultiSliceToYaml(
        { ids: ['slice-1', 'shape-1'] },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
        type: 'copy-multi-slice-to-yaml-error',
        payload: { message: 'Selection contains a non-slice node' },
      })
    })

    it('one id has getPluginData type=gwt posts error', async () => {
      const gwtNode = {
        id: 'gwt-1',
        type: 'SECTION',
        name: 'GWT',
        getPluginData: vi.fn((key: string) => {
          if (key === 'type') return 'gwt'
          return ''
        }),
        x: 0,
        children: [],
      }

      figmaMock.getNodeByIdAsync
        .mockResolvedValueOnce(createMockSlice('Slice1', { x: 0 }))
        .mockResolvedValueOnce(gwtNode)

      await handleCopyMultiSliceToYaml(
        { ids: ['slice-1', 'gwt-1'] },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
        type: 'copy-multi-slice-to-yaml-error',
        payload: { message: 'Selection contains a non-slice node' },
      })
    })
  })
})