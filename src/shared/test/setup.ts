import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { createFigmaMock } from './mocks/figma'

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
