# Internationalization (i18n)

## Type
Enhancement

## Description
Add internationalization support to the plugin panel UI. English is the default language, with Japanese as the second supported locale. Language is auto-detected from the browser locale and can be manually overridden via a settings panel. The preference persists across sessions using `figma.clientStorage`.

## User Story
As a Japanese-speaking user, I want the plugin panel to display in Japanese so I can use the plugin more comfortably in my native language.

## Acceptance Criteria

### Language Detection & Persistence
- On first launch, language is auto-detected from the browser's `navigator.language`
  - `ja`, `ja-JP`, etc. → Japanese
  - Everything else → English
- Language preference is persisted per-user via `figma.clientStorage`
- Stored preference takes priority over browser detection on subsequent launches

### Settings Panel
- A gear icon is shown in the panel header
- Clicking the gear icon slides the current panel content out and reveals a settings panel
- Settings panel contains:
  - Language selector (English / Japanese)
  - A back button to return to the main panel
- Changing the language immediately updates all UI text

### Translation Scope
- All UI text in the plugin panel is translated:
  - Button labels (Create Command, Create Event, etc.)
  - Section headers
  - Placeholder text
  - Error messages
  - Status messages (e.g., "Multiple elements selected", "No selection")
  - Tooltips
  - Settings panel labels
- **Element type names are NOT translated** — Command, Event, Query, Actor, Lane, etc. remain in English regardless of locale (these are Event Modeling domain terms)
- **Canvas element text is NOT affected** — only the plugin panel UI is translated

### Supported Locales
- `en` — English (default)
- `ja` — Japanese

## Dependencies
- F0.1: OpenPluginPanel

## Technical Notes

### Architecture: React Context + Hook
- Create a `TranslationProvider` context that wraps the panel
- Provide a `useTranslation()` hook that returns a `t(key)` function
- Translation strings stored as plain TypeScript objects keyed by locale
- When locale changes, context triggers re-render of all consuming components

### Translation File Structure
```
src/shared/i18n/
  index.ts          # TranslationProvider, useTranslation hook
  locales/
    en.ts           # English translations
    ja.ts           # Japanese translations
```

### Sandbox Communication
- On plugin init, sandbox reads language preference from `figma.clientStorage.getAsync('locale')`
- Sends stored locale (or null) to UI via message
- UI falls back to `navigator.language` detection if no stored preference
- When user changes language in settings, UI sends message to sandbox to persist via `figma.clientStorage.setAsync('locale', value)`

### Settings Panel
- Settings panel is a separate view that slides in from the right (or replaces main content with animation)
- Gear icon positioned in the panel header area
- Back button in settings panel header returns to main view
