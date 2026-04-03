import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/shared/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'src/shared/test/'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
})
