# FigJam Event Modeling Plugin

A FigJam plugin for creating Event Modeling diagrams.

## Setup

### Prerequisites

- Node.js 18+
- Figma Desktop App (required for plugin development)

### Installation

```bash
npm install
npm run build
```

### Load Plugin in Figma

1. Open Figma Desktop App
2. Go to **Plugins → Development → Import plugin from manifest**
3. Select `manifest.json` from this project's root directory
4. Open a FigJam file
5. Run the plugin from **Resources → Plugins → Development**

## Development

Start the development server with hot module replacement:

```bash
npm run dev
```

- Edit code and Plugma auto-rebuilds
- UI changes appear instantly via HMR
- Main code changes require plugin restart in Figma

### Production Build

```bash
npm run release
```

## Debugging

- **UI Console**: In Figma, go to Plugins → Development → Open console
- **Main Console**: `console.log` statements appear in Figma's plugin console

## Project Structure

```
├── manifest.json       # Figma plugin configuration
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite bundler config
├── src/
│   ├── main.ts         # Plugin sandbox (Figma API access)
│   ├── ui/
│   │   ├── App.tsx     # Main UI component
│   │   ├── main.tsx    # UI entry point
│   │   └── styles.css  # UI styles
│   └── types/
│       └── plugin.ts   # Shared TypeScript types
└── dist/               # Build output
```
