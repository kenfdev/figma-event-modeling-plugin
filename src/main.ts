// Plugin sandbox code - runs in Figma's main thread with access to the Figma API

import {
  initializePlugin,
  registerHandler,
} from './features/open-plugin-panel/sandbox'
import { handleCreateCommand } from './features/create-command/sandbox'

registerHandler('create-command', handleCreateCommand)

export default function main() {
  initializePlugin({ figma })
}
