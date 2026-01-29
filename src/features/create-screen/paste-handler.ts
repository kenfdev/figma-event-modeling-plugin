import type { MessageHandlerContext } from '../open-plugin-panel/sandbox'

interface DocumentChange {
  type: string
  id: string
  properties?: string[]
}

interface DocumentChangeEvent {
  documentChanges: DocumentChange[]
}

function hasImageFill(node: SceneNode): boolean {
  if (!('fills' in node)) return false
  const fills = node.fills as readonly Paint[]
  return fills.some((f) => f.type === 'IMAGE')
}

function findOverlappingScreen(
  imageNode: SceneNode,
  page: PageNode
): { group: SceneNode; rect: SceneNode } | null {
  for (const child of page.children) {
    if (child.type !== 'GROUP') continue
    if (child.getPluginData('type') !== 'screen') continue
    if (child.id === imageNode.id) continue

    // Check bounding box overlap
    const ix = (imageNode as RectangleNode).x
    const iy = (imageNode as RectangleNode).y
    const gx = (child as GroupNode).x
    const gy = (child as GroupNode).y
    const gw = (child as GroupNode).width
    const gh = (child as GroupNode).height

    const overlaps =
      ix < gx + gw && ix + (imageNode as RectangleNode).width > gx &&
      iy < gy + gh && iy + (imageNode as RectangleNode).height > gy

    if (overlaps) {
      const rect = (child as GroupNode).children[0]
      return { group: child, rect }
    }
  }
  return null
}

export function handleImagePasteIntoScreen(
  event: DocumentChangeEvent,
  { figma }: MessageHandlerContext
): void {
  for (const change of event.documentChanges) {
    if (change.type !== 'CREATE') continue

    const node = figma.getNodeById(change.id) as SceneNode | null
    if (!node) continue
    if (!hasImageFill(node)) continue

    const match = findOverlappingScreen(node, figma.currentPage)
    if (!match) continue

    const { group, rect } = match
    const rectWidth = (rect as RectangleNode).width
    const rectHeight = (rect as RectangleNode).height

    // Resize image to fit screen placeholder
    ;(node as RectangleNode).resize(rectWidth, rectHeight)

    // Reposition to align with screen group
    ;(node as RectangleNode).x = (group as GroupNode).x
    ;(node as RectangleNode).y = (group as GroupNode).y

    // Set scale mode to FILL for proper cropping
    const fills = (node as RectangleNode).fills as Paint[]
    ;(node as RectangleNode).fills = fills.map((f) =>
      f.type === 'IMAGE' ? { ...f, scaleMode: 'FILL' } : f
    )
  }
}
