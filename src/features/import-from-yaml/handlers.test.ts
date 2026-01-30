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

    it('appends each command to the current page', async () => {
      await callHandler({
        slice: 'S',
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }],
      })

      expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(shapes[0])
      expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(shapes[1])
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
  })

  describe('GWT creation', () => {
    it('creates a parent section and three child sections for each GWT entry', async () => {
      await callHandler({
        slice: 'S',
        gwt: [
          {
            name: 'Order Scenario',
            given: ['OrderSubmitted event'],
            when: ['CreateOrder command'],
            then: ['OrderCreated event'],
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
            given: ['OrderSubmitted event'],
            when: ['CreateOrder command'],
            then: ['OrderCreated event'],
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
            given: ['Item A', 'Item B'],
            when: ['Item C'],
            then: ['Item D', 'Item E', 'Item F'],
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

    it('appends the GWT parent to the current page', async () => {
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

      expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(
        sections[1]
      )
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
            given: ['OrderSubmitted'],
            when: ['CreateOrder'],
            then: ['OrderCreated'],
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
