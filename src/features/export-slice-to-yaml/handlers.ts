import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import { formatSliceAsYaml, type SliceNode } from './format'

export const ORPHAN_EVENTS_NOTIFICATION =
  'Some events were skipped because they had no producing command'

export async function handleExportSliceToYaml(
  payload: { id?: string },
  { figma }: MessageHandlerContext
): Promise<void> {
  let slice: SliceNode | null = null

  if (payload?.id) {
    slice = (await figma.getNodeByIdAsync(payload.id)) as unknown as SliceNode | null
  }

  if (!slice) {
    const selection = figma.currentPage.selection
    if (!selection.length) return
    slice = selection[0] as unknown as SliceNode
  }

  const { yaml: yamlStr, orphanEvents } = formatSliceAsYaml(slice, figma)

  if (orphanEvents.length > 0) {
    figma.notify(ORPHAN_EVENTS_NOTIFICATION)
  }

  figma.ui.postMessage({
    type: 'export-slice-to-yaml-result',
    payload: { yaml: yamlStr },
  })
}
