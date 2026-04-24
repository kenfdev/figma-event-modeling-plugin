import { describe, it, expect } from 'vitest'
import { YAML_TEMPLATE } from './template'
import { parseImportYaml } from './parser'

describe('YAML_TEMPLATE', () => {
  it('is a non-empty string', () => {
    expect(typeof YAML_TEMPLATE).toBe('string')
    expect(YAML_TEMPLATE.trim().length).toBeGreaterThan(0)
  })

  it('parses successfully with parseImportYaml', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    expect(result.success).toBe(true)
  })

  it('includes a slice name', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    expect(result.data.slice).toBeTruthy()
  })

  it('has no errors (success path)', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    expect(result.success).toBe(true)
  })

  it('has empty warnings array', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    expect(result.warnings).toEqual([])
  })

  it('has screen with type user', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    expect(result.data.screen.type).toBe('user')
  })

  it('includes commands with produces', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    expect(result.data.commands).toBeDefined()
    expect(result.data.commands!.length).toBeGreaterThan(0)
    const commandWithProduces = result.data.commands!.find((c) => c.produces && c.produces.length > 0)
    expect(commandWithProduces).toBeDefined()
  })

  it('includes queries with from_events', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    expect(result.data.queries).toBeDefined()
    expect(result.data.queries!.length).toBeGreaterThan(0)
    const queryWithFromEvents = result.data.queries!.find((q) => q.from_events && q.from_events.length > 0)
    expect(queryWithFromEvents).toBeDefined()
  })

  it('includes gwt scenarios', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    expect(result.data.gwt).toBeDefined()
    expect(result.data.gwt!.length).toBeGreaterThan(0)
  })

  it('includes gwt scenarios with command and event types', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    const allItems = result.data.gwt!.flatMap((g) => [
      ...g.given,
      ...g.when,
      ...g.then,
    ])
    const types = new Set(allItems.map((item) => item.type))
    expect(types).toContain('command')
    expect(types).toContain('event')
    expect(types).toContain('query')
    expect(types).toContain('error')
  })

  it('includes a gwt scenario with description', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    const gwtWithDescription = result.data.gwt!.find((g) => g.description)
    expect(gwtWithDescription).toBeDefined()
  })
})