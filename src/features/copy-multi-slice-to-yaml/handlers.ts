import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'
import { formatSliceAsYaml, type SliceNode } from '../export-slice-to-yaml/format'

type CopyMultiSlicePayload = { id: string } | { ids: string[] }

export async function handleCopyMultiSliceToYaml(
  payload: CopyMultiSlicePayload,
  { figma }: MessageHandlerContext
): Promise<void> {
  try {
    if ('ids' in payload) {
      const nodes: SectionNode[] = []
      for (const id of payload.ids) {
        const node = await figma.getNodeByIdAsync(id)
        if (!node) {
          figma.ui.postMessage({
            type: 'copy-multi-slice-to-yaml-error',
            payload: { message: 'Node not found' },
          })
          return
        }
        if (node.type !== 'SECTION' || node.getPluginData('type') !== 'slice') {
          figma.ui.postMessage({
            type: 'copy-multi-slice-to-yaml-error',
            payload: { message: 'Selection contains a non-slice node' },
          })
          return
        }
        nodes.push(node as SectionNode)
      }

      const sortedNodes = [...nodes].sort((a, b) => a.x - b.x)
      const yamlParts = sortedNodes.map((node) =>
        formatSliceAsYaml(node as unknown as SliceNode).trim()
      )

      const yaml = yamlParts.join('\n---\n') + '\n'

      figma.ui.postMessage({
        type: 'copy-multi-slice-to-yaml-result',
        payload: { yaml },
      })
      return
    }

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