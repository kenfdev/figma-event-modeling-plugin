import { describe, it, expect } from 'vitest'
import {
  serializeFields,
  deserializeFields,
  type CustomField,
} from './field-utils'

describe('serializeFields', () => {
  it('serializes empty array to empty string', () => {
    expect(serializeFields([])).toBe('')
  })

  it('serializes single field correctly', () => {
    const fields: CustomField[] = [{ name: 'userId', type: 'string' }]
    const result = serializeFields(fields)
    expect(result).toContain('userId')
    expect(result).toContain('string')
  })

  it('serializes multiple fields correctly', () => {
    const fields: CustomField[] = [
      { name: 'userId', type: 'string' },
      { name: 'amount', type: 'number' },
    ]
    const result = serializeFields(fields)
    expect(result).toContain('userId')
    expect(result).toContain('string')
    expect(result).toContain('amount')
    expect(result).toContain('number')
  })
})

describe('deserializeFields', () => {
  it('deserializes empty string to empty array', () => {
    expect(deserializeFields('')).toEqual([])
  })

  it('deserializes blank string to empty array', () => {
    expect(deserializeFields('   ')).toEqual([])
  })

  it('deserializes valid YAML to CustomField array', () => {
    const yamlStr = 'fields:\n  - userId: string\n  - amount: number\n'
    const result = deserializeFields(yamlStr)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'userId', type: 'string' })
    expect(result[1]).toEqual({ name: 'amount', type: 'number' })
  })

  it('deserializes field with empty name and type', () => {
    const yamlStr = 'fields:\n  - "": ""\n'
    const result = deserializeFields(yamlStr)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ name: '', type: '' })
  })
})

describe('round-trip', () => {
  it('serialize then deserialize returns original array', () => {
    const original: CustomField[] = [
      { name: 'userId', type: 'string' },
      { name: 'amount', type: 'number' },
      { name: 'active', type: 'boolean' },
    ]
    const serialized = serializeFields(original)
    const deserialized = deserializeFields(serialized)
    expect(deserialized).toEqual(original)
  })

  it('empty array round-trips correctly', () => {
    const original: CustomField[] = []
    const serialized = serializeFields(original)
    expect(serialized).toBe('')
    const deserialized = deserializeFields(serialized)
    expect(deserialized).toEqual([])
  })

  it('field with empty name and type round-trips', () => {
    const original: CustomField[] = [{ name: '', type: '' }]
    const serialized = serializeFields(original)
    const deserialized = deserializeFields(serialized)
    expect(deserialized).toEqual(original)
  })

  it('fields with colons in names round-trip correctly', () => {
    const original: CustomField[] = [
      { name: 'user:identifier', type: 'string' },
      { name: 'key', type: 'value:type' },
    ]
    const serialized = serializeFields(original)
    const deserialized = deserializeFields(serialized)
    expect(deserialized).toEqual(original)
  })

  it('fields with quotes round-trip correctly', () => {
    const original: CustomField[] = [
      { name: 'field"with"quotes', type: "type'with'single" },
    ]
    const serialized = serializeFields(original)
    const deserialized = deserializeFields(serialized)
    expect(deserialized).toEqual(original)
  })

  it('fields with unicode round-trip correctly', () => {
    const original: CustomField[] = [
      { name: 'название', type: 'строка' },
      { name: '名前', type: '文字列' },
    ]
    const serialized = serializeFields(original)
    const deserialized = deserializeFields(serialized)
    expect(deserialized).toEqual(original)
  })
})

describe('deserializeFields error handling', () => {
  it('returns empty array for invalid YAML syntax', () => {
    expect(deserializeFields('invalid: yaml: syntax: [')).toEqual([])
  })

  it('returns empty array for non-object YAML', () => {
    expect(deserializeFields('just a string')).toEqual([])
  })

  it('returns empty array for array YAML', () => {
    expect(deserializeFields('- item1\n- item2')).toEqual([])
  })

  it('returns empty array when fields is not an array', () => {
    expect(deserializeFields('fields: not an array')).toEqual([])
  })

  it('returns empty array for bare string field entries', () => {
    expect(deserializeFields('fields:\n  - just-a-string\n')).toEqual([])
  })

  it('returns empty array for empty object field entries', () => {
    expect(deserializeFields('fields:\n  - {}\n')).toEqual([])
  })

  it('returns empty array for multi-key field entries', () => {
    expect(deserializeFields('fields:\n  - name: string\n    extra: value\n')).toEqual([])
  })

  it('returns empty array for non-string field values', () => {
    expect(deserializeFields('fields:\n  - count: 42\n')).toEqual([])
  })
})
