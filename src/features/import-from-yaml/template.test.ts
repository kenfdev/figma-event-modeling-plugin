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

  it('includes commands with fields and notes', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    expect(result.data.commands).toBeDefined()
    expect(result.data.commands!.length).toBeGreaterThan(0)
    const commandWithFields = result.data.commands!.find((c) => c.fields)
    expect(commandWithFields).toBeDefined()
    const commandWithNotes = result.data.commands!.find((c) => c.notes)
    expect(commandWithNotes).toBeDefined()
  })

  it('includes events with external flag', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    expect(result.data.events).toBeDefined()
    expect(result.data.events!.length).toBeGreaterThan(0)
    const externalEvent = result.data.events!.find((e) => e.external === true)
    expect(externalEvent).toBeDefined()
  })

  it('includes queries with fields', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    expect(result.data.queries).toBeDefined()
    expect(result.data.queries!.length).toBeGreaterThan(0)
    const queryWithFields = result.data.queries!.find((q) => q.fields)
    expect(queryWithFields).toBeDefined()
  })

  it('includes gwt scenarios with all item types', () => {
    const result = parseImportYaml(YAML_TEMPLATE)
    if (!result.success) throw new Error('Parse failed')
    expect(result.data.gwt).toBeDefined()
    expect(result.data.gwt!.length).toBeGreaterThan(0)

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
