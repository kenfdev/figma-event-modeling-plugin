import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

interface UpdateNotesPayload {
  id: string
  notes: string
}

export async function handleUpdateNotes(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { id, notes } = payload as UpdateNotesPayload

  const node = figma.getNodeById(id)
  if (!node) {
    return
  }

  node.setPluginData('notes', notes)
}
