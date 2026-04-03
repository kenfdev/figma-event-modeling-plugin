import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'figma-ui-html-compat',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          const sanitizedHtml = html.replace(/<link rel="icon"[\s\S]*?>\s*/g, '')

          return sanitizedHtml.startsWith('<!doctype html>')
            ? sanitizedHtml
            : `<!doctype html>\n${sanitizedHtml}`
        },
      },
    },
  ],
  server: {
    host: true,
  },
})
