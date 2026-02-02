---
paths:
  - "src/features/**/handlers.ts"
  - "src/main.ts"
---

# Plugin Data State Management

- When saving original state via `setPluginData`, check if a saved value already exists before writing — never overwrite a previously saved original
- After restoring state from saved plugin data keys, delete those keys with `setPluginData(key, '')` to prevent stale data on subsequent operations
