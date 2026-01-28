// Plugin sandbox code - runs in Figma's main thread with access to the Figma API

import { initializePlugin } from './features/open-plugin-panel/sandbox'

export default function main() {
  initializePlugin({ figma })
}
