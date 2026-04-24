import { describe, it, expect } from 'vitest'
import { normalizeName } from './name-match'

describe('normalizeName', () => {
  it('trims leading and trailing spaces', () => {
    expect(normalizeName('  HelloWorld  ')).toBe('helloworld')
  })

  it('collapses multiple spaces to single space', () => {
    expect(normalizeName('Hello    World')).toBe('hello world')
  })

  it('collapses tabs to single space', () => {
    expect(normalizeName('Hello\tWorld')).toBe('hello world')
  })

  it('collapses newlines to single space', () => {
    expect(normalizeName('Hello\nWorld')).toBe('hello world')
  })

  it('converts to lowercase', () => {
    expect(normalizeName('HELLO WORLD')).toBe('hello world')
    expect(normalizeName('HeLLo WoRLD')).toBe('hello world')
  })

  it('is idempotent', () => {
    const original = '  Hello   World  '
    expect(normalizeName(normalizeName(original))).toBe(normalizeName(original))
  })

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeName('   ')).toBe('')
    expect(normalizeName('\t\n')).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeName('')).toBe('')
  })
})
