// Plugin sandbox code - runs in Figma's main thread with access to the Figma API

import {
  initializePlugin,
  registerHandler,
} from './features/open-plugin-panel/sandbox'
import { handleCreateCommand } from './features/create-command/sandbox'
import { handleCreateEvent } from './features/create-event/sandbox'
import { handleCreateQuery } from './features/create-query/sandbox'

registerHandler('create-command', handleCreateCommand)
registerHandler('create-event', handleCreateEvent)
registerHandler('create-query', handleCreateQuery)

export default function main() {
  initializePlugin({ figma })
}
