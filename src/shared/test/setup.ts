// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: (id: string) => any

import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { createFigmaMock } from './mocks/figma'

// Patch @testing-library/dom matches() to normalize the query string too.
// By default, getByText() normalizes DOM text (collapsing whitespace) but NOT
// the query string, preventing multiline exact-string matching. This patch
// normalizes both sides so that e.g. getByText(JSON.stringify(obj, null, 2))
// can find a <pre> element containing that formatted JSON.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const matchesModule = require('@testing-library/dom/dist/matches')
  const originalMatches = matchesModule.matches
  matchesModule.matches = function patchedMatches(
    textToMatch: string,
    node: Element,
    matcher: unknown,
    normalizer: (text: string) => string
  ) {
    if (typeof matcher === 'string') {
      const normalizedText = normalizer(textToMatch)
      return normalizedText === normalizer(String(matcher))
    }
    return originalMatches(textToMatch, node, matcher, normalizer)
  }

  const originalFuzzyMatches = matchesModule.fuzzyMatches
  matchesModule.fuzzyMatches = function patchedFuzzyMatches(
    textToMatch: string,
    node: Element,
    matcher: unknown,
    normalizer: (text: string) => string
  ) {
    if (typeof matcher === 'string' || typeof matcher === 'number') {
      const normalizedText = normalizer(textToMatch)
      return normalizedText.toLowerCase().includes(normalizer(matcher.toString()).toLowerCase())
    }
    return originalFuzzyMatches(textToMatch, node, matcher, normalizer)
  }
} catch {
  // If the patch fails, tests will still run but multiline getByText may not work
}

// Set up Figma global mock
;(globalThis as any).figma = createFigmaMock()

// Mock parent.postMessage for UI-to-sandbox communication
globalThis.parent = {
  postMessage: vi.fn(),
} as unknown as Window

// Mock __html__ global variable (provided by Figma plugin bundler)
// This is the HTML content that gets passed to figma.showUI()
// __html__ is already declared in @figma/plugin-typings as const, so we use a type assertion
;(globalThis as any).__html__ = '<html><body></body></html>'

// Make navigator.clipboard assignable so tests can mock it via Object.assign.
// @testing-library/user-event v14 installs a clipboard stub with a getter-only
// descriptor (no setter), which makes Object.assign(navigator, {clipboard: ...})
// throw. We use a shared backing store so that test overrides persist across
// property redefinitions by userEvent.
{
  const originalDefineProperty = Object.defineProperty
  // Shared state across all clipboard property definitions
  let clipboardOverride: unknown = undefined
  let isOverridden = false

  Object.defineProperty = function patchedDefineProperty(
    obj: object,
    prop: PropertyKey,
    desc: PropertyDescriptor
  ) {
    if (obj === navigator && prop === 'clipboard' && desc.get && !desc.set) {
      const patched = { ...desc }
      const originalGetter = desc.get
      patched.get = function() {
        return isOverridden ? clipboardOverride : originalGetter.call(this)
      }
      patched.set = function(v: unknown) {
        clipboardOverride = v
        isOverridden = true
      }
      return originalDefineProperty.call(Object, obj, prop, patched)
    }
    return originalDefineProperty.call(Object, obj, prop, desc)
  } as typeof Object.defineProperty
}
