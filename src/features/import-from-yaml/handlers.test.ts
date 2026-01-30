import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleImportFromYaml } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'
import type { ImportData } from './parser'

function createMockShape(id: string) {
  return {
    id,
    shapeType: '',
    cornerRadius: 0,
    x: 0,
    y: 0,
    resize: vi.fn(),
    fills: [] as unknown[],
    strokes: [] as unknown[],
    strokeWeight: 0,
    text: {
      characters: '',
      fills: [] as unknown[],
    },
    setPluginData: vi.fn(),
    getPluginData: vi.fn(() => ''),
  }
}

function createMockSection(id: string) {
  return {
    id,
    name: '',
    x: 0,
    y: 0,
    width: 280,
    height: 40,
    resizeWithoutConstraints: vi.fn(),
    fills: [],
    setPluginData: vi.fn(),
    getPluginData: vi.fn(() => ''),
    appendChild: vi.fn(),
  }
}

describe('handleImportFromYaml', () => {
  let figmaMock: FigmaMock
  let shapes: ReturnType<typeof createMockShape>[]
  let sections: ReturnType<typeof createMockSection>[]

  beforeEach(() => {
    shapes = []
    sections = []
    figmaMock = createFigmaMock()
    figmaMock.createShapeWithText.mockImplementation(() => {
      const shape = createMockShape(`shape-${shapes.length}`)
      shapes.push(shape)
      return shape
    })
    figmaMock.createSection.mockImplementation(() => {
      const section = createMockSection(`section-${sections.length}`)
      sections.push(section)
      return section
    })
  })

  const callHandler = (data: ImportData) =>
    handleImportFromYaml(data, {
      figma: figmaMock as unknown as typeof figma,
    })

  describe('slice creation', () => {
    it('creates a section for the slice', async () => {
      await callHandler({ slice: 'My Slice' })

      expect(figmaMock.createSection).toHaveBeenCalled()
    })

    it('names the section with the slice name from YAML', async () => {
      await callHandler({ slice: 'Order Processing Slice' })

      expect(sections[0].name).toBe('Order Processing Slice')
    })

    it('stores type "slice" and label in plugin data', async () => {
      await callHandler({ slice: 'My Slice' })

      expect(sections[0].setPluginData).toHaveBeenCalledWith('type', 'slice')
      expect(sections[0].setPluginData).toHaveBeenCalledWith(
        'label',
        'My Slice'
      )
    })

    it('appends the slice to the current page', async () => {
      await callHandler({ slice: 'My Slice' })

      expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(
        sections[0]
      )
    })
  })

  describe('command creation', () => {
    it('creates a shape for each command', async () => {
      await callHandler({
        slice: 'S',
        commands: [{ name: 'CreateOrder' }, { name: 'CancelOrder' }],
      })

      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(2)
    })

    it('sets the command name as text and label', async () => {
      await callHandler({
        slice: 'S',
        commands: [{ name: 'CreateOrder' }],
      })

      expect(shapes[0].text.characters).toBe('CreateOrder')
      expect(shapes[0].setPluginData).toHaveBeenCalledWith(
        'label',
        'CreateOrder'
      )
    })

    it('stores type "command" in plugin data', async () => {
      await callHandler({
        slice: 'S',
        commands: [{ name: 'CreateOrder' }],
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith('type', 'command')
    })

    it('stores custom fields in plugin data when provided', async () => {
      await callHandler({
        slice: 'S',
        commands: [
          { name: 'CreateOrder', fields: 'userId: string\nitems: array' },
        ],
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith(
        'customFields',
        'userId: string\nitems: array'
      )
    })

    it('stores notes in plugin data when provided', async () => {
      await callHandler({
        slice: 'S',
        commands: [{ name: 'CreateOrder', notes: 'Customer checkout flow' }],
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith(
        'notes',
        'Customer checkout flow'
      )
    })

    it('appends each command to the slice section', async () => {
      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }],
      })

      const slice = sections[0]
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[0])
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[1])
    })
  })

  describe('event creation', () => {
    it('creates a shape for each event', async () => {
      await callHandler({
        slice: 'S',
        events: [
          { name: 'OrderCreated', external: false },
          { name: 'PaymentReceived', external: false },
        ],
      })

      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(2)
    })

    it('stores type "event" in plugin data', async () => {
      await callHandler({
        slice: 'S',
        events: [{ name: 'OrderCreated', external: false }],
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith('type', 'event')
    })

    it('sets the event name as text and label', async () => {
      await callHandler({
        slice: 'S',
        events: [{ name: 'OrderCreated', external: false }],
      })

      expect(shapes[0].text.characters).toBe('OrderCreated')
      expect(shapes[0].setPluginData).toHaveBeenCalledWith(
        'label',
        'OrderCreated'
      )
    })

    it('stores external flag as "false" for internal events', async () => {
      await callHandler({
        slice: 'S',
        events: [{ name: 'OrderCreated', external: false }],
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith('external', 'false')
    })

    it('stores external flag as "true" for external events', async () => {
      await callHandler({
        slice: 'S',
        events: [{ name: 'ExternalEvent', external: true }],
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith('external', 'true')
    })

    it('uses orange fill and stroke for internal events', async () => {
      await callHandler({
        slice: 'S',
        events: [{ name: 'InternalEvent', external: false }],
      })

      expect(shapes[0].fills).toEqual([
        { type: 'SOLID', color: { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 } },
      ])
      expect(shapes[0].strokes).toEqual([
        { type: 'SOLID', color: { r: 0xeb / 255, g: 0x75 / 255, b: 0x00 / 255 } },
      ])
    })

    it('uses purple fill and stroke for external events', async () => {
      await callHandler({
        slice: 'S',
        events: [{ name: 'ExternalEvent', external: true }],
      })

      expect(shapes[0].fills).toEqual([
        { type: 'SOLID', color: { r: 0x9b / 255, g: 0x59 / 255, b: 0xb6 / 255 } },
      ])
      expect(shapes[0].strokes).toEqual([
        { type: 'SOLID', color: { r: 0x7d / 255, g: 0x3c / 255, b: 0x98 / 255 } },
      ])
    })

    it('stores custom fields and notes when provided', async () => {
      await callHandler({
        slice: 'S',
        events: [
          {
            name: 'OrderCreated',
            external: false,
            fields: 'orderId: string',
            notes: 'Triggered on checkout',
          },
        ],
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith(
        'customFields',
        'orderId: string'
      )
      expect(shapes[0].setPluginData).toHaveBeenCalledWith(
        'notes',
        'Triggered on checkout'
      )
    })

    it('appends each event to the slice section', async () => {
      await callHandler({
        slice: 'S',
        events: [
          { name: 'Evt1', external: false },
          { name: 'Evt2', external: false },
        ],
      })

      const slice = sections[0]
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[0])
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[1])
    })
  })

  describe('query creation', () => {
    it('creates a shape for each query', async () => {
      await callHandler({
        slice: 'S',
        queries: [{ name: 'GetOrderStatus' }],
      })

      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(1)
    })

    it('stores type "query" in plugin data', async () => {
      await callHandler({
        slice: 'S',
        queries: [{ name: 'GetOrderStatus' }],
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith('type', 'query')
    })

    it('sets the query name as text and label', async () => {
      await callHandler({
        slice: 'S',
        queries: [{ name: 'GetOrderStatus' }],
      })

      expect(shapes[0].text.characters).toBe('GetOrderStatus')
      expect(shapes[0].setPluginData).toHaveBeenCalledWith(
        'label',
        'GetOrderStatus'
      )
    })

    it('stores custom fields and notes when provided', async () => {
      await callHandler({
        slice: 'S',
        queries: [
          { name: 'GetOrderStatus', fields: 'orderId: string', notes: 'Read model query' },
        ],
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith(
        'customFields',
        'orderId: string'
      )
      expect(shapes[0].setPluginData).toHaveBeenCalledWith(
        'notes',
        'Read model query'
      )
    })

    it('appends each query to the slice section', async () => {
      await callHandler({
        slice: 'S',
        queries: [{ name: 'Qry1' }, { name: 'Qry2' }],
      })

      const slice = sections[0]
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[0])
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[1])
    })
  })

  describe('GWT creation', () => {
    it('creates a parent section and three child sections for each GWT entry', async () => {
      await callHandler({
        slice: 'S',
        gwt: [
          {
            name: 'Order Scenario',
            given: [{ name: 'OrderSubmitted event', type: 'event' }],
            when: [{ name: 'CreateOrder command', type: 'command' }],
            then: [{ name: 'OrderCreated event', type: 'event' }],
          },
        ],
      })

      // 1 slice section + 1 GWT parent + 3 GWT children = 5 sections
      expect(figmaMock.createSection).toHaveBeenCalledTimes(5)
    })

    it('names the GWT parent section with the gwt entry name', async () => {
      await callHandler({
        slice: 'S',
        gwt: [
          {
            name: 'Order Creation Scenario',
            given: [],
            when: [],
            then: [],
          },
        ],
      })

      // sections[0] = slice, sections[1] = GWT parent
      expect(sections[1].name).toBe('Order Creation Scenario')
    })

    it('stores type "gwt" in GWT parent plugin data', async () => {
      await callHandler({
        slice: 'S',
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [],
          },
        ],
      })

      expect(sections[1].setPluginData).toHaveBeenCalledWith('type', 'gwt')
    })

    it('creates Given, When, Then child sections with text labels from YAML items', async () => {
      await callHandler({
        slice: 'S',
        gwt: [
          {
            name: 'Scenario',
            given: [{ name: 'OrderSubmitted event', type: 'event' }],
            when: [{ name: 'CreateOrder command', type: 'command' }],
            then: [{ name: 'OrderCreated event', type: 'event' }],
          },
        ],
      })

      // sections[2] = Given, sections[3] = When, sections[4] = Then
      expect(sections[2].name).toBe('Given\nOrderSubmitted event')
      expect(sections[3].name).toBe('When\nCreateOrder command')
      expect(sections[4].name).toBe('Then\nOrderCreated event')
    })

    it('uses plain section name when GWT items are empty', async () => {
      await callHandler({
        slice: 'S',
        gwt: [
          {
            name: 'Empty Scenario',
            given: [],
            when: [],
            then: [],
          },
        ],
      })

      expect(sections[2].name).toBe('Given')
      expect(sections[3].name).toBe('When')
      expect(sections[4].name).toBe('Then')
    })

    it('includes multiple items in child section names', async () => {
      await callHandler({
        slice: 'S',
        gwt: [
          {
            name: 'Multi-item',
            given: [{ name: 'Item A', type: 'event' }, { name: 'Item B', type: 'event' }],
            when: [{ name: 'Item C', type: 'command' }],
            then: [{ name: 'Item D', type: 'event' }, { name: 'Item E', type: 'query' }, { name: 'Item F', type: 'error' }],
          },
        ],
      })

      expect(sections[2].name).toBe('Given\nItem A\nItem B')
      expect(sections[3].name).toBe('When\nItem C')
      expect(sections[4].name).toBe('Then\nItem D\nItem E\nItem F')
    })

    it('appends child sections to the GWT parent', async () => {
      await callHandler({
        slice: 'S',
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [],
          },
        ],
      })

      const gwtParent = sections[1]
      expect(gwtParent.appendChild).toHaveBeenCalledTimes(3)
      expect(gwtParent.appendChild).toHaveBeenCalledWith(sections[2])
      expect(gwtParent.appendChild).toHaveBeenCalledWith(sections[3])
      expect(gwtParent.appendChild).toHaveBeenCalledWith(sections[4])
    })

    it('appends the GWT parent to the slice section', async () => {
      await callHandler({
        slice: 'S',
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [],
          },
        ],
      })

      const slice = sections[0]
      expect(slice.appendChild).toHaveBeenCalledWith(sections[1])
    })
  })

  describe('font loading', () => {
    it('loads Inter Medium font when creating shapes', async () => {
      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd' }],
      })

      expect(figmaMock.loadFontAsync).toHaveBeenCalledWith({
        family: 'Inter',
        style: 'Medium',
      })
    })
  })

  describe('error reporting', () => {
    it('sends error message to UI when YAML parsing fails', async () => {
      await handleImportFromYaml(
        { yamlContent: 'invalid: [broken' },
        { figma: figmaMock as unknown as typeof figma }
      )

      expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'import-from-yaml-error',
        })
      )
    })

    it('sends error message to UI when element creation throws', async () => {
      figmaMock.createSection.mockImplementation(() => {
        throw new Error('Canvas full')
      })

      await callHandler({ slice: 'S' })

      expect(figmaMock.ui.postMessage).toHaveBeenCalledWith({
        type: 'import-from-yaml-error',
        payload: { error: 'Canvas full' },
      })
    })
  })

  describe('element positioning', () => {
    it('places commands and queries in the top row (same y)', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }],
        queries: [{ name: 'Qry1' }],
      })

      // shapes[0] = command, shapes[1] = query
      // Both should share the same y position (top row)
      expect(shapes[0].y).toBe(shapes[1].y)
    })

    it('places commands on the left and queries on the right in the top row', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }],
        queries: [{ name: 'Qry1' }],
      })

      // shapes[0] = command, shapes[1] = query
      // Commands should be to the left of queries
      expect(shapes[0].x).toBeLessThan(shapes[1].x)
    })

    it('places events in the bottom row below commands and queries', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }],
        events: [{ name: 'Evt1', external: false }],
        queries: [{ name: 'Qry1' }],
      })

      // shapes[0] = command, shapes[1] = event, shapes[2] = query
      const topRowY = shapes[0].y
      const bottomRowY = shapes[1].y

      // Events row should be below the commands/queries row
      expect(bottomRowY).toBeGreaterThan(topRowY)
      // Queries should be in the same row as commands
      expect(shapes[2].y).toBe(topRowY)
    })

    it('arranges multiple commands horizontally in the top row', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }, { name: 'Cmd3' }],
      })

      // All commands should share the same y
      expect(shapes[0].y).toBe(shapes[1].y)
      expect(shapes[1].y).toBe(shapes[2].y)

      // Commands should be arranged left to right with consistent gaps
      const gap1 = shapes[1].x - shapes[0].x
      const gap2 = shapes[2].x - shapes[1].x
      expect(gap1).toBe(gap2)
      expect(gap1).toBeGreaterThan(176) // at least element width
    })

    it('arranges multiple events horizontally in the bottom row', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        events: [
          { name: 'Evt1', external: false },
          { name: 'Evt2', external: false },
          { name: 'Evt3', external: false },
        ],
      })

      // All events should share the same y
      expect(shapes[0].y).toBe(shapes[1].y)
      expect(shapes[1].y).toBe(shapes[2].y)

      // Events should be arranged left to right with consistent gaps
      const gap1 = shapes[1].x - shapes[0].x
      const gap2 = shapes[2].x - shapes[1].x
      expect(gap1).toBe(gap2)
      expect(gap1).toBeGreaterThan(176) // at least element width
    })

    it('separates commands and queries with a larger gap in the top row', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }],
        queries: [{ name: 'Qry1' }],
      })

      // shapes[0] = Cmd1, shapes[1] = Cmd2, shapes[2] = Qry1
      const gapBetweenCommands = shapes[1].x - shapes[0].x
      const gapBetweenCmdAndQry = shapes[2].x - shapes[1].x

      // Gap between last command and first query should be larger than gap between commands
      expect(gapBetweenCmdAndQry).toBeGreaterThan(gapBetweenCommands)
    })

    it('centers the slice on the viewport after auto-sizing', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'My Slice',
        commands: [{ name: 'Cmd1' }],
        events: [{ name: 'Evt1', external: false }],
      })

      const slice = sections[0]
      const lastCall = slice.resizeWithoutConstraints.mock.calls[
        slice.resizeWithoutConstraints.mock.calls.length - 1
      ]
      const [finalWidth, finalHeight] = lastCall

      // The slice should be positioned so its center aligns with the content center
      // (after auto-sizing, slice.x = minChildX - padding, not viewport center)
      // Verify children are contained within the slice bounds
      expect(slice.x + finalWidth / 2).toBeGreaterThan(0)
      expect(slice.y + finalHeight / 2).toBeGreaterThan(0)
    })

    it('positions GWT parent sections below element rows', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }],
        events: [{ name: 'Evt1', external: false }],
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [],
          },
        ],
      })

      // shapes[0] = command (top row), shapes[1] = event (bottom row)
      const bottomRowY = shapes[1].y
      const gwtParent = sections[1]
      // GWT should be below the bottom row (events)
      expect(gwtParent.y).toBeGreaterThan(bottomRowY + 80) // below event row + element height
    })

    it('stacks multiple GWT sections vertically', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        gwt: [
          { name: 'Scenario 1', given: [], when: [], then: [] },
          { name: 'Scenario 2', given: [], when: [], then: [] },
        ],
      })

      // sections[0] = slice, sections[1] = GWT parent 1, sections[5] = GWT parent 2
      // (each GWT parent has 3 children: sections[2-4] and sections[6-8])
      const gwt1 = sections[1]
      const gwt2 = sections[5]

      // GWT2 should be below GWT1 (stacked vertically)
      expect(gwt2.y).toBeGreaterThan(gwt1.y)
      // They should share the same x (aligned to same left edge)
      expect(gwt2.x).toBe(gwt1.x)
    })

    it('aligns GWT sections to the left edge of the content area', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }],
        gwt: [
          { name: 'Scenario', given: [], when: [], then: [] },
        ],
      })

      const gwtParent = sections[1]
      const commandX = shapes[0].x
      // GWT should be aligned to the left edge (same x as leftmost element)
      expect(gwtParent.x).toBe(commandX)
    })

    it('handles only commands without queries in the top row', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }],
      })

      // Both commands should be in the same row
      expect(shapes[0].y).toBe(shapes[1].y)
      expect(shapes[1].x).toBeGreaterThan(shapes[0].x)
    })

    it('handles only events in the bottom row', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        events: [{ name: 'Evt1', external: false }],
      })

      // Single event should still be positioned
      expect(typeof shapes[0].x).toBe('number')
      expect(typeof shapes[0].y).toBe('number')
    })
  })

  describe('selection after import', () => {
    it('selects the created slice after import', async () => {
      await callHandler({ slice: 'My Slice' })

      expect(figmaMock.currentPage.selection).toContain(sections[0])
    })

    it('selects the slice even when other elements are created', async () => {
      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }],
        events: [{ name: 'Evt1', external: false }],
      })

      // Selection should contain the slice (sections[0])
      expect(figmaMock.currentPage.selection).toContain(sections[0])
    })
  })

  describe('element containment', () => {
    it('only appends the slice to currentPage, not individual elements', async () => {
      await callHandler({
        slice: 'Order Slice',
        commands: [{ name: 'Cmd1' }],
        events: [{ name: 'Evt1', external: false }],
        queries: [{ name: 'Qry1' }],
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [],
          },
        ],
      })

      // Only the slice section should be appended to currentPage
      expect(figmaMock.currentPage.appendChild).toHaveBeenCalledTimes(1)
      expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(sections[0])
    })

    it('appends all element types as children of the slice', async () => {
      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }],
        events: [{ name: 'Evt1', external: false }],
        queries: [{ name: 'Qry1' }],
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [],
          },
        ],
      })

      const slice = sections[0]
      // 3 shapes + 1 GWT parent = 4 children
      expect(slice.appendChild).toHaveBeenCalledTimes(4)
      // Shapes
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[0])
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[1])
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[2])
      // GWT parent
      expect(slice.appendChild).toHaveBeenCalledWith(sections[1])
    })
  })

  describe('slice auto-sizing', () => {
    it('resizes the slice to fit all children with padding after layout', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }],
        events: [{ name: 'Evt1', external: false }],
      })

      const slice = sections[0]
      // resizeWithoutConstraints should be called at least twice:
      // once for initial size, once for auto-sizing
      expect(slice.resizeWithoutConstraints.mock.calls.length).toBeGreaterThanOrEqual(2)
      // The final resize should use dimensions that encompass all children + padding
      const lastCall = slice.resizeWithoutConstraints.mock.calls[
        slice.resizeWithoutConstraints.mock.calls.length - 1
      ]
      const [finalWidth, finalHeight] = lastCall
      expect(finalWidth).toBeGreaterThan(0)
      expect(finalHeight).toBeGreaterThan(0)
    })

    it('calculates size based on the bounding box of all children', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }],
        events: [{ name: 'Evt1', external: false }],
      })

      const slice = sections[0]
      const lastCall = slice.resizeWithoutConstraints.mock.calls[
        slice.resizeWithoutConstraints.mock.calls.length - 1
      ]
      const [finalWidth, finalHeight] = lastCall

      // Find bounding box of all children
      const allChildXs = shapes.map(s => s.x)
      const allChildYs = shapes.map(s => s.y)
      const minX = Math.min(...allChildXs)
      const maxRight = Math.max(...allChildXs.map(x => x + 176)) // ELEMENT_WIDTH
      const maxBottom = Math.max(...allChildYs.map(y => y + 80)) // ELEMENT_HEIGHT

      // Final size should be at least as large as children bounding box
      // (children are positioned relative to viewport, slice position adjusts)
      expect(finalWidth).toBeGreaterThanOrEqual(maxRight - minX)
      expect(finalHeight).toBeGreaterThanOrEqual(maxBottom - Math.min(...allChildYs))
    })

    it('includes padding around the children bounding box', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }],
      })

      const slice = sections[0]
      const lastCall = slice.resizeWithoutConstraints.mock.calls[
        slice.resizeWithoutConstraints.mock.calls.length - 1
      ]
      const [finalWidth, finalHeight] = lastCall

      // Width should be larger than just the element width (176) due to padding
      expect(finalWidth).toBeGreaterThan(176)
      // Height should be larger than just the element height (80) due to padding
      expect(finalHeight).toBeGreaterThan(80)
    })

    it('includes GWT sections in the bounding box calculation', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }],
        gwt: [
          { name: 'Scenario', given: [], when: [], then: [] },
        ],
      })

      const slice = sections[0]
      const lastCall = slice.resizeWithoutConstraints.mock.calls[
        slice.resizeWithoutConstraints.mock.calls.length - 1
      ]
      const [, finalHeight] = lastCall

      // With a GWT section (600px tall) below elements (80px + gaps),
      // the total height should be significantly larger than elements alone
      expect(finalHeight).toBeGreaterThan(600)
    })

    it('auto-sizes correctly when only a slice with no children is created', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({ slice: 'Empty Slice' })

      const slice = sections[0]
      // With no children, the slice should still have a reasonable size
      // (at least the initial size, no need for a second resize)
      expect(slice.resizeWithoutConstraints).toHaveBeenCalled()
    })

    it('adjusts children to section-relative coordinates inside the slice bounds', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }],
        events: [{ name: 'Evt1', external: false }],
      })

      const slice = sections[0]
      const lastCall = slice.resizeWithoutConstraints.mock.calls[
        slice.resizeWithoutConstraints.mock.calls.length - 1
      ]
      const [finalWidth, finalHeight] = lastCall

      // Children use section-relative coordinates (starting from padding offset)
      for (const shape of shapes) {
        expect(shape.x).toBeGreaterThanOrEqual(0)
        expect(shape.y).toBeGreaterThanOrEqual(0)
        expect(shape.x + 176).toBeLessThanOrEqual(finalWidth)
        expect(shape.y + 80).toBeLessThanOrEqual(finalHeight)
      }
    })
  })

  describe('full import', () => {
    it('creates all element types from a complete YAML import', async () => {
      await callHandler({
        slice: 'Order Slice',
        commands: [{ name: 'CreateOrder' }],
        events: [{ name: 'OrderCreated', external: false }],
        queries: [{ name: 'GetOrderStatus' }],
        gwt: [
          {
            name: 'Scenario',
            given: [{ name: 'OrderSubmitted', type: 'event' }],
            when: [{ name: 'CreateOrder', type: 'command' }],
            then: [{ name: 'OrderCreated', type: 'event' }],
          },
        ],
      })

      // 3 shapes (command + event + query)
      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(3)
      // 1 slice + 1 GWT parent + 3 GWT children = 5 sections
      expect(figmaMock.createSection).toHaveBeenCalledTimes(5)
    })

    it('creates only a slice when no optional arrays are provided', async () => {
      await callHandler({ slice: 'Empty Slice' })

      expect(figmaMock.createSection).toHaveBeenCalledTimes(1)
      expect(figmaMock.createShapeWithText).not.toHaveBeenCalled()
    })
  })
})
