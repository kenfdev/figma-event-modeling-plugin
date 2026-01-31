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
globalThis.figma = createFigmaMock()

// Mock parent.postMessage for UI-to-sandbox communication
globalThis.parent = {
  postMessage: vi.fn(),
} as unknown as Window

// Mock __html__ global variable (provided by Figma plugin bundler)
// This is the HTML content that gets passed to figma.showUI()
declare global {
  // eslint-disable-next-line no-var
  var __html__: string
}
globalThis.__html__ = '<html><body></body></html>'
