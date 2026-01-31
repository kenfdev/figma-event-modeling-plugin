import { describe, it, expect } from 'vitest'
import { parseImportYaml } from './parser'

describe('parseImportYaml', () => {
  it('parses valid YAML with all fields', () => {
    const yaml = `
slice: Order Processing Slice
commands:
  - name: CreateOrder
    fields: |
      userId: string
      items: array
    notes: Customer checkout flow
events:
  - name: OrderCreated
    external: false
    fields: |
      orderId: string
queries:
  - name: GetOrderStatus
    fields: |
      orderId: string
gwt:
  - name: Order Creation Scenario
    given:
      - name: OrderSubmitted
        type: event
    when:
      - name: CreateOrder
        type: command
    then:
      - name: OrderCreated
        type: event
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.slice).toBe('Order Processing Slice')
    expect(result.data.commands).toHaveLength(1)
    expect(result.data.commands![0].name).toBe('CreateOrder')
    expect(result.data.commands![0].fields).toContain('userId: string')
    expect(result.data.commands![0].notes).toBe('Customer checkout flow')
    expect(result.data.events).toHaveLength(1)
    expect(result.data.events![0].name).toBe('OrderCreated')
    expect(result.data.events![0].external).toBe(false)
    expect(result.data.queries).toHaveLength(1)
    expect(result.data.queries![0].name).toBe('GetOrderStatus')
    expect(result.data.gwt).toHaveLength(1)
    expect(result.data.gwt![0].name).toBe('Order Creation Scenario')
    expect(result.data.gwt![0].given).toEqual([
      { name: 'OrderSubmitted', type: 'event' },
    ])
    expect(result.data.gwt![0].when).toEqual([
      { name: 'CreateOrder', type: 'command' },
    ])
    expect(result.data.gwt![0].then).toEqual([
      { name: 'OrderCreated', type: 'event' },
    ])
  })

  it('parses YAML with only the required slice field', () => {
    const yaml = 'slice: Minimal Slice'
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.slice).toBe('Minimal Slice')
    expect(result.data.commands).toBeUndefined()
    expect(result.data.events).toBeUndefined()
    expect(result.data.queries).toBeUndefined()
    expect(result.data.gwt).toBeUndefined()
  })

  it('returns error when slice field is missing', () => {
    const yaml = `
commands:
  - name: CreateOrder
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toContain('slice')
  })

  it('returns error when slice field is empty', () => {
    const yaml = 'slice: '
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toContain('slice')
  })

  it('returns error when YAML is invalid syntax', () => {
    const yaml = 'slice: [invalid: yaml: content'
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
  })

  it('returns error when input is empty', () => {
    const result = parseImportYaml('')
    expect(result.success).toBe(false)
  })

  it('returns error when a command is missing name', () => {
    const yaml = `
slice: Test Slice
commands:
  - fields: |
      userId: string
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toContain('name')
  })

  it('returns error when an event is missing name', () => {
    const yaml = `
slice: Test Slice
events:
  - external: true
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toContain('name')
  })

  it('returns error when a query is missing name', () => {
    const yaml = `
slice: Test Slice
queries:
  - fields: |
      orderId: string
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toContain('name')
  })

  it('returns error when a gwt entry is missing name', () => {
    const yaml = `
slice: Test Slice
gwt:
  - given:
      - name: Something
        type: event
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toContain('name')
  })

  it('defaults event external flag to false when not specified', () => {
    const yaml = `
slice: Test Slice
events:
  - name: SomeEvent
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.events![0].external).toBe(false)
  })

  it('parses event with external flag set to true', () => {
    const yaml = `
slice: Test Slice
events:
  - name: ExternalEvent
    external: true
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.events![0].external).toBe(true)
  })

  it('parses multiple elements in each array', () => {
    const yaml = `
slice: Multi Slice
commands:
  - name: Cmd1
  - name: Cmd2
events:
  - name: Evt1
  - name: Evt2
queries:
  - name: Qry1
  - name: Qry2
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.commands).toHaveLength(2)
    expect(result.data.events).toHaveLength(2)
    expect(result.data.queries).toHaveLength(2)
  })

  it('returns error when commands is not an array', () => {
    const yaml = `
slice: Test Slice
commands: not-an-array
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toContain('commands')
  })

  it('returns error when input is not a valid YAML object', () => {
    const yaml = '42'
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
  })

  it('parses GWT items as typed objects with name and type', () => {
    const yaml = `
slice: Test Slice
gwt:
  - name: Happy Path
    given:
      - name: RoadmapCreated
        type: event
    when:
      - name: CreateRoadmap
        type: command
    then:
      - name: RoadmapUpdated
        type: event
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return

    const gwt = result.data.gwt![0]
    expect(gwt.given[0]).toEqual({ name: 'RoadmapCreated', type: 'event' })
    expect(gwt.when[0]).toEqual({ name: 'CreateRoadmap', type: 'command' })
    expect(gwt.then[0]).toEqual({ name: 'RoadmapUpdated', type: 'event' })
  })

  it('parses GWT items with optional fields', () => {
    const yaml = `
slice: Test Slice
gwt:
  - name: With Fields
    given: []
    when:
      - name: CreateRoadmap
        type: command
        fields: |
          title: string
          items: array
    then:
      - name: RoadmapCreated
        type: event
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return

    const whenItem = result.data.gwt![0].when[0]
    expect(whenItem.name).toBe('CreateRoadmap')
    expect(whenItem.type).toBe('command')
    expect(whenItem.fields).toContain('title: string')
  })

  it('parses GWT items with error type', () => {
    const yaml = `
slice: Test Slice
gwt:
  - name: Error Scenario
    given: []
    when:
      - name: CreateRoadmap
        type: command
    then:
      - name: DuplicateTitleError
        type: error
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return

    const thenItem = result.data.gwt![0].then[0]
    expect(thenItem.name).toBe('DuplicateTitleError')
    expect(thenItem.type).toBe('error')
  })

  it('parses GWT entry with optional description', () => {
    const yaml = `
slice: Test Slice
gwt:
  - name: Duplicate Title
    description: Roadmaps with exact same title are not allowed.
    given: []
    when:
      - name: CreateRoadmap
        type: command
    then:
      - name: DuplicateTitleError
        type: error
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.gwt![0].description).toBe(
      'Roadmaps with exact same title are not allowed.',
    )
  })

  it('omits description when not provided in GWT entry', () => {
    const yaml = `
slice: Test Slice
gwt:
  - name: No Description
    given: []
    when:
      - name: DoSomething
        type: command
    then:
      - name: SomethingDone
        type: event
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.gwt![0].description).toBeUndefined()
  })

  it('returns error when GWT item is missing type', () => {
    const yaml = `
slice: Test Slice
gwt:
  - name: Bad Item
    given:
      - name: SomeEvent
    when: []
    then: []
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toContain('type')
  })

  it('returns error when GWT item is missing name', () => {
    const yaml = `
slice: Test Slice
gwt:
  - name: Bad Item
    given:
      - type: event
    when: []
    then: []
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toContain('name')
  })

  it('returns error when GWT item has invalid type', () => {
    const yaml = `
slice: Test Slice
gwt:
  - name: Invalid Type
    given:
      - name: SomeElement
        type: invalid
    when: []
    then: []
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toContain('type')
  })

  it('defaults GWT given/when/then to empty arrays when not provided', () => {
    const yaml = `
slice: Test Slice
gwt:
  - name: Empty Sections
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return

    const gwt = result.data.gwt![0]
    expect(gwt.given).toEqual([])
    expect(gwt.when).toEqual([])
    expect(gwt.then).toEqual([])
  })

  it('parses multiple GWT items in a single section', () => {
    const yaml = `
slice: Test Slice
gwt:
  - name: Multi Items
    given:
      - name: EventA
        type: event
      - name: EventB
        type: event
    when:
      - name: CommandA
        type: command
    then:
      - name: EventC
        type: event
      - name: QueryA
        type: query
`
    const result = parseImportYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return

    const gwt = result.data.gwt![0]
    expect(gwt.given).toHaveLength(2)
    expect(gwt.when).toHaveLength(1)
    expect(gwt.then).toHaveLength(2)
    expect(gwt.then[1]).toEqual({ name: 'QueryA', type: 'query' })
  })
})
