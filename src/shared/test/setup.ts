import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { createFigmaMock } from './mocks/figma'

// Set up Figma global mock
globalThis.figma = createFigmaMock()

// Mock parent.postMessage for UI-to-sandbox communication
globalThis.parent = {
  postMessage: vi.fn(),
} as unknown as Window
