---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
---

# Test Coverage

- When code has defensive runtime checks (e.g., `'method' in obj`, `typeof x !== 'undefined'`), write tests for both the success path and the fallback path
- Test error/edge cases, not just the happy path
