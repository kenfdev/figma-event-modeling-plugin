import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import { formatSliceAsYaml, type SliceNode } from '../export-slice-to-yaml/format'

export async function handleCopyMultiSliceToYaml(
  payload: { id: string },
  { figma }: MessageHandlerContext
): Promise<void> {
  try {
    const node = await figma.getNodeByIdAsync(payload.id)

    if (!node) {
      figma.ui.postMessage({
        type: 'copy-multi-slice-to-yaml-error',
        payload: { message: 'Node not found' },
      })
      return
    }

    if (node.type !== 'SECTION') {
      figma.ui.postMessage({
        type: 'copy-multi-slice-to-yaml-error',
        payload: { message: 'Node is not a section' },
      })
      return
    }

    const slices = (node.children ?? []).filter(
      (child: SceneNode) => child.getPluginData('type') === 'slice'
    )

    if (slices.length === 0) {
      figma.ui.postMessage({
        type: 'copy-multi-slice-to-yaml-error',
        payload: { message: 'No slices found' },
      })
      return
    }

    const sortedSlices = [...slices].sort((a, b) => a.x - b.x)

    const yamlParts = sortedSlices.map(slice =>
      formatSliceAsYaml(slice as unknown as SliceNode).trim()
    )

    const yaml = yamlParts.join('\n---\n') + '\n'

    figma.ui.postMessage({
      type: 'copy-multi-slice-to-yaml-result',
      payload: { yaml },
    })
  } catch {
    figma.ui.postMessage({
      type: 'copy-multi-slice-to-yaml-error',
      payload: { message: 'Unexpected error' },
    })
  }
}