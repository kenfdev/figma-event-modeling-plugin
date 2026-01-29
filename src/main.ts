// Plugin sandbox code - runs in Figma's main thread with access to the Figma API

import {
  initializePlugin,
  registerHandler,
} from './features/open-plugin-panel/sandbox'
import { handleCreateCommand } from './features/create-command/sandbox'
import { handleCreateEvent } from './features/create-event/sandbox'
import { handleCreateQuery } from './features/create-query/sandbox'
import { handleCreateActor } from './features/create-actor/sandbox'
import { registerSelectionChangeListener } from './features/view-selected-element/sandbox'
import { handleUpdateElementName } from './features/update-element-name/sandbox'
import { handleUpdateCustomFields } from './features/update-custom-fields/sandbox'
import { handleUpdateNotes } from './features/update-notes/sandbox'
import { handleToggleEventType } from './features/toggle-event-type/sandbox'

registerHandler('create-command', handleCreateCommand)
registerHandler('create-event', handleCreateEvent)
registerHandler('create-query', handleCreateQuery)
registerHandler('create-actor', handleCreateActor)
registerHandler('update-element-name', handleUpdateElementName)
registerHandler('update-custom-fields', handleUpdateCustomFields)
registerHandler('update-notes', handleUpdateNotes)
registerHandler('toggle-event-type', handleToggleEventType)

export default function main() {
  initializePlugin({ figma })
  registerSelectionChangeListener({ figma })
}
