import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

interface UpdateSliceIssueUrlPayload {
  id: string
  issueUrl: string
}

function findIssueMarker(
  node: SceneNode & { children?: readonly SceneNode[] }
): SceneNode | undefined {
  if (!node.children) return undefined
  return node.children.find(
    (child) => child.getPluginData('isIssueMarker') === 'true'
  )
}

export async function handleUpdateSliceIssueUrl(
  payload: unknown,
  { figma }: MessageHandlerContext
): Promise<void> {
  const { id, issueUrl } = payload as UpdateSliceIssueUrlPayload

  const node = (await figma.getNodeByIdAsync(id)) as
    | (SceneNode & { children?: readonly SceneNode[]; appendChild?: (child: SceneNode) => void })
    | null
  if (!node) {
    return
  }

  node.setPluginData('issueUrl', issueUrl)

  const existingMarker = findIssueMarker(node)

  if (issueUrl) {
    if (!existingMarker) {
      await figma.loadFontAsync({ family: 'Inter', style: 'Medium' })
      const marker = figma.createText()
      marker.characters = '🔗'
      marker.fontSize = 14
      marker.x = 8
      marker.y = 8
      marker.hyperlink = { type: 'URL', value: issueUrl }
      marker.setPluginData('isIssueMarker', 'true')
      if (node.appendChild) {
        node.appendChild(marker)
      }
    } else {
      (existingMarker as TextNode).hyperlink = { type: 'URL', value: issueUrl }
    }
  } else {
    if (existingMarker) {
      existingMarker.remove()
    }
  }
}
