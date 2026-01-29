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
import { handleToggleFieldsVisibility } from './features/toggle-fields-visibility/sandbox'
import { handleCreateLane } from './features/create-lane/sandbox'
import { handleCreateChapter } from './features/create-chapter/sandbox'
import { handleCreateProcessor } from './features/create-processor/sandbox'
import {
  handleCreateScreen,
  handleImagePasteIntoScreen,
} from './features/create-screen/sandbox'
import { handleCreateSlice } from './features/create-slice/sandbox'

registerHandler('create-command', handleCreateCommand)
registerHandler('create-event', handleCreateEvent)
registerHandler('create-query', handleCreateQuery)
registerHandler('create-actor', handleCreateActor)
registerHandler('update-element-name', handleUpdateElementName)
registerHandler('update-custom-fields', handleUpdateCustomFields)
registerHandler('update-notes', handleUpdateNotes)
registerHandler('toggle-event-type', handleToggleEventType)
registerHandler('toggle-fields-visibility', handleToggleFieldsVisibility)
registerHandler('create-lane', handleCreateLane)
registerHandler('create-chapter', handleCreateChapter)
registerHandler('create-processor', handleCreateProcessor)
registerHandler('create-screen', handleCreateScreen)
registerHandler('create-slice', handleCreateSlice)

export default function main() {
  initializePlugin({ figma })
  registerSelectionChangeListener({ figma })
  figma.on('documentchange', (event) => {
    handleImagePasteIntoScreen(event, { figma })
  })
}
