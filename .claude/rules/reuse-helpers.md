---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# Reuse Existing Helpers

- Use project utility functions (e.g., `copyToClipboard` in `Panel.tsx`) instead of calling browser APIs like `navigator.clipboard.writeText` directly
- Project helpers include fallbacks for restricted environments like Figma plugin iframes where standard APIs may be unavailable
