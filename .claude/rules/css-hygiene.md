---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# CSS Hygiene

- When adding a `className` to a JSX element, add matching CSS rules in `src/shared/styles/global.css`
- Never reference a CSS class in JSX without a corresponding rule in the stylesheet
