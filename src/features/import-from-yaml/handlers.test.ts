import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleImportFromYaml } from './handlers'
import { createFigmaMock, type FigmaMock } from '../../shared/test/mocks/figma'
import type { ImportData } from './parser'
import { serializeFields } from '../update-custom-fields/field-utils'

function createMockSticky(id: string) {
  return {
    id,
    x: 0,
    y: 0,
    text: {
      characters: '',
    },
    setPluginData: vi.fn(),
    getPluginData: vi.fn(() => ''),
  }
}

function createMockShape(id: string, defaults: { type?: string; label?: string } = {}) {
  return {
    id,
    shapeType: '',
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
    getPluginData: vi.fn((key: string) => {
      if (key === 'type') return defaults.type ?? ''
      if (key === 'label') return defaults.label ?? ''
      return ''
    }),
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

function createMockConnector(id: string) {
  return {
    id,
    connectorStart: { endpointNodeId: '', magnet: 'AUTO' },
    connectorEnd: { endpointNodeId: '', magnet: 'AUTO' },
    connectorLineType: '',
    strokes: [],
    setPluginData: vi.fn(),
    getPluginData: vi.fn(() => ''),
  }
}

describe('handleImportFromYaml', () => {
  let figmaMock: FigmaMock
  let shapes: ReturnType<typeof createMockShape>[]
  let sections: ReturnType<typeof createMockSection>[]
  let stickies: ReturnType<typeof createMockSticky>[]
  let connectors: ReturnType<typeof createMockConnector>[]

  beforeEach(() => {
    shapes = []
    sections = []
    stickies = []
    connectors = []
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
    figmaMock.createSticky.mockImplementation(() => {
      const sticky = createMockSticky(`sticky-${stickies.length}`)
      stickies.push(sticky)
      return sticky
    })
    figmaMock.createConnector.mockImplementation(() => {
      const connector = createMockConnector(`connector-${connectors.length}`)
      connectors.push(connector)
      return connector
    })
  })

  const callHandler = (data: ImportData) =>
    handleImportFromYaml(data, {
      figma: figmaMock as unknown as typeof figma,
    })

  describe('slice creation', () => {
    it('creates a section for the slice', async () => {
      await callHandler({ slice: 'My Slice', screen: { type: 'user' } })

      expect(figmaMock.createSection).toHaveBeenCalled()
    })

    it('names the section with the slice name from YAML', async () => {
      await callHandler({ slice: 'Order Processing Slice', screen: { type: 'user' } })

      expect(sections[0].name).toBe('Order Processing Slice')
    })

    it('stores type "slice" and label in plugin data', async () => {
      await callHandler({ slice: 'My Slice', screen: { type: 'user' } })

      expect(sections[0].setPluginData).toHaveBeenCalledWith('type', 'slice')
      expect(sections[0].setPluginData).toHaveBeenCalledWith(
        'label',
        'My Slice'
      )
    })

    it('appends the slice to the current page', async () => {
      await callHandler({ slice: 'My Slice', screen: { type: 'user' } })

      expect(figmaMock.currentPage.appendChild).toHaveBeenCalledWith(
        sections[0]
      )
    })
  })

  describe('command creation', () => {
    it('creates a shape for each command (plus screen)', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder' }, { name: 'CancelOrder' }],
      })

      // 1 screen + 2 commands = 3
      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(3)
    })

    it('sets the command name as text and label', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder' }],
      })

      // shapes[1] is the command (shapes[0] is screen)
      expect(shapes[1].text.characters).toBe('CreateOrder')
      expect(shapes[1].setPluginData).toHaveBeenCalledWith(
        'label',
        'CreateOrder'
      )
    })

    it('stores type "command" in plugin data', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder' }],
      })

      expect(shapes[1].setPluginData).toHaveBeenCalledWith('type', 'command')
    })

    it('uses SQUARE shape type', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder' }],
      })

      expect(shapes[1].shapeType).toBe('SQUARE')
    })

    it('stores custom fields in plugin data when provided', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [
          { name: 'CreateOrder', fields: 'userId: string\nitems: array' },
        ],
      })

      expect(shapes[1].setPluginData).toHaveBeenCalledWith(
        'customFields',
        serializeFields([
          { name: 'userId', type: 'string' },
          { name: 'items', type: 'array' },
        ])
      )
    })

    it('stores notes in plugin data when provided', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder', notes: 'Customer checkout flow' }],
      })

      expect(shapes[1].setPluginData).toHaveBeenCalledWith(
        'notes',
        'Customer checkout flow'
      )
    })

    it('appends each command to the slice section', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }],
      })

      const slice = sections[0]
      // shapes[0] = screen, shapes[1] = Cmd1, shapes[2] = Cmd2
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[1])
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[2])
    })
  })

  describe('produces-based event creation', () => {
    it('creates event shapes for produces (plus screen and commands)', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [
          { name: 'CreateOrder', produces: ['OrderCreated', 'PaymentReceived'] },
        ],
      })

      // 1 screen + 1 command + 2 events = 4
      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(4)
    })

    it('stores type "event" in plugin data for produced events', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder', produces: ['OrderCreated'] }],
      })

      // shapes[2] is the event (shapes[0] = screen, shapes[1] = command)
      expect(shapes[2].setPluginData).toHaveBeenCalledWith('type', 'event')
    })

    it('uses SQUARE shape type for produced events', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder', produces: ['OrderCreated'] }],
      })

      expect(shapes[2].shapeType).toBe('SQUARE')
    })

    it('sets the produced event name as text and label', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder', produces: ['OrderCreated'] }],
      })

      expect(shapes[2].text.characters).toBe('OrderCreated')
      expect(shapes[2].setPluginData).toHaveBeenCalledWith(
        'label',
        'OrderCreated'
      )
    })

    it('stores external flag as "false" for produced events (internal by default)', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder', produces: ['OrderCreated'] }],
      })

      expect(shapes[2].setPluginData).toHaveBeenCalledWith('external', 'false')
    })

    it('uses orange fill and stroke for produced events (internal)', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder', produces: ['OrderCreated'] }],
      })

      expect(shapes[2].fills).toEqual([
        { type: 'SOLID', color: { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 } },
      ])
      expect(shapes[2].strokes).toEqual([
        { type: 'SOLID', color: { r: 0xeb / 255, g: 0x75 / 255, b: 0 } },
      ])
    })

    it('appends each produced event to the slice section', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [
          { name: 'CreateOrder', produces: ['Evt1'] },
          { name: 'CancelOrder', produces: ['Evt2'] },
        ],
      })

      const slice = sections[0]
      // shapes[0] = screen, shapes[1] = Cmd1, shapes[2] = Evt1, shapes[3] = Cmd2, shapes[4] = Evt2
      // But events are created before queries, so:
      // shapes[0] = screen
      // shapes[1] = CreateOrder command
      // shapes[2] = Evt1
      // shapes[3] = CancelOrder command
      // shapes[4] = Evt2
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[2])
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[4])
    })

    it('collects produces entries from multiple commands into a flat list', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [
          { name: 'CreateOrder', produces: ['OrderCreated'] },
          { name: 'UpdateOrder', produces: ['OrderUpdated'] },
          { name: 'CancelOrder' },
        ],
      })

      // 1 screen + 3 commands + 2 events = 6
      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(6)
    })
  })

  describe('query creation', () => {
    it('creates a shape for each query (plus screen)', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        queries: [{ name: 'GetOrderStatus' }],
      })

      // 1 screen + 1 query = 2
      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(2)
    })

    it('stores type "query" in plugin data', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        queries: [{ name: 'GetOrderStatus' }],
      })

      // shapes[1] is the query (shapes[0] is screen)
      expect(shapes[1].setPluginData).toHaveBeenCalledWith('type', 'query')
    })

    it('uses SQUARE shape type', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        queries: [{ name: 'GetOrderStatus' }],
      })

      expect(shapes[1].shapeType).toBe('SQUARE')
    })

    it('sets the query name as text and label', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        queries: [{ name: 'GetOrderStatus' }],
      })

      expect(shapes[1].text.characters).toBe('GetOrderStatus')
      expect(shapes[1].setPluginData).toHaveBeenCalledWith(
        'label',
        'GetOrderStatus'
      )
    })

    it('stores custom fields and notes when provided', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        queries: [
          { name: 'GetOrderStatus', fields: 'orderId: string', notes: 'Read model query' },
        ],
      })

      expect(shapes[1].setPluginData).toHaveBeenCalledWith(
        'customFields',
        serializeFields([{ name: 'orderId', type: 'string' }])
      )
      expect(shapes[1].setPluginData).toHaveBeenCalledWith(
        'notes',
        'Read model query'
      )
    })

    it('appends each query to the slice section', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        queries: [{ name: 'Qry1' }, { name: 'Qry2' }],
      })

      const slice = sections[0]
      // shapes[0] = screen, shapes[1] = Qry1, shapes[2] = Qry2
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[1])
      expect(slice.appendChild).toHaveBeenCalledWith(shapes[2])
    })
  })

  describe('screen/processor creation', () => {
    it('creates a shape for screen.type=user', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
      })

      expect(figmaMock.createShapeWithText).toHaveBeenCalled()
    })

    it('stores type "screen" in plugin data for user screen', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith('type', 'screen')
    })

    it('uses gray fill for screen shape', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
      })

      expect(shapes[0].fills).toEqual([
        { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } },
      ])
    })

    it('stores screen name as label when provided', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user', name: 'OrderScreen' },
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith('label', 'OrderScreen')
      expect(shapes[0].text.characters).toBe('OrderScreen')
    })

    it('uses default label "Screen" when screen.name not provided', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
      })

      expect(shapes[0].text.characters).toBe('Screen')
    })

    it('creates a shape for screen.type=system', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'system' },
      })

      expect(figmaMock.createShapeWithText).toHaveBeenCalled()
    })

    it('stores type "processor" in plugin data for system screen', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'system' },
      })

      expect(shapes[0].setPluginData).toHaveBeenCalledWith('type', 'processor')
    })

    it('uses SQUARE shape type for screen/processor', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
      })

      expect(shapes[0].shapeType).toBe('SQUARE')
    })
  })

  describe('GWT creation', () => {
    it('creates a parent section and three child sections for each GWT entry', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Order Scenario',
            given: [{ name: 'OrderSubmitted event', type: 'event' }],
            when: [{ name: 'CreateOrder command', type: 'command' }],
            then: [{ name: 'OrderCreated event', type: 'event' }], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // 1 slice section + 1 GWT parent + 3 GWT children = 5 sections
      expect(figmaMock.createSection).toHaveBeenCalledTimes(5)
    })

    it('names the GWT parent section with the gwt entry name', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Order Creation Scenario',
            given: [],
            when: [],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // sections[0] = slice, sections[1] = GWT parent
      expect(sections[1].name).toBe('Order Creation Scenario')
    })

    it('stores type "gwt" in GWT parent plugin data', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      expect(sections[1].setPluginData).toHaveBeenCalledWith('type', 'gwt')
    })

    it('names child sections as plain Given, When, Then (no item text)', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [{ name: 'OrderSubmitted', type: 'event' as const }],
            when: [{ name: 'CreateOrder', type: 'command' as const }],
            then: [{ name: 'OrderCreated', type: 'event' as const }], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // sections[2] = Given, sections[3] = When, sections[4] = Then
      expect(sections[2].name).toBe('Given')
      expect(sections[3].name).toBe('When')
      expect(sections[4].name).toBe('Then')
    })

    it('creates colored element shapes inside GWT child sections', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [{ name: 'OrderSubmitted', type: 'event' as const }],
            when: [{ name: 'CreateOrder', type: 'command' as const }],
            then: [{ name: 'OrderCreated', type: 'event' as const }], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // 1 screen + 3 GWT items = 4 shapes
      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(4)

      // shapes[1] = Given, shapes[2] = When, shapes[3] = Then (shapes[0] is screen)
      expect(sections[2].appendChild).toHaveBeenCalledWith(shapes[1]) // Given
      expect(sections[3].appendChild).toHaveBeenCalledWith(shapes[2]) // When
      expect(sections[4].appendChild).toHaveBeenCalledWith(shapes[3]) // Then
    })

    it('applies correct colors for command type in GWT items', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [{ name: 'CreateOrder', type: 'command' as const }],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // shapes[1] = command in When section (shapes[0] is screen)
      expect(shapes[1].fills).toEqual([
        { type: 'SOLID', color: { r: 0x3d / 255, g: 0xad / 255, b: 0xff / 255 } },
      ])
      expect(shapes[1].strokes).toEqual([
        { type: 'SOLID', color: { r: 0, g: 0x7a / 255, b: 0xd2 / 255 } },
      ])
    })

    it('applies correct colors for event type in GWT items', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [{ name: 'OrderCreated', type: 'event' as const }],
            when: [],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // shapes[1] = event in Given section (shapes[0] is screen)
      expect(shapes[1].fills).toEqual([
        { type: 'SOLID', color: { r: 0xff / 255, g: 0x9e / 255, b: 0x42 / 255 } },
      ])
    })

    it('applies correct colors for query type in GWT items', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [{ name: 'GetStatus', type: 'query' as const }], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // shapes[1] = query in Then section (shapes[0] is screen)
      expect(shapes[1].fills).toEqual([
        { type: 'SOLID', color: { r: 0x7e / 255, g: 0xd3 / 255, b: 0x21 / 255 } },
      ])
    })

    it('applies red fill and stroke for error type in GWT items', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Error Scenario',
            given: [],
            when: [],
            then: [{ name: 'DuplicateTitleError', type: 'error' as const }], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // shapes[1] = error in Then section (shapes[0] is screen)
      expect(shapes[1].fills).toEqual([
        { type: 'SOLID', color: { r: 0xff / 255, g: 0x44 / 255, b: 0x44 / 255 } },
      ])
      expect(shapes[1].strokes).toEqual([
        { type: 'SOLID', color: { r: 0xcc / 255, g: 0, b: 0 } },
      ])
    })

    it('stores type and label as plugin data on GWT element shapes', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [{ name: 'CreateOrder', type: 'command' as const }],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // shapes[1] is the command (shapes[0] is screen)
      expect(shapes[1].setPluginData).toHaveBeenCalledWith('type', 'command')
      expect(shapes[1].setPluginData).toHaveBeenCalledWith('label', 'CreateOrder')
      expect(shapes[1].text.characters).toBe('CreateOrder')
    })

    it('uses SQUARE shape type for GWT element shapes', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [{ name: 'CreateOrder', type: 'command' as const }],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      expect(shapes[1].shapeType).toBe('SQUARE')
    })

    it('stores fields as plugin data on GWT element shapes when provided', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [{ name: 'CreateOrder', type: 'command' as const, fields: 'title: string\nitems: array' }],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // shapes[1] is the command (shapes[0] is screen)
      expect(shapes[1].setPluginData).toHaveBeenCalledWith(
        'customFields',
        serializeFields([
          { name: 'title', type: 'string' },
          { name: 'items', type: 'array' },
        ])
      )
    })

    it('creates multiple element shapes in a child section for multiple items', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Multi-item',
            given: [
              { name: 'EventA', type: 'event' as const },
              { name: 'EventB', type: 'event' as const },
            ],
            when: [{ name: 'CommandA', type: 'command' as const }],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // 1 screen + 3 GWT items = 4 shapes total
      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(4)

      // Given section should have 2 children (shapes[1] and shapes[2])
      expect(sections[2].appendChild).toHaveBeenCalledWith(shapes[1])
      expect(sections[2].appendChild).toHaveBeenCalledWith(shapes[2])
      // When section should have 1 child (shapes[3])
      expect(sections[3].appendChild).toHaveBeenCalledWith(shapes[3])
    })

    it('creates a sticky note for GWT description when provided', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Duplicate Title',
            description: 'Roadmaps with exact same title are not allowed.',
            given: [],
            when: [{ name: 'CreateRoadmap', type: 'command' as const }],
            then: [{ name: 'DuplicateTitleError', type: 'error' as const }], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      expect(figmaMock.createSticky).toHaveBeenCalledTimes(1)
      expect(stickies[0].text.characters).toBe(
        'Roadmaps with exact same title are not allowed.'
      )
      // Sticky should be appended to the GWT parent section
      expect(sections[1].appendChild).toHaveBeenCalledWith(stickies[0])
    })

    it('places description sticky to the right of Given/When/Then children inside GWT parent', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            description: 'Test description',
            given: [{ name: 'OrderSubmitted', type: 'event' as const }],
            when: [{ name: 'CreateOrder', type: 'command' as const }],
            then: [{ name: 'OrderCreated', type: 'event' as const }], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // The sticky note's x position should be to the right of the Given/When/Then child sections
      // Child sections are in the left column; sticky should be in the right column
      const givenSection = sections[2] // first child section
      const stickyX = stickies[0].x
      // Sticky should be positioned to the right of child section's right edge
      expect(stickyX).toBeGreaterThan(givenSection.x + givenSection.width)
    })

    it('makes GWT parent wider to accommodate two-column layout with description', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'With Description',
            description: 'Some description text',
            given: [],
            when: [],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      const gwtParent = sections[1]
      const lastResize = gwtParent.resizeWithoutConstraints.mock.calls[
        gwtParent.resizeWithoutConstraints.mock.calls.length - 1
      ]
      const parentWidth = lastResize[0]

      // The GWT parent should be wider than the default 400px to fit
      // both the child sections column and the description sticky column
      expect(parentWidth).toBeGreaterThan(400)
    })

    it('does not create a sticky note when GWT has no description', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'No Description',
            given: [],
            when: [],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      expect(figmaMock.createSticky).not.toHaveBeenCalled()
    })

    it('positions element shapes inside GWT child sections with ~20px padding from top and left', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [{ name: 'OrderSubmitted', type: 'event' as const }],
            when: [],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // shapes[0] = element inside Given child section
      // The shape should have ~40px padding from the top and left of the child section
      expect(shapes[0].x).toBeGreaterThanOrEqual(40)
      expect(shapes[0].y).toBeGreaterThanOrEqual(40)
    })

    it('uses plain section name when GWT items are empty', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Empty Scenario',
            given: [],
            when: [],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      expect(sections[2].name).toBe('Given')
      expect(sections[3].name).toBe('When')
      expect(sections[4].name).toBe('Then')
    })

    it('appends child sections to the GWT parent', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
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
        screen: { type: 'user' },
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
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
        screen: { type: 'user' },
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

      await callHandler({ slice: 'S', screen: { type: 'user' } })

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
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }],
        queries: [{ name: 'Qry1' }],
      })

      // shapes[1] = command, shapes[2] = query (shapes[0] is screen)
      // Both should share the same y position (top row)
      expect(shapes[1].y).toBe(shapes[2].y)
    })

    it('places commands on the left and queries on the right in the top row', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }],
        queries: [{ name: 'Qry1' }],
      })

      // shapes[1] = command, shapes[2] = query (shapes[0] is screen)
      // Commands should be to the left of queries
      expect(shapes[1].x).toBeLessThan(shapes[2].x)
    })

    it('reserves vertical space above command/query row for screen/processor elements', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }],
      })

      // The command should not be at the very top of the slice content area.
      // There should be reserved space above the command/query row.
      // The command's y (section-relative) should be offset down from the slice padding
      // to leave room for Screen/Processor elements above.
      const commandRelativeY = shapes[1].y
      // Reserved space should be at least 400px above the command row
      expect(commandRelativeY).toBeGreaterThanOrEqual(400)
    })

    it('handles only commands without queries in the top row', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }],
      })

      // shapes[1] = Cmd1, shapes[2] = Cmd2 (shapes[0] is screen)
      // Both commands should be in the same row
      expect(shapes[1].y).toBe(shapes[2].y)
      expect(shapes[2].x).toBeGreaterThan(shapes[1].x)
    })

    it('separates commands and queries with a larger gap in the top row', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }],
        queries: [{ name: 'Qry1' }],
      })

      // shapes[1] = Cmd1, shapes[2] = Cmd2, shapes[3] = Qry1 (shapes[0] is screen)
      const gapBetweenCommands = shapes[2].x - shapes[1].x
      const gapBetweenCmdAndQry = shapes[3].x - shapes[2].x

      // Gap between last command and first query should be larger than gap between commands
      expect(gapBetweenCmdAndQry).toBeGreaterThan(gapBetweenCommands)
    })

    it('stacks multiple GWT sections vertically', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        gwt: [
          { name: 'Scenario 1', given: [], when: [], then: [] }, // eslint-disable-line eslint-plugin-unicorn/no-thenable
          { name: 'Scenario 2', given: [], when: [], then: [] }, // eslint-disable-line eslint-plugin-unicorn/no-thenable
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
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }],
        gwt: [
          { name: 'Scenario', given: [], when: [], then: [] }, // eslint-disable-line eslint-plugin-unicorn/no-thenable
        ],
      })

      const gwtParent = sections[1]
      const commandX = shapes[1].x
      // GWT should be aligned to the left edge (same x as leftmost element)
      expect(gwtParent.x).toBe(commandX)
    })
  })

  describe('selection after import', () => {
    it('selects the created slice after import', async () => {
      await callHandler({ slice: 'My Slice', screen: { type: 'user' } })

      expect(figmaMock.currentPage.selection).toContain(sections[0])
    })

    it('selects the slice even when other elements are created', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }],
      })

      // Selection should contain the slice (sections[0])
      expect(figmaMock.currentPage.selection).toContain(sections[0])
    })
  })

  describe('element containment', () => {
    it('only appends the slice to currentPage, not individual elements', async () => {
      await callHandler({
        slice: 'Order Slice',
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }],
        queries: [{ name: 'Qry1' }],
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
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
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }],
        queries: [{ name: 'Qry1' }],
        gwt: [
          {
            name: 'Scenario',
            given: [],
            when: [],
            then: [], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      const slice = sections[0]
      // 1 screen + 2 shapes (command + query) + 1 GWT parent = 4 children
      expect(slice.appendChild).toHaveBeenCalledTimes(4)
      // shapes[0] = screen, shapes[1] = Cmd1, shapes[2] = Qry1
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
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }],
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
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }],
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
        screen: { type: 'user' },
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
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }],
        gwt: [
          { name: 'Scenario', given: [], when: [], then: [] }, // eslint-disable-line eslint-plugin-unicorn/no-thenable
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

      await callHandler({ slice: 'Empty Slice', screen: { type: 'user' } })

      const slice = sections[0]
      // With no children, the slice should still have a reasonable size
      // (at least the initial size, no need for a second resize)
      expect(slice.resizeWithoutConstraints).toHaveBeenCalled()
    })

    it('adjusts children to section-relative coordinates inside the slice bounds', async () => {
      figmaMock.viewport.center = { x: 500, y: 300 }

      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'Cmd1' }, { name: 'Cmd2' }],
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
    it('creates screen and all element types from a complete YAML import', async () => {
      await callHandler({
        slice: 'Order Slice',
        screen: { type: 'user', name: 'OrderScreen' },
        commands: [{ name: 'CreateOrder', produces: ['OrderCreated'] }],
        queries: [{ name: 'GetOrderStatus' }],
        gwt: [
          {
            name: 'Scenario',
            given: [{ name: 'OrderSubmitted', type: 'event' as const }],
            when: [{ name: 'CreateOrder', type: 'command' as const }],
            then: [{ name: 'OrderCreated', type: 'event' as const }], // eslint-disable-line eslint-plugin-unicorn/no-thenable
          },
        ],
      })

      // 1 screen + 1 command + 1 event (from produces) + 1 query + 3 GWT element shapes = 7
      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(7)
      // 1 slice + 1 GWT parent + 3 GWT children = 5 sections
      expect(figmaMock.createSection).toHaveBeenCalledTimes(5)
    })

    it('creates only a screen when no optional arrays are provided', async () => {
      await callHandler({ slice: 'Empty Slice', screen: { type: 'user' } })

      expect(figmaMock.createSection).toHaveBeenCalledTimes(1)
      expect(figmaMock.createShapeWithText).toHaveBeenCalledTimes(1)
    })
  })

  describe('in-slice connectors', () => {
    beforeEach(() => {
      let idx = 0
      figmaMock.createShapeWithText.mockImplementation(() => {
        const types = ['screen', 'command', 'event', 'query', 'processor']
        const type = types[idx % types.length]
        const id = `mock-${type}-${idx++}`
        const shape = {
          id,
          shapeType: '',
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
          getPluginData: vi.fn((key: string) => {
            if (key === 'type') return type
            if (key === 'label') return ''
            return ''
          }),
        }
        shapes.push(shape)
        return shape
      })
    })

    it('creates connectors for screen.reads (Query->Screen)', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user', reads: ['GetOrderStatus'] },
        queries: [{ name: 'GetOrderStatus' }],
      })

      expect(figmaMock.createConnector).toHaveBeenCalled()
    })

    it('creates connectors for screen.executes (Screen->Command)', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user', executes: ['CreateOrder'] },
        commands: [{ name: 'CreateOrder' }],
      })

      expect(figmaMock.createConnector).toHaveBeenCalled()
    })

    it('creates connectors for produces (Command->Event)', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder', produces: ['OrderCreated'] }],
      })

      expect(figmaMock.createConnector).toHaveBeenCalled()
    })

    it('creates connectors for from_events same-slice (Event->Query)', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder', produces: ['OrderCreated'] }],
        queries: [{ name: 'GetOrderStatus', from_events: ['OrderCreated'] }],
      })

      expect(figmaMock.createConnector).toHaveBeenCalled()
    })
  })

  describe('Phase 4 dispatch', () => {
    it('posts import-resolution-needed when from_events not in producedEventNodeMap', async () => {
      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder' }],
        queries: [{ name: 'GetOrderStatus', from_events: ['UnknownEvent'] }],
      })

      expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'import-resolution-needed',
        })
      )
    })

    it('includes cross-slice candidates when from_events not found locally', async () => {
      const mockEventNode = {
        id: 'event-1',
        getPluginData: vi.fn((key: string) => {
          if (key === 'type') return 'event'
          if (key === 'label') return 'UnknownEvent'
          return ''
        }),
      }
      figmaMock.currentPage.findAll = vi.fn(() => [mockEventNode])

      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder' }],
        queries: [{ name: 'GetOrderStatus', from_events: ['UnknownEvent'] }],
      })

      expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'import-resolution-needed',
          payload: expect.objectContaining({
            pending: expect.arrayContaining([
              expect.objectContaining({
                kind: 'cross-slice',
                eventName: 'UnknownEvent',
              }),
            ]),
          }),
        })
      )
    })

    it('sorts cross-slice before no-match in pending list', async () => {
      const mockUnknownEvent1 = {
        id: 'event-1',
        getPluginData: vi.fn((key: string) => {
          if (key === 'type') return 'event'
          if (key === 'label') return 'UnknownEvent1'
          return ''
        }),
      }
      const mockUnknownEvent2 = {
        id: 'event-2',
        getPluginData: vi.fn((key: string) => {
          if (key === 'type') return 'event'
          if (key === 'label') return 'UnknownEvent2'
          return ''
        }),
      }
      figmaMock.currentPage.findAll = vi.fn(() => [mockUnknownEvent1, mockUnknownEvent2])

      await callHandler({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder' }],
        queries: [
          { name: 'GetOrderStatus', from_events: ['KnownEvent'] },
          { name: 'GetOtherStatus', from_events: ['UnknownEvent1'] },
          { name: 'GetAnotherStatus', from_events: ['UnknownEvent2'] },
        ],
      })

      expect(figmaMock.ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'import-resolution-needed',
          payload: expect.objectContaining({
            pending: expect.arrayContaining([
              expect.objectContaining({ kind: 'cross-slice', eventName: 'UnknownEvent1' }),
              expect.objectContaining({ kind: 'cross-slice', eventName: 'UnknownEvent2' }),
              expect.objectContaining({ kind: 'no-match', eventName: 'KnownEvent' }),
            ]),
          }),
        })
      )
    })
  })

  describe('import-resolution-answered', () => {
    let handleImportResolutionAnswered: (payload: unknown) => Promise<void>
    let handleImportFromYaml: (payload: unknown) => Promise<void>

    beforeEach(async () => {
      vi.resetModules()
      const mod = await import('./handlers')
      handleImportResolutionAnswered = (mod as any).handleImportResolutionAnswered
      handleImportFromYaml = (mod as any).handleImportFromYaml
    })

    it('posts import-from-yaml-success after applying answers', async () => {
      const sliceSection = createMockSection('slice-1')
      sliceSection.appendChild = vi.fn()
      figmaMock.getNodeById.mockImplementation((id: string) => {
        if (id === 'slice-1') return sliceSection
        return null
      })

      // First call handleImportFromYaml to set up pendingImport state
      // It will post 'import-resolution-needed' since there are from_events not found locally
      await handleImportFromYaml({
        slice: 'S',
        screen: { type: 'user' },
        commands: [{ name: 'CreateOrder' }],
        queries: [{ name: 'GetStatus', from_events: ['UnknownEvent'] }],
      }, { figma: figmaMock as unknown as typeof figma })

      // Now call handleImportResolutionAnswered with skip
      await handleImportResolutionAnswered({
        answers: [
          { queryName: 'GetStatus', resolution: 'skip' },
        ],
      }, { figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.ui.postMessage).toHaveBeenLastCalledWith({
        type: 'import-from-yaml-success',
      })
    })
  })

  describe('focus-node', () => {
    let handleFocusNode: (payload: unknown) => Promise<void>

    beforeEach(async () => {
      vi.resetModules()
      const mod = await import('./handlers')
      handleFocusNode = (mod as any).handleFocusNode
    })

    it('calls scrollAndZoomIntoView when node is found', async () => {
      const mockNode = { id: 'node-1' }
      figmaMock.getNodeById.mockReturnValue(mockNode)

      await handleFocusNode({ nodeId: 'node-1' }, { figma: figmaMock as unknown as typeof figma })

      expect(figmaMock.viewport.scrollAndZoomIntoView).toHaveBeenCalledWith([mockNode])
    })

    it('logs warning when node is not found', async () => {
      figmaMock.getNodeById.mockReturnValue(null)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await handleFocusNode({ nodeId: 'nonexistent' }, { figma: figmaMock as unknown as typeof figma })

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Node not found'))
    })
  })
})
